import { StorageService } from './storage'
import { AIService } from './ai'
import { DEFAULT_STYLES } from '../shared/constants'
import { migrateToApiProfiles } from './migration/api-profile-migration'
import type { MessagePayload, UserSettings, UserStyle } from '../shared/types'
import type { PlatformKey } from '../shared/constants'
import { StreamState } from '../shared/types'

// 静态导入缓存和路由模块（Service Worker 不支持动态导入的 preload helper）
import { get as cacheGet, set as cacheSet, clear as cacheClear, getStats as cacheGetStats } from './cache'
import { selectModel, trackRoutingResult, getRouterStats as routerGetStats, resetRouterStats as routerResetStats } from './router'
import { getHumanizeConfig, saveHumanizeConfig } from './config/humanize-config'
import { getHumanizeCacheStats, clearHumanizeCache } from './cache/humanize-cache'

const API_KEY_MASK_LENGTH = 8

console.log('ContentCraft AI Background Service starting...')

/**
 * 处理来自 Content Script 和 Popup 的消息
 */
chrome.runtime.onMessage.addListener((
  message: MessagePayload,
  _sender,
  sendResponse
) => {
  const { type, data } = message

  switch (type) {
    case 'GENERATE_CONTENT':
      handleGenerateContent({ ...data, tabId: _sender.tab?.id }, sendResponse)
      return true // 异步响应

    case 'GET_USER_SETTINGS':
      handleGetUserSettings(sendResponse)
      return true

    case 'SAVE_USER_SETTINGS':
      handleSaveUserSettings(data, sendResponse)
      return true

    case 'GET_USER_STYLES':
      handleGetUserStyles(sendResponse)
      return true

    case 'SAVE_USER_STYLES':
      handleSaveUserStyles(data, sendResponse)
      return true

    case 'GET_HISTORY':
      handleGetHistory(data, sendResponse)
      return true

    case 'CLEAR_HISTORY':
      handleClearHistory(sendResponse)
      return true

    // ========== 缓存相关（新增）==========
    case 'CACHE_GET':
      handleCacheGet(data, sendResponse)
      return true

    case 'CACHE_SET':
      handleCacheSet(data, sendResponse)
      return true

    case 'CACHE_CLEAR':
      handleCacheClear(sendResponse)
      return true

    case 'CACHE_GET_STATS':
      handleCacheGetStats(sendResponse)
      return true

    // ========== 人性化处理相关（新增）==========
    case 'GET_HUMANIZE_CONFIG':
      handleGetHumanizeConfig(sendResponse)
      return true

    case 'SAVE_HUMANIZE_CONFIG':
      handleSaveHumanizeConfig(data, sendResponse)
      return true

    case 'GET_CACHE_STATS':
      handleGetHumanizeCacheStats(sendResponse)
      return true

    case 'CLEAR_HUMANIZE_CACHE':
      handleClearHumanizeCache(sendResponse)
      return true

    // ========== API配置管理相关 ==========
    case 'GET_API_PROFILES':
      handleGetApiProfiles(sendResponse)
      return true

    case 'ADD_API_PROFILE':
      handleAddApiProfile(data, sendResponse)
      return true

    case 'UPDATE_API_PROFILE':
      handleUpdateApiProfile(data, sendResponse)
      return true

    case 'DELETE_API_PROFILE':
      handleDeleteApiProfile(data, sendResponse)
      return true

    case 'SET_DEFAULT_API_PROFILE':
      handleSetDefaultApiProfile(data, sendResponse)
      return true

    case 'SET_ACTIVE_API_PROFILE':
      handleSetActiveApiProfile(data, sendResponse)
      return true

    // ========== 路由相关（新增）==========
    case 'ROUTE_GET_STATS':
      handleRouteGetStats(sendResponse)
      return true

    case 'ROUTE_RESET_STATS':
      handleRouteResetStats(sendResponse)
      return true

    // ========== 迁移相关（新增）==========
    case 'MIGRATION_EXPORT_DATA':
      handleMigrationExport(sendResponse)
      return true

    case 'MIGRATION_IMPORT_DATA':
      handleMigrationImport(data, sendResponse)
      return true

    default:
      sendResponse({ error: `Unknown message type: ${type}` })
  }
})

/**
 * 处理内容生成请求（集成缓存和路由）
 */
