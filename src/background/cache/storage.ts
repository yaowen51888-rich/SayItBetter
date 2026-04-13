import type { CacheEntry } from '../../shared/types'

const DB_NAME = 'ContentCraftCache'
const DB_VERSION = 1
const STORE_NAME = 'cache_entries'
const STATS_STORAGE_KEY = 'cache_stats'

interface CacheStatsData {
  misses: number
}

/**
 * IndexedDB 缓存存储
 */
export class CacheStorage {
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    if (this.db) return

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' })
          store.createIndex('cachedAt', 'metadata.cachedAt', { unique: false })
        }
      }
    })
  }

  async get(key: string): Promise<CacheEntry | null> {
    await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(key)

      request.onsuccess = async () => {
        const entry = request.result as CacheEntry | undefined

        if (entry) {
          entry.metadata.hitCount += 1
          entry.metadata.lastHitAt = Date.now()
          store.put(entry)
        } else {
          // 记录未命中
          await this.incrementMisses()
        }

        resolve(entry || null)
      }

      request.onerror = () => reject(request.error)
    })
  }

  async set(key: string, entry: Omit<CacheEntry, 'key'>): Promise<void> {
    await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)

      const fullEntry: CacheEntry = {
        key,
        ...entry,
      }

      const request = store.put(fullEntry)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async clear(): Promise<void> {
    await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.clear()

      request.onsuccess = async () => {
        // 清空统计
        await chrome.storage.local.remove(STATS_STORAGE_KEY)
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }

  async getAll(): Promise<CacheEntry[]> {
    await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async delete(key: string): Promise<void> {
    await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(key)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 增加未命中计数
   */
  private async incrementMisses(): Promise<void> {
    const result = await chrome.storage.local.get(STATS_STORAGE_KEY)
    const stats: CacheStatsData = result[STATS_STORAGE_KEY] || { misses: 0 }
    stats.misses += 1
    await chrome.storage.local.set({ [STATS_STORAGE_KEY]: stats })
  }

  /**
   * 获取未命中次数
   */
  async getMisses(): Promise<number> {
    const result = await chrome.storage.local.get(STATS_STORAGE_KEY)
    const stats: CacheStatsData = result[STATS_STORAGE_KEY] || { misses: 0 }
    return stats.misses
  }
}
