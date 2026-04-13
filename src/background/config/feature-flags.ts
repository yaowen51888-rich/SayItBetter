import type { FeatureFlags } from '../../shared/types'

const STORAGE_KEY = 'feature_flags'

/**
 * 默认功能开关配置
 */
const DEFAULT_FLAGS: FeatureFlags = {
  // 激活码系统开关
  useNewLicenseSystem: true,  // 默认启用新系统
  showMigrationNotice: false,
  oldSystemDisabled: false,

  // 买断版功能开关
  enableSmartCache: true,
  enableModelRouting: true,
  enableABGeneration: false,    // 暂未实现
  enableBatchProcessing: false, // 使用旧系统
  enableEnhancedHumanize: false, // 使用旧系统
  enableUnlimitedHistory: true,
  enableCloudBackup: false,      // 暂未实现

  // 高级功能开关
  enableAdvancedPanel: true,
  enableRouterStats: true,
  enableCacheStats: true,
}

/**
 * 获取功能开关配置
 */
export async function getFeatureFlags(): Promise<FeatureFlags> {
  const result = await chrome.storage.local.get(STORAGE_KEY)
  return { ...DEFAULT_FLAGS, ...(result[STORAGE_KEY] || {}) }
}

/**
 * 更新单个功能开关
 */
export async function setFeatureFlag<K extends keyof FeatureFlags>(
  key: K,
  value: FeatureFlags[K]
): Promise<void> {
  const flags = await getFeatureFlags()
  flags[key] = value
  await chrome.storage.local.set({ [STORAGE_KEY]: flags })
}

/**
 * 批量更新功能开关
 */
export async function setFeatureFlags(updates: Partial<FeatureFlags>): Promise<void> {
  const flags = await getFeatureFlags()
  const updated = { ...flags, ...updates }
  await chrome.storage.local.set({ [STORAGE_KEY]: updated })
}

/**
 * 检查功能是否启用
 */
export async function isFeatureEnabled<K extends keyof FeatureFlags>(
  key: K
): Promise<boolean> {
  const flags = await getFeatureFlags()
  return Boolean(flags[key])
}

/**
 * 重置所有功能开关到默认值
 */
export async function resetFeatureFlags(): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: DEFAULT_FLAGS })
}

/**
 * 渐进式启用新系统
 */
export async function enableNewSystemGradually(): Promise<void> {
  // 第一步：启用激活码系统，但保留旧系统
  await setFeatureFlag('useNewLicenseSystem', true)
  await setFeatureFlag('showMigrationNotice', true)

  // 第二步：启用买断版功能（需要在激活后调用）
  await setFeatureFlag('enableSmartCache', true)
  await setFeatureFlag('enableModelRouting', true)
  await setFeatureFlag('enableAdvancedPanel', true)
  await setFeatureFlag('enableCacheStats', true)
  await setFeatureFlag('enableRouterStats', true)

  // 第三步：禁用旧系统（确认迁移完成后）
  // await setFeatureFlag('oldSystemDisabled', true)
}