async function handleGenerateContent(
  data: { content: string; platform?: string; style?: string; tabId?: number },
  sendResponse: (response: any) => void
) {
  try {
    const settings = await StorageService.getUserSettings()
    const styleId = data.style || settings.defaultStyle

    // 获取当前激活的 API 配置
    const activeProfile = await StorageService.getActiveApiProfile()
    if (!activeProfile || !activeProfile.apiKey) {
      sendResponse({
        error: '请先在设置中配置 API Key',
        code: 'NO_API_KEY',
      })
      return
    }

    const provider = activeProfile.provider
    const apiKey = activeProfile.apiKey

    // 获取风格提示词
    const userStyles = await StorageService.getUserStyles()
    let styleObj = userStyles.find(s => s.id === styleId)
    if (!styleObj) {
      styleObj = DEFAULT_STYLES.find(s => s.id === styleId)
    }

    const stylePrompt = styleObj?.prompt || '专业正式，商务语气'

    // 构建缓存输入
    const cacheInput = {
      input: data.content,
      style: styleId,
      platform: (data.platform as PlatformKey) || settings.defaultPlatform,
      humanize: settings.enableHumanize ?? false,
    }

    // 免费版：尝试从缓存获取
    try {
      const cached = await cacheGet(cacheInput)

      if (cached) {
        // 缓存命中
        await StorageService.addHistoryItem({
          id: `hist_${Date.now()}`,
          timestamp: new Date().toISOString(),
          originalText: data.content,
          generatedText: cached.output,
          platform: data.platform || settings.defaultPlatform,
          style: styleId,
          provider,
          tokensUsed: cached.tokens,
        })

        sendResponse({
          success: true,
          content: cached.output,
          tokensUsed: cached.tokens,
          fromCache: true,
        })
        return
      }
    } catch (error) {
      console.warn('缓存获取失败，继续生成:', error)
    }

    // 智能路由：选择最优模型
    try {
      const routing = await selectModel({
        text: data.content,
        style: styleId,
        provider,
      })

      // 追踪路由决策
      await trackRoutingResult(routing)
    } catch (error) {
      console.warn('模型路由失败，使用默认模型:', error)
    }

    // 在函数作用域内声明状态变量，使其在回调中持久化
  let thinkingStartTime = 0;
  let isInThinkingState = false;

  const result = await AIService.generateContent(
    provider,
    apiKey,
    data.content,
    {
      platform: data.platform as any || settings.defaultPlatform,
      stylePrompt,
    },
    {
      model: activeProfile.model,
      customApiUrl: activeProfile.customApiUrl,
      // 流式输出回调
      onChunk: data.tabId ? (chunk: string, state?: StreamState) => {
        // 调试日志
        if (chunk || state) {
          console.log('[Background] onChunk调用:', {
            chunkLength: chunk?.length || 0,
            chunk: chunk?.substring(0, 20),
            state,
            tabId: data.tabId
          })
        }

        if (state === 'thinking' && !isInThinkingState) {
          thinkingStartTime = Date.now();
          isInThinkingState = true;
          console.log('[Background] 切换到THINKING状态')
        } else if (state === 'generating') {
          isInThinkingState = false;
          console.log('[Background] 切换到GENERATING状态')
        }

        try {
          const message = {
            type: 'STREAM_CHUNK',
            data: {
              chunk,
              streamState: state,
              thinkingDuration: state === 'thinking' ? Date.now() - thinkingStartTime : undefined
            }
          }
          console.log('[Background] 发送STREAM_CHUNK消息:', message)
          chrome.tabs.sendMessage(data.tabId!, message).catch((error) => {
            console.error('[Background] 消息发送失败:', error)
          })
        } catch (error) {
          console.error('[Background] 发送异常:', error)
        }
      } : undefined,
    }
  )

    // 流式输出完成后，通知前端渲染 Markdown
    console.log('[Background] 检查流式完成状态:', {
      isStreamComplete: (result as any).isStreamComplete,
      tabId: data.tabId,
      hasResult: !!result
    })

    if ((result as any).isStreamComplete && data.tabId) {
      console.log('[Background] 流式输出完成，发送 STREAM_COMPLETE 消息到 tab:', data.tabId)
      try {
        chrome.tabs.sendMessage(data.tabId, {
          type: 'STREAM_COMPLETE',
          data: {}
        }).catch((error) => {
          console.error('[Background] STREAM_COMPLETE 消息发送失败:', error)
        })
        console.log('[Background] STREAM_COMPLETE 消息已发送')
      } catch (error) {
        console.error('[Background] STREAM_COMPLETE 消息发送异常:', error)
      }
    } else {
      console.log('[Background] 跳过 STREAM_COMPLETE:', {
        reason: !(result as any).isStreamComplete ? '非流式输出' : '无 tabId',
        isStreamComplete: (result as any).isStreamComplete,
        tabId: data.tabId
      })
    }

    // 保存到缓存
    try {
      await cacheSet(cacheInput, {
        output: result.content,
        model: activeProfile.model || provider,
        tokens: result.tokensUsed,
      })
    } catch (error) {
      console.warn('缓存保存失败:', error)
    }

    // 保存到历史记录
    await StorageService.addHistoryItem({
      id: `hist_${Date.now()}`,
      timestamp: new Date().toISOString(),
      originalText: data.content,
      generatedText: result.content,
      platform: data.platform || settings.defaultPlatform,
      style: styleId,
      provider,
      tokensUsed: result.tokensUsed,
    })

    sendResponse({
      success: true,
      content: result.content,
      tokensUsed: result.tokensUsed,
    })
  } catch (error) {
    console.error('Generate content error:', error)
    sendResponse({
      error: error instanceof Error ? error.message : '生成失败',
    })
  }
}

