import type { RoutingDecision } from './types'

const STATS_STORAGE_KEY = 'router_stats'

interface RouterStatsData {
  totalRequests: number
  modelDistribution: Record<string, number>
  confidenceSum: number
}

/**
 * 追踪路由结果
 */
export async function trackRoutingResult(
  decision: RoutingDecision,
  _quality?: number
): Promise<void> {
  const result = await chrome.storage.local.get(STATS_STORAGE_KEY)
  const stats: RouterStatsData = result[STATS_STORAGE_KEY] || {
    totalRequests: 0,
    modelDistribution: {},
    confidenceSum: 0,
  }

  stats.totalRequests += 1
  stats.confidenceSum += decision.output.confidence

  const model = decision.output.model
  stats.modelDistribution[model] = (stats.modelDistribution[model] || 0) + 1

  await chrome.storage.local.set({ [STATS_STORAGE_KEY]: stats })
}

/**
 * 获取路由统计
 */
export async function getRouterStats(): Promise<{
  totalRequests: number
  modelDistribution: Record<string, number>
  averageConfidence: number
}> {
  const result = await chrome.storage.local.get(STATS_STORAGE_KEY)
  const stats: RouterStatsData = result[STATS_STORAGE_KEY] || {
    totalRequests: 0,
    modelDistribution: {},
    confidenceSum: 0,
  }

  return {
    totalRequests: stats.totalRequests,
    modelDistribution: stats.modelDistribution,
    averageConfidence: stats.totalRequests > 0
      ? stats.confidenceSum / stats.totalRequests
      : 0,
  }
}

/**
 * 重置路由统计
 */
export async function resetRouterStats(): Promise<void> {
  await chrome.storage.local.remove(STATS_STORAGE_KEY)
}
