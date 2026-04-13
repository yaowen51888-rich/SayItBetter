import { AIService } from './ai'
import type { AIOptions } from '../shared/types'
import type { PlatformKey } from '../shared/constants'

interface ProxyResult {
  content: string
  tokensUsed: number
  quotaExceeded?: boolean
  reason?: string
}

/**
 * API代理服务
 * 产品方提供API Key，用户无需自备
 */
export class ApiProxyService {
  // 产品方提供的API Key（从chrome.storage获取，支持动态更新）
  private static async getProviderKey(provider: string): Promise<string> {
    const result = await chrome.storage.local.get('proxyApiKeys')
    const keys = result.proxyApiKeys || {}
    return keys[provider] || ''
  }

  /**
   * 设置代理API Key
   */
  static async setProxyKey(provider: string, key: string): Promise<void> {
    const result = await chrome.storage.local.get('proxyApiKeys')
    const keys = result.proxyApiKeys || {}
    keys[provider] = key
    await chrome.storage.local.set({ proxyApiKeys: keys })
  }

  /**
   * 通过代理生成内容
   */
  static async generateContent(
    provider: string,
    content: string,
    options: {
      stylePrompt?: string
      platform?: PlatformKey
    } = {},
    aiOptions: AIOptions = {}
  ): Promise<ProxyResult> {
    // 1. 获取产品方的API Key
    const apiKey = await this.getProviderKey(provider)

    if (!apiKey) {
      // 如果产品方没有提供Key，回退到用户自己的Key
      const { StorageService } = await import('./storage')
      const settings = await StorageService.getUserSettings()

      if (!settings.apiKey) {
        return {
          content: '',
          tokensUsed: 0,
          quotaExceeded: false,
          reason: '请先配置API Key或升级到专业版',
        }
      }

      // 用户自备Key模式，直接调用
      const result = await AIService.generateContent(
        provider,
        settings.apiKey,
        content,
        options,
        aiOptions
      )

      // 用户自备Key不扣配额
      return result
    }

    // 2. 免费版：直接调用AI服务，无需检查配额
    // 3. 调用AI服务
    try {
      const result = await AIService.generateContent(
        provider,
        apiKey,
        content,
        options,
        aiOptions
      )

      return result
    } catch (error) {
      throw error
    }
  }

  /**
   * 检查是否使用代理模式
   */
  static async isProxyMode(): Promise<boolean> {
    // 检查是否有产品方提供的Key
    const result = await chrome.storage.local.get('proxyApiKeys')
    const keys = result.proxyApiKeys || {}
    return Object.values(keys).some((key: unknown) => typeof key === 'string' && key.length > 0)
  }

  /**
   * 获取可用提供商列表
   */
  static async getAvailableProviders(): Promise<string[]> {
    const result = await chrome.storage.local.get('proxyApiKeys')
    const keys = result.proxyApiKeys || {}
    return Object.entries(keys)
      .filter(([_, key]) => typeof key === 'string' && key.length > 0)
      .map(([provider, _]) => provider)
  }
}
