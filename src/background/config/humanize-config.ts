/**
 * 人性化处理配置管理
 *
 * 管理人性化处理的配置，包括模型选择、高级选项等
 */

import type { HumanizeConfig, LegacyHumanizeConfig } from '../../shared/types'
import { DEFAULT_HUMANIZE_CONFIG } from './humanize-defaults'

// 重新导出默认配置，方便其他模块使用
export { DEFAULT_HUMANIZE_CONFIG } from './humanize-defaults'

const CONFIG_KEY = 'humanizeConfig'

/**
 * 检测是否为旧格式的配置（包含 modelConfig 字段）
 */
function isLegacyConfig(config: any): config is LegacyHumanizeConfig {
  return config && typeof config === 'object' && 'modelConfig' in config
}

/**
 * 将旧格式配置迁移为新格式
 */
function migrateConfig(old: LegacyHumanizeConfig): HumanizeConfig {
  // 从旧的 providerModelMemory 中提取 humanizeModel
  let providerModelMemory: Record<string, string> | undefined
  if (old.providerModelMemory) {
    providerModelMemory = {}
    for (const [provider, models] of Object.entries(old.providerModelMemory)) {
      providerModelMemory[provider] = models.humanizeModel
    }
  }

  return {
    enabled: old.enabled,
    humanizeModel: old.modelConfig?.humanizeModel || '',
    advancedOptions: old.advancedOptions,
    providerModelMemory,
  }
}

/**
 * 获取人性化处理配置
 * 未保存过配置时返回 null，由调用方决定初始化逻辑
 * 自动迁移旧格式数据
 */
export async function getHumanizeConfig(): Promise<HumanizeConfig | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get([CONFIG_KEY], (result) => {
      const savedConfig = result[CONFIG_KEY]

      if (!savedConfig) {
        resolve(null)
        return
      }

      // 检测并迁移旧格式
      if (isLegacyConfig(savedConfig)) {
        console.log('[HumanizeConfig] 检测到旧格式配置，自动迁移')
        const migrated = migrateConfig(savedConfig)
        // 异步回写新格式，不阻塞读取
        chrome.storage.local.set({ [CONFIG_KEY]: migrated }, () => {
          console.log('[HumanizeConfig] 旧格式迁移完成')
        })
        resolve(migrated)
        return
      }

      resolve(savedConfig)
    })
  })
}

/**
 * 保存人性化处理配置
 */
export async function saveHumanizeConfig(config: HumanizeConfig): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [CONFIG_KEY]: config }, () => {
      if (chrome.runtime.lastError) {
        console.error('[HumanizeConfig] 保存失败:', chrome.runtime.lastError)
        reject(chrome.runtime.lastError)
      } else {
        resolve()
      }
    })
  })
}

/**
 * 重置人性化处理配置为默认值
 */
export async function resetHumanizeConfig(): Promise<void> {
  return saveHumanizeConfig(DEFAULT_HUMANIZE_CONFIG)
}
