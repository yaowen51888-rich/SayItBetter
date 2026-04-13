import type { TokenQuota } from '../shared/types'
import { UNLIMITED_QUOTA } from '../shared/types'

/**
 * @deprecated 免费版无配额限制
 *
 * 检查用户配额 - 总是返回允许
 */
export async function checkQuota(): Promise<{
  allowed: boolean
  quota: TokenQuota
  reason?: string
}> {
  return {
    allowed: true,
    quota: UNLIMITED_QUOTA,
  }
}

/**
 * @deprecated 免费版无配额限制
 *
 * 记录使用量 - 不执行任何操作
 */
export async function recordUsage(_tokens: number): Promise<void> {
  // 不执行任何操作
}

/**
 * @deprecated 免费版无配额限制
 *
 * 重置配额 - 不执行任何操作
 */
export async function resetQuota(): Promise<void> {
  // 不执行任何操作
}
