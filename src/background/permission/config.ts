import type { FeaturePermissions, UserTier } from '../../shared/types'

/**
 * 权限配置
 *
 * @deprecated 免费版所有功能开放，此文件仅用于向后兼容
 */
export const TIER_PERMISSIONS: Record<UserTier, FeaturePermissions> = {
  free: {
    // 免费版所有功能开放
    maxStyles: -1,
    canCreateCustomStyle: true,
    hasBatchProcessing: true,
    hasCloudSync: false,
    hasPriorityModel: false,

    // 新增字段（所有功能开放）
    hasSmartCache: true,
    hasModelRouting: true,
    hasABGeneration: true,
    maxBatchSize: 50,
    humanizeLevel: 'enhanced',
    historyRetentionDays: -1,
    hasCloudBackup: false,
    hasPrioritySupport: false,
  },
}