/**
 * 获取用户设置
 */
async function handleGetUserSettings(sendResponse: (response: any) => void) {
  try {
    console.log('[Background] 开始获取用户设置')
    let settings = await StorageService.getUserSettings()
    console.log('[Background] 原始设置:', settings)

    // 自动迁移旧数据到新格式
    if (!settings.apiProfiles || settings.apiProfiles.length === 0) {
      console.log('[Background] 检测到需要迁移的数据')
      try {
        settings = await migrateToApiProfiles(settings)
        console.log('[Background] 迁移后的设置:', settings)

        // 保存迁移后的数据
        if (settings.apiProfiles && settings.apiProfiles.length > 0) {
          await StorageService.saveUserSettings(settings)
          console.log('[Background] 迁移数据已保存')
        }
      } catch (migrationError) {
        console.error('[Background] 迁移失败:', migrationError)
        // 迁移失败不影响继续，使用原始数据
      }
    }

    // 不返回 API Key 的完整值
    const sanitized = {
      ...settings,
      apiKey: settings.apiKey ? `${settings.apiKey.slice(0, API_KEY_MASK_LENGTH)}...` : '',
    }
    console.log('[Background] 返回给前端的数据:', sanitized)
    sendResponse({ success: true, settings: sanitized })
  } catch (error) {
    console.error('[Background] 获取设置失败:', error)
    sendResponse({ success: false, error: '获取设置失败' })
  }
}

/**
 * 保存用户设置
 */
async function handleSaveUserSettings(
  data: Partial<UserSettings>,
  sendResponse: (response: any) => void
) {
  try {
    await StorageService.saveUserSettings(data)
    sendResponse({ success: true })
  } catch (error) {
    sendResponse({ error: '保存设置失败' })
  }
}

/**
 * 获取用户风格列表
 */
async function handleGetUserStyles(sendResponse: (response: any) => void) {
  try {
    const styles = await StorageService.getUserStyles()
    sendResponse({ success: true, styles })
  } catch (error) {
    sendResponse({ error: '获取风格失败' })
  }
}

/**
 * 保存用户风格列表
 */
async function handleSaveUserStyles(
  data: { styles: UserStyle[] },
  sendResponse: (response: any) => void
) {
  try {
    await StorageService.saveUserStyles(data.styles)
    sendResponse({ success: true })
  } catch (error) {
    sendResponse({ error: '保存风格失败' })
  }
}

/**
 * 获取历史记录
 */
async function handleGetHistory(
  data: { limit?: number },
  sendResponse: (response: any) => void
) {
  try {
    const history = await StorageService.getHistory(data?.limit || 20)
    sendResponse({ success: true, history })
  } catch (error) {
    sendResponse({ error: '获取历史失败' })
  }
}

/**
 * 清除历史记录
 */
async function handleClearHistory(sendResponse: (response: any) => void) {
  try {
    await StorageService.clearHistory()
    sendResponse({ success: true })
  } catch (error) {
    sendResponse({ error: '清除历史失败' })
  }
}

// 处理快捷键命令
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'generate-content') {
    // 获取当前活动标签页
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab.id || !tab.url) return

    const url = tab.url

    // 过滤特殊页面（content script 无法注入）
    const specialPages = ['chrome://', 'chrome-extension://', 'edge://', 'about:', 'moz-extension://', 'opera://']
    if (specialPages.some(prefix => url.startsWith(prefix))) {
      return
    }

    try {
      await chrome.tabs.sendMessage(tab.id, { type: 'SHOW_POPUP' })
    } catch {
      // Content script 未注入或页面不支持，静默忽略
    }
  }
})

