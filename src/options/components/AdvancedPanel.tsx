import { useState, useEffect } from 'react'
import type { FeaturePermissions, CacheStats, RouterStats } from '../../shared/types'

interface AdvancedPanelProps {
  permissions: FeaturePermissions
}

export function AdvancedPanel({ permissions }: AdvancedPanelProps) {
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null)
  const [routerStats, setRouterStats] = useState<RouterStats | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)
    try {
      const [cacheRes, routerRes] = await Promise.all([
        chrome.runtime.sendMessage({ type: 'CACHE_GET_STATS' }),
        chrome.runtime.sendMessage({ type: 'ROUTE_GET_STATS' }),
      ])

      if (cacheRes?.success) setCacheStats(cacheRes.stats)
      if (routerRes?.success) setRouterStats(routerRes.stats)
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClearCache = async () => {
    if (!confirm('确定要清空所有缓存吗？')) return

    try {
      await chrome.runtime.sendMessage({ type: 'CACHE_CLEAR' })
      setCacheStats(null)
      alert('缓存已清空')
    } catch (error) {
      alert('清空缓存失败')
    }
  }

  const handleResetRouterStats = async () => {
    if (!confirm('确定要重置路由统计吗？')) return

    try {
      await chrome.runtime.sendMessage({ type: 'ROUTE_RESET_STATS' })
      setRouterStats(null)
      alert('路由统计已重置')
    } catch (error) {
      alert('重置失败')
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">高级功能统计</h2>

      {/* 智能缓存 */}
      {permissions.hasSmartCache && (
        <section className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">智能缓存</h3>
            <button
              onClick={handleClearCache}
              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              清空缓存
            </button>
          </div>

          {loading ? (
            <p className="text-gray-500">加载中...</p>
          ) : cacheStats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">缓存条目</p>
                <p className="text-2xl font-bold text-gray-900">{cacheStats.totalEntries}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">命中次数</p>
                <p className="text-2xl font-bold text-green-600">{cacheStats.hitCount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">未命中次数</p>
                <p className="text-2xl font-bold text-red-600">{cacheStats.missCount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">命中率</p>
                <p className="text-2xl font-bold text-blue-600">
                  {(cacheStats.hitRate * 100).toFixed(1)}%
                </p>
              </div>
              <div className="col-span-2 md:col-span-4 mt-2">
                <p className="text-sm text-gray-600">节省 Token</p>
                <p className="text-xl font-bold text-purple-600">
                  {cacheStats.tokensSaved.toLocaleString()}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">暂无缓存数据</p>
          )}
        </section>
      )}

      {/* 模型路由 */}
      {permissions.hasModelRouting && (
        <section className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">模型路由</h3>
            <button
              onClick={handleResetRouterStats}
              className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              重置统计
            </button>
          </div>

          {loading ? (
            <p className="text-gray-500">加载中...</p>
          ) : routerStats && routerStats.totalRequests > 0 ? (
            <div>
              <div className="mb-3">
                <p className="text-sm text-gray-600">总请求数</p>
                <p className="text-2xl font-bold text-gray-900">{routerStats.totalRequests}</p>
              </div>

              <div className="mb-3">
                <p className="text-sm text-gray-600 mb-2">模型分布</p>
                <div className="space-y-1">
                  {Object.entries(routerStats.modelDistribution).map(([model, count]) => {
                    const percentage = (count / routerStats.totalRequests) * 100
                    return (
                      <div key={model} className="flex items-center gap-2">
                        <span className="text-sm w-32 truncate">{model}</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 w-12 text-right">
                          {percentage.toFixed(0)}%
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600">平均置信度</p>
                <p className="text-xl font-bold text-gray-900">
                  {(routerStats.averageConfidence * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">暂无路由数据</p>
          )}
        </section>
      )}

      {/* 数据迁移 */}
      <section className="p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">数据管理</h3>
        <div className="space-y-3">
          <button
            onClick={() => chrome.runtime.sendMessage({ type: 'MIGRATION_EXPORT_DATA' })}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            导出数据
          </button>
          <label className="block">
            <span className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-center cursor-pointer inline-block">
              导入数据
            </span>
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return

                try {
                  const { parseExportFile } = await import('../../background/migration')
                  const data = await parseExportFile(file)

                  const result = await chrome.runtime.sendMessage({
                    type: 'MIGRATION_IMPORT_DATA',
                    data: { exportData: data },
                  })

                  if (result.success) {
                    alert(`导入成功！已导入 ${result.imported} 条数据`)
                  } else {
                    alert('导入失败：' + result.errors.join(', '))
                  }
                } catch (error) {
                  alert('导入失败：' + (error as Error).message)
                }
              }}
            />
          </label>
        </div>
      </section>
    </div>
  )
}
