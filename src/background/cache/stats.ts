import type { CacheStats } from '../../shared/types'
import { CacheStorage } from './storage'

/**
 * 获取缓存统计
 */
export async function getCacheStats(storage: CacheStorage): Promise<CacheStats> {
  const entries = await storage.getAll()
  const misses = await storage.getMisses()

  const hitCount = entries.reduce((sum, entry) => sum + entry.metadata.hitCount, 0)
  const total = hitCount + misses

  const tokensSaved = entries.reduce((sum, entry) => {
    return sum + (entry.metadata.tokens * Math.max(0, entry.metadata.hitCount - 1))
  }, 0)

  return {
    totalEntries: entries.length,
    hitCount,
    missCount: misses,
    hitRate: total > 0 ? hitCount / total : 0,
    tokensSaved,
  }
}
