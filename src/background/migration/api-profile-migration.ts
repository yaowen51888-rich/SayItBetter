import type { UserSettings, ApiProfile } from '../../shared/types'
import { getRecommendedProfileModel } from '../config'

/**
 * 迁移旧数据到新的API配置格式
 */
export async function migrateToApiProfiles(settings: UserSettings): Promise<UserSettings> {
  // 如果已经有 apiProfiles，不需要迁移
  if (settings.apiProfiles && settings.apiProfiles.length > 0) {
    return settings
  }

  // 只有当存在有效的 API key 时才创建迁移后的 profile
  const apiKey = settings.apiKey || ''
  if (!apiKey) {
    return {
      ...settings,
      apiProfiles: [],
      activeProfileId: ''
    }
  }

  const provider = settings.defaultProvider || 'openai'
  const profile: ApiProfile = {
    id: `profile-migrated-${Date.now()}`,
    provider,
    apiKey,
    model: getRecommendedProfileModel(provider),
    customApiUrl: settings.customApiUrl,
    createdAt: Date.now(),
    isDefault: true
  }

  return {
    ...settings,
    apiProfiles: [profile],
    activeProfileId: profile.id
  }
}