// ========== 免费版迁移 ==========

/**
 * 在扩展启动时执行迁移到免费版
 */
chrome.runtime.onStartup.addListener(async () => {
  try {
    const { migrateToFreeVersion } = await import('./migration/data-export')
    await migrateToFreeVersion()
  } catch (error) {
    console.warn('迁移执行失败:', error)
  }
})

// 安装时打开设置页并初始化（合并迁移逻辑）
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('ContentCraft AI installed')

  // 执行免费版迁移
  try {
    const { migrateToFreeVersion } = await import('./migration/data-export')
    await migrateToFreeVersion()
  } catch (error) {
    console.warn('迁移执行失败:', error)
  }

  // 初始化默认风格（如果不存在）
  const existingStyles = await StorageService.getUserStyles()
  if (existingStyles.length === 0) {
    await StorageService.saveUserStyles(DEFAULT_STYLES)
  }

  // 清理旧历史记录
  await StorageService.cleanOldHistory()

  // 打开设置页
  chrome.tabs.create({ url: chrome.runtime.getURL('options/index.html') })

  // 如果是更新，显示通知
  if (details.reason === 'update') {
    console.log('[ContentCraft] 扩展已更新到免费版')
  }
})

// 定期清理历史记录（每天一次）
chrome.alarms.create('cleanOldHistory', { periodInMinutes: 24 * 60 })
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'cleanOldHistory') {
    await StorageService.cleanOldHistory()
  }
})

// ========== 缓存相关处理函数（新增）==========

/**
 * 从缓存获取
 */
async function handleCacheGet(
  data: { input: string; style: string; platform: string; humanize: boolean },
  sendResponse: (response: any) => void
) {
  try {
    const result = await cacheGet(data)
    sendResponse({ success: true, result })
  } catch (error) {
    sendResponse({ success: false, error: '获取缓存失败' })
  }
}

/**
 * 设置缓存
 */
async function handleCacheSet(
  data: { input: any; result: any },
  sendResponse: (response: any) => void
) {
  try {
    await cacheSet(data.input, data.result)
    sendResponse({ success: true })
  } catch (error) {
    sendResponse({ success: false, error: '设置缓存失败' })
  }
}

/**
 * 清空缓存
 */
async function handleCacheClear(sendResponse: (response: any) => void) {
  try {
    await cacheClear()
    sendResponse({ success: true })
  } catch (error) {
    sendResponse({ success: false, error: '清空缓存失败' })
  }
}

/**
 * 获取缓存统计
 */
async function handleCacheGetStats(sendResponse: (response: any) => void) {
  try {
    const stats = await cacheGetStats()
    sendResponse({ success: true, stats })
  } catch (error) {
    sendResponse({ success: false, error: '获取缓存统计失败' })
  }
}

// ========== 人性化处理相关处理函数（新增）==========

/**
 * 获取人性化处理配置
 */
async function handleGetHumanizeConfig(sendResponse: (response: any) => void) {
  try {
    const config = await getHumanizeConfig()
    sendResponse({ success: true, config })
  } catch (error) {
    sendResponse({ success: false, error: '获取人性化配置失败' })
  }
}

/**
 * 保存人性化处理配置
 */
async function handleSaveHumanizeConfig(
  data: { config: any },
  sendResponse: (response: any) => void
) {
  try {
    console.log('[Background] 收到保存人性化配置请求:', data.config)
    await saveHumanizeConfig(data.config)

    // 立即验证保存是否成功
    const saved = await getHumanizeConfig()
    console.log('[Background] 保存后验证:', saved)

    if (saved && saved.enabled === data.config.enabled) {
      sendResponse({ success: true })
    } else {
      console.error('[Background] 配置保存验证失败')
      sendResponse({ success: false, error: '配置保存验证失败' })
    }
  } catch (error) {
    console.error('[Background] 保存人性化配置异常:', error)
    sendResponse({ success: false, error: '保存人性化配置失败' })
  }
}

/**
 * 获取人性化处理缓存统计
 */
async function handleGetHumanizeCacheStats(sendResponse: (response: any) => void) {
  try {
    const stats = await getHumanizeCacheStats()
    sendResponse({ success: true, stats })
  } catch (error) {
    sendResponse({ success: false, error: '获取人性化缓存统计失败' })
  }
}

