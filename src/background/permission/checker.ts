import type { FeaturePermissions, UserTier } from '../../shared/types'
import { TIER_PERMISSIONS } from './config'

/**
 * 权限检查器
 *
 * 用于检查用户是否具有特定功能的权限。
 */
export class PermissionManager {
  private tier: UserTier
  private permissions: FeaturePermissions

  constructor(tier: UserTier = 'free') {
    this.tier = tier
    this.permissions = TIER_PERMISSIONS[tier]
  }

  /**
   * 检查是否具有某个权限
   */
  can<K extends keyof FeaturePermissions>(key: K): boolean {
    return Boolean(this.permissions[key])
  }

  /**
   * 要求具有某个权限，否则抛出错误
   */
  require<K extends keyof FeaturePermissions>(key: K): void {
    if (!this.can(key)) {
      throw new Error(`权限不足: ${key}`)
    }
  }

  /**
   * 获取权限配置
   */
  getPermissions(): FeaturePermissions {
    return { ...this.permissions }
  }

  /**
   * 更新用户等级
   */
  setTier(tier: UserTier): void {
    this.tier = tier
    this.permissions = TIER_PERMISSIONS[tier]
  }

  /**
   * 获取当前等级
   */
  getTier(): UserTier {
    return this.tier
  }

  /**
   * 检查风格数量是否在限制内
   */
  canAddStyle(currentCount: number): boolean {
    const maxStyles = this.permissions.maxStyles
    return maxStyles === -1 || currentCount < maxStyles
  }

  /**
   * 检查批量大小是否在限制内
   */
  canProcessBatch(size: number): boolean {
    return size <= this.permissions.maxBatchSize
  }
}

/**
 * 获取全局权限管理器实例
 */
export async function getGlobalPermissionManager(): Promise<PermissionManager> {
  // 从存储中获取用户等级
  const result = await chrome.storage.local.get('user_tier')
  const tier: UserTier = result.user_tier || 'free'

  return new PermissionManager(tier)
}

/**
 * 更新全局用户等级
 */
export async function setUserTier(tier: UserTier): Promise<void> {
  await chrome.storage.local.set({ user_tier: tier })
}
