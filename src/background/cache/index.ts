/**
 * 智能缓存系统入口
 *
 * 提供基于 IndexedDB 的缓存功能，支持：
 * - 完整文本缓存（<500 字符）
 * - 分段缓存（≥500 字符）
 * - 命中统计和 Token 节省追踪
 */

import type { CacheInput, CacheResult } from '../../shared/types'
import { CacheStorage } from './storage'
import { selectCacheStrategy } from './strategy'
import { getCacheStats } from './stats'

// 单例存储实例
let storageInstance: CacheStorage | null = null

/**
 * 获取存储实例
 */
function getStorage(): CacheStorage {
  if (!storageInstance) {
    storageInstance = new CacheStorage()
  }
  return storageInstance
}

/**
 * 从缓存获取
 */
export async function get(input: CacheInput): Promise<CacheResult | null> {
  const storage = getStorage()
  const strategy = await selectCacheStrategy(input)

  if (strategy.type === 'full') {
    const entry = await storage.get(strategy.keys[0])
    if (entry) {
      return {
        output: entry.result,
        model: entry.metadata.model,
        tokens: entry.metadata.tokens,
      }
    }
  } else {
    // 分段缓存：获取所有段
    const entries = await Promise.all(
      strategy.keys.map(key => storage.get(key))
    )

    // 检查是否所有段都命中
    if (entries.every(e => e !== null)) {
      // 合并结果
      const combinedOutput = entries
        .map(e => e!.result)
        .join('')

      const firstEntry = entries[0]!
      return {
        output: combinedOutput,
        model: firstEntry.metadata.model,
        tokens: entries.reduce((sum, e) => sum + e!.metadata.tokens, 0),
      }
    }
  }

  return null
}

/**
 * 设置缓存
 */
export async function set(input: CacheInput, result: CacheResult): Promise<void> {
  const storage = getStorage()
  const strategy = await selectCacheStrategy(input)

  if (strategy.type === 'full') {
    await storage.set(strategy.keys[0], {
      inputHash: strategy.keys[0],
      result: result.output,
      metadata: {
        style: input.style,
        platform: input.platform,
        model: result.model,
        tokens: result.tokens,
        cachedAt: Date.now(),
        hitCount: 1,
        lastHitAt: Date.now(),
      },
    })
  } else {
    // 分段缓存：分别存储
    const segments = splitIntoSegments(result.output)
    const segmentTokens = Math.ceil(result.tokens / segments.length)

    await Promise.all(
      segments.map((segment, index) =>
        storage.set(strategy.keys[index], {
          inputHash: strategy.keys[index],
          result: segment,
          metadata: {
            style: input.style,
            platform: input.platform,
            model: result.model,
            tokens: segmentTokens,
            cachedAt: Date.now(),
            hitCount: 1,
            lastHitAt: Date.now(),
          },
        })
      )
    )
  }
}

/**
 * 清除缓存
 */
export async function clear(): Promise<void> {
  const storage = getStorage()
  await storage.clear()
}

/**
 * 获取缓存统计
 */
export async function getStats() {
  const storage = getStorage()
  return getCacheStats(storage)
}

/**
 * 将文本分段
 */
function splitIntoSegments(text: string): string[] {
  const maxSegmentLength = 500
  const segments: string[] = []

  for (let i = 0; i < text.length; i += maxSegmentLength) {
    segments.push(text.slice(i, i + maxSegmentLength))
  }

  return segments
}

// 导出类型和工具
export { CacheStorage }
export { selectCacheStrategy }
export type { CacheStrategy } from './strategy'

// 导出人性化处理缓存服务
export {
  getHumanizeCache,
  setHumanizeCache,
  clearHumanizeCache,
  getHumanizeCacheStats
} from './humanize-cache'