/**
 * 清除人性化处理缓存
 */
async function handleClearHumanizeCache(sendResponse: (response: any) => void) {
  try {
    await clearHumanizeCache()
    sendResponse({ success: true })
  } catch (error) {
    sendResponse({ success: false, error: '清除人性化缓存失败' })
  }
}

// ========== API配置管理处理函数 ==========

/**
 * 获取所有API配置
 */
async function handleGetApiProfiles(sendResponse: (response: any) => void) {
  try {
    const settings = await StorageService.getUserSettings()
    sendResponse({
      success: true,
      profiles: settings.apiProfiles || []
    })
  } catch (error) {
    sendResponse({ success: false, error: '获取API配置失败' })
  }
}

/**
 * 添加API配置
 */
async function handleAddApiProfile(data: any, sendResponse: (response: any) => void) {
  try {
    const profile = await StorageService.addApiProfile(data)
    sendResponse({ success: true, profile })
  } catch (error: any) {
    sendResponse({ success: false, error: error.message || '添加失败' })
  }
}

/**
 * 更新API配置
 */
async function handleUpdateApiProfile(data: { id: string; updates: any }, sendResponse: (response: any) => void) {
  try {
    await StorageService.updateApiProfile(data.id, data.updates)
    sendResponse({ success: true })
  } catch (error: any) {
    sendResponse({ success: false, error: error.message || '更新失败' })
  }
}

/**
 * 删除API配置
 */
async function handleDeleteApiProfile(data: { id: string }, sendResponse: (response: any) => void) {
  try {
    await StorageService.deleteApiProfile(data.id)
    sendResponse({ success: true })
  } catch (error: any) {
    sendResponse({ success: false, error: error.message || '删除失败' })
  }
}

/**
 * 设置默认API配置
 */
async function handleSetDefaultApiProfile(data: { id: string }, sendResponse: (response: any) => void) {
  try {
    await StorageService.setDefaultApiProfile(data.id)
    sendResponse({ success: true })
  } catch (error: any) {
    sendResponse({ success: false, error: error.message || '设置失败' })
  }
}

/**
 * 设置激活的API配置
 */
async function handleSetActiveApiProfile(data: { profileId: string }, sendResponse: (response: any) => void) {
  try {
    const settings = await StorageService.getUserSettings()
    settings.activeProfileId = data.profileId
    await StorageService.saveUserSettings(settings)
    sendResponse({ success: true })
  } catch (error: any) {
    sendResponse({ success: false, error: error.message || '切换失败' })
  }
}

// ========== 路由相关处理函数（新增）==========

/**
 * 获取路由统计
 */
async function handleRouteGetStats(sendResponse: (response: any) => void) {
  try {
    const stats = await routerGetStats()
    sendResponse({ success: true, stats })
  } catch (error) {
    sendResponse({ success: false, error: '获取路由统计失败' })
  }
}

/**
 * 重置路由统计
 */
async function handleRouteResetStats(sendResponse: (response: any) => void) {
  try {
    await routerResetStats()
    sendResponse({ success: true })
  } catch (error) {
    sendResponse({ success: false, error: '重置路由统计失败' })
  }
}

// ========== 迁移相关处理函数（新增）==========

/**
 * 导出用户数据
 */
async function handleMigrationExport(sendResponse: (response: any) => void) {
  try {
    const { exportUserData, generateDownloadUrl } = await import('./migration')

    const data = await exportUserData()
    const url = generateDownloadUrl(data)
    const filename = `contentcraft-export-${new Date().toISOString().split('T')[0]}.json`

    sendResponse({ success: true, url, filename })
  } catch (error) {
    sendResponse({ success: false, error: '导出数据失败' })
  }
}

/**
 * 导入用户数据
 */
async function handleMigrationImport(
  data: { exportData: any },
  sendResponse: (response: any) => void
) {
  try {
    const { importUserData } = await import('./migration')

    const plan = {
      targetStorage: {
        history: 'chrome.storage.local' as const,
        customStyles: 'chrome.storage.local' as const,
        settings: 'chrome.storage.local' as const,
      },
      importMethod: {
        autoImport: false,
        manualImport: true,
        importUrl: '',
      },
      validation: {
        checkIntegrity: true,
        maxHistoryItems: 10000,
        maxCustomStyles: 100,
      },
    }

    const result = await importUserData(data.exportData, plan)
    sendResponse(result)
  } catch (error) {
    sendResponse({ success: false, error: '导入数据失败' })
  }
}
