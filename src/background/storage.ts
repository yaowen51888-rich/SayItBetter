import { STORAGE_KEYS, DEFAULT_SETTINGS } from '../shared/constants'
import type { UserSettings, HistoryItem, UserStyle, UsageStats, ApiProfile } from '../shared/types'
import { getRecommendedProfileModel } from './config/humanize-models'

export class StorageService {
  /**
   * 获取用户设置，如果不存在则返回默认设置
   */
  static async getUserSettings(): Promise<UserSettings> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.USER_SETTINGS)
    const settings = result[STORAGE_KEYS.USER_SETTINGS]
    return settings || { ...DEFAULT_SETTINGS, apiKey: '' }
  }

  /**
   * 保存用户设置
   */
  static async saveUserSettings(settings: Partial<UserSettings>): Promise<void> {
    const current = await this.getUserSettings()
    const updated = { ...current, ...settings }
    await chrome.storage.local.set({ [STORAGE_KEYS.USER_SETTINGS]: updated })
  }

  /**
   * 获取用户风格模板列表
   */
  static async getUserStyles(): Promise<UserStyle[]> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.USER_STYLES)
    return result[STORAGE_KEYS.USER_STYLES] || []
  }

  /**
   * 保存用户风格模板列表
   */
  static async saveUserStyles(styles: UserStyle[]): Promise<void> {
    await chrome.storage.local.set({ [STORAGE_KEYS.USER_STYLES]: styles })
  }

  /**
   * 添加一条历史记录
   */
  static async addHistoryItem(item: HistoryItem): Promise<void> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.HISTORY)
    const history = result[STORAGE_KEYS.HISTORY] || []

    // 添加新记录到开头
    history.unshift(item)

    // 限制最多保存 100 条
    if (history.length > 100) {
      history.splice(100)
    }

    await chrome.storage.local.set({ [STORAGE_KEYS.HISTORY]: history })

    // 更新使用统计
    await this.updateUsageStats(item.tokensUsed)
  }

  /**
   * 获取历史记录
   */
  static async getHistory(limit = 20): Promise<HistoryItem[]> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.HISTORY)
    const history = result[STORAGE_KEYS.HISTORY] || []
    return history.slice(0, limit)
  }

  /**
   * 清除历史记录
   */
  static async clearHistory(): Promise<void> {
    await chrome.storage.local.set({ [STORAGE_KEYS.HISTORY]: [] })
  }

  /**
   * 获取使用统计
   */
  static async getUsageStats(): Promise<UsageStats> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.USAGE_STATS)
    return result[STORAGE_KEYS.USAGE_STATS] || {
      totalGenerations: 0,
      totalTokens: 0,
      lastUsed: null,
    }
  }

  /**
   * 更新使用统计
   */
  private static async updateUsageStats(tokensUsed: number): Promise<void> {
    const stats = await this.getUsageStats()
    const updated: UsageStats = {
      totalGenerations: stats.totalGenerations + 1,
      totalTokens: stats.totalTokens + tokensUsed,
      lastUsed: new Date().toISOString(),
    }
    await chrome.storage.local.set({ [STORAGE_KEYS.USAGE_STATS]: updated })
  }

  /**
   * 清理超过 30 天的历史记录
   */
  static async cleanOldHistory(): Promise<void> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.HISTORY)
    const history = result[STORAGE_KEYS.HISTORY] || []
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const filtered = history.filter((item: HistoryItem) => {
      const itemDate = new Date(item.timestamp)
      return itemDate > thirtyDaysAgo
    })

    if (filtered.length !== history.length) {
      await chrome.storage.local.set({ [STORAGE_KEYS.HISTORY]: filtered })
    }
  }

  // ========== API配置管理相关 ==========

  /**
   * 获取当前激活的API配置
   */
  static async getActiveApiProfile(): Promise<ApiProfile | null> {
    let settings = await this.getUserSettings()

    // 迁移逻辑：如果还是旧格式，先迁移
    if (!settings.apiProfiles || settings.apiProfiles.length === 0) {
      await this.migrateToApiProfiles(settings)
      settings = await this.getUserSettings()
    }

    const activeId = settings.activeProfileId
    if (!activeId || !settings.apiProfiles) return null

    return settings.apiProfiles.find(p => p.id === activeId) || null
  }

  /**
   * 保存API配置列表
   */
  static async saveApiProfiles(profiles: ApiProfile[]): Promise<void> {
    const settings = await this.getUserSettings()
    settings.apiProfiles = profiles
    await this.saveUserSettings(settings)
  }

  /**
   * 添加API配置
   */
  static async addApiProfile(profile: Omit<ApiProfile, 'id' | 'createdAt' | 'isDefault'>): Promise<ApiProfile> {
    const settings = await this.getUserSettings()
    const isFirst = !settings.apiProfiles || settings.apiProfiles.length === 0

    // 若未提供 model，使用推荐值
    const model = profile.model || getRecommendedProfileModel(profile.provider)

    const newProfile: ApiProfile = {
      ...profile,
      model,
      id: `profile-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      createdAt: Date.now(),
      isDefault: isFirst
    }

    if (!settings.apiProfiles) {
      settings.apiProfiles = []
    }
    settings.apiProfiles.push(newProfile)

    // 如果是第一个配置，设为默认和激活
    if (isFirst) {
      settings.activeProfileId = newProfile.id
    }

    await this.saveUserSettings(settings)

    return newProfile
  }

  /**
   * 更新API配置
   */
  static async updateApiProfile(id: string, updates: Partial<ApiProfile>): Promise<void> {
    const settings = await this.getUserSettings()
    if (!settings.apiProfiles) return

    const index = settings.apiProfiles.findIndex(p => p.id === id)

    if (index !== -1) {
      settings.apiProfiles[index] = { ...settings.apiProfiles[index], ...updates }
      await this.saveUserSettings(settings)
    }
  }

  /**
   * 删除API配置
   */
  static async deleteApiProfile(id: string): Promise<void> {
    const settings = await this.getUserSettings()
    if (!settings.apiProfiles || settings.apiProfiles.length <= 1) {
      throw new Error('至少需要保留一个API配置')
    }

    settings.apiProfiles = settings.apiProfiles.filter(p => p.id !== id)

    // 如果删除的是当前激活的，切换到第一个
    if (settings.activeProfileId === id) {
      settings.activeProfileId = settings.apiProfiles[0].id
    }

    // 如果删除的是默认的，将第一个设为默认
    if (settings.apiProfiles.some(p => p.isDefault) && !settings.apiProfiles.find(p => p.id === id)?.isDefault) {
      // 被删除的不是默认配置，无需处理
    } else {
      // 被删除的是默认配置或没有默认配置，设置第一个为默认
      settings.apiProfiles.forEach(p => p.isDefault = false)
      settings.apiProfiles[0].isDefault = true
    }

    await this.saveUserSettings(settings)
  }

  /**
   * 设置默认配置
   */
  static async setDefaultApiProfile(id: string): Promise<void> {
    const settings = await this.getUserSettings()
    if (!settings.apiProfiles) return

    settings.apiProfiles.forEach(p => {
      p.isDefault = p.id === id
    })

    await this.saveUserSettings(settings)
  }

  /**
   * 迁移旧数据到新格式
   */
  static async migrateToApiProfiles(oldSettings: UserSettings): Promise<void> {
    // 如果已经有 apiProfiles，不需要迁移
    if (oldSettings.apiProfiles && oldSettings.apiProfiles.length > 0) {
      return
    }

    // 只有当存在有效的 API key 时才创建迁移后的 profile
    const apiKey = oldSettings.apiKey || ''
    if (!apiKey) {
      await this.saveUserSettings({
        ...oldSettings,
        apiProfiles: [],
        activeProfileId: ''
      })
      return
    }

    const profile: ApiProfile = {
      id: `profile-migrated-${Date.now()}`,
      provider: oldSettings.defaultProvider || 'openai',
      apiKey,
      model: getRecommendedProfileModel(oldSettings.defaultProvider || 'openai'),
      customApiUrl: oldSettings.customApiUrl,
      createdAt: Date.now(),
      isDefault: true
    }

    const newSettings = {
      ...oldSettings,
      apiProfiles: [profile],
      activeProfileId: profile.id
    }

    await this.saveUserSettings(newSettings)
  }
}
