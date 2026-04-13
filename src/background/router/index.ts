/**
 * 模型智能路由系统入口
 *
 * 根据文本复杂度自动选择最合适的模型，优化成本和质量。
 */

import type { RouterStats } from '../../shared/types'
import { selectModel } from './decision'
import { trackRoutingResult, getRouterStats as fetchRouterStats, resetRouterStats } from './tracker'
import { analyzeComplexity } from './analyzer'
import { getProviderConfig, supportsRouting } from './provider-config'

/**
 * 选择模型
 */
export { selectModel }

/**
 * 分析文本复杂度
 */
export { analyzeComplexity }

/**
 * 追踪路由结果
 */
export { trackRoutingResult }

/**
 * 获取提供商配置
 */
export { getProviderConfig, supportsRouting }

/**
 * 获取路由统计
 */
export async function getRouterStats(): Promise<RouterStats> {
  return fetchRouterStats()
}

/**
 * 重置路由统计
 */
export { resetRouterStats }
