/**
 * 人性化处理缓存服务
 *
 * 提供人性化处理结果的持久化缓存功能
 */

import type { HumanizeCacheEntry } from '../../shared/types'

const CACHE_KEY = 'humanizeCache'
const MAX_CACHE_SIZE = 100 // 最大缓存条目数
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 7天过期

/**
 * 获取缓存条目
 */
export async function getHumanizeCache(key: string): Promise<HumanizeCacheEntry | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get([CACHE_KEY], (result) => {
      const cache = result[CACHE_KEY] || {}
      const entry = cache[key]

      if (!entry) {
        resolve(null)
        return
      }

      // 检查是否过期
      const now = Date.now()
      if (now - entry.output.processedAt > CACHE_TTL) {
        // 删除过期条目
        delete cache[key]
        chrome.storage.local.set({ [CACHE_KEY]: cache })
        resolve(null)
        return
      }

      // 更新命中统计
      entry.metadata.hitCount += 1
      entry.metadata.lastHitAt = now
      cache[key] = entry
      chrome.storage.local.set({ [CACHE_KEY]: cache })

      resolve(entry)
    })
  })
}

/**
 * 设置缓存条目
 */
export async function setHumanizeCache(
  key: string,
  entry: Omit<HumanizeCacheEntry, 'key'>
): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([CACHE_KEY], (result) => {
      const cache = result[CACHE_KEY] || {}

      // 检查缓存大小，如果超过限制，删除最旧的条目
      const keys = Object.keys(cache)
      if (keys.length >= MAX_CACHE_SIZE) {
        // 按最后访问时间排序，删除最旧的
        const sortedKeys = keys.sort((a, b) => {
          const timeA = cache[a].metadata.lastHitAt
          const timeB = cache[b].metadata.lastHitAt
          return timeA - timeB
        })

        // 删除最旧的10%条目
        const deleteCount = Math.max(1, Math.floor(MAX_CACHE_SIZE * 0.1))
        for (let i = 0; i < deleteCount; i++) {
          delete cache[sortedKeys[i]]
        }
      }

      // 添加新条目
      cache[key] = {
        key,
        ...entry,
      }

      chrome.storage.local.set({ [CACHE_KEY]: cache }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError)
        } else {
          resolve()
        }
      })
    })
  })
}

/**
 * 清除所有缓存
 */
export async function clearHumanizeCache(): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [CACHE_KEY]: {} }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError)
      } else {
        resolve()
      }
    })
  })
}

/**
 * 获取缓存统计信息
 */
export async function getHumanizeCacheStats(): Promise<{
  totalEntries: number
  hitCount: number
  tokensSaved: number
  oldestEntry: number | null
  newestEntry: number | null
}> {
  return new Promise((resolve) => {
    chrome.storage.local.get([CACHE_KEY], (result) => {
      const cache = result[CACHE_KEY] || {}
      const entries = Object.values(cache as Record<string, HumanizeCacheEntry>)

      if (entries.length === 0) {
        resolve({
          totalEntries: 0,
          hitCount: 0,
          tokensSaved: 0,
          oldestEntry: null,
          newestEntry: null,
        })
        return
      }

      const hitCount = entries.reduce((sum, entry) => sum + entry.metadata.hitCount, 0)
      const tokensSaved = entries.reduce((sum, entry) => sum + entry.output.tokensUsed, 0)
      const oldestEntry = Math.min(...entries.map(e => e.output.processedAt))
      const newestEntry = Math.max(...entries.map(e => e.output.processedAt))

      resolve({
        totalEntries: entries.length,
        hitCount,
        tokensSaved,
        oldestEntry,
        newestEntry,
      })
    })
  })
}
