import { useState, useEffect } from 'react'
import type { HumanizeConfig, CacheStats, ApiProfile } from '../../shared/types'
import { HUMANIZE_MODEL_CONFIG, getHumanizeModel } from '../../background/config'

interface HumanizeSettingsProps {
  permissions: any
  apiProfiles: ApiProfile[]
  activeProfileId: string
}

export function HumanizeSettings({ permissions, apiProfiles, activeProfileId }: HumanizeSettingsProps) {
  const [config, setConfig] = useState<HumanizeConfig | null>(null)
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // 获取当前活跃 profile
  const activeProfile = apiProfiles.find(p => p.id === activeProfileId)
  const activeProvider = activeProfile?.provider

  useEffect(() => {
    loadConfig()
    loadCacheStats()
  }, [apiProfiles, activeProfileId])

  const loadConfig = async () => {
    setLoading(true)
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_HUMANIZE_CONFIG' })

      if (response.success && response.config && typeof response.config.humanizeModel === 'string') {
        // 新格式配置
        setConfig(response.config)
      } else {
        // 未保存过或旧格式已被自动迁移
        const defaultConfig: HumanizeConfig = {
          enabled: false,
          humanizeModel: '',
          advancedOptions: {
            doublePass: false,
            temperature: 0.8,
            maxTokens: 4000,
            enableCache: true,
          },
        }
        setConfig(response.config || defaultConfig)
        // 持久化默认配置
        try {
          await chrome.runtime.sendMessage({
            type: 'SAVE_HUMANIZE_CONFIG',
            data: { config: defaultConfig },
          })
        } catch (saveError) {
          console.error('Failed to persist default config:', saveError)
        }
      }
    } catch (error) {
      console.error('Failed to load config:', error)
      setConfig({
        enabled: false,
        humanizeModel: '',
        advancedOptions: {
          doublePass: false,
          temperature: 0.8,
          maxTokens: 4000,
          enableCache: true,
        },
      })
    } finally {
      setLoading(false)
    }
  }

  const loadCacheStats = async () => {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_CACHE_STATS' })
      if (response.success && response.stats) {
        setCacheStats(response.stats)
      }
    } catch (error) {
      console.error('Failed to load cache stats:', error)
    }
  }

  const handleConfigChange = async (newConfig: HumanizeConfig) => {
    setConfig(newConfig)
    setSaving(true)
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'SAVE_HUMANIZE_CONFIG',
        data: { config: newConfig },
      })

      if (!response.success) {
        console.error('[HumanizeSettings] 保存失败:', response.error)
        alert(`保存失败: ${response.error || '未知错误'}`)
      }
    } catch (error) {
      console.error('[HumanizeSettings] 保存异常:', error)
      alert('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const handleEnableToggle = async (checked: boolean) => {
    if (!config) return

    let humanizeModel = config.humanizeModel

    // 启用时，如果 humanizeModel 为空，自动填充推荐值
    if (checked && !humanizeModel && activeProvider) {
      // 从 providerModelMemory 恢复，或使用推荐值
      humanizeModel = config.providerModelMemory?.[activeProvider]
        || getHumanizeModel(activeProvider)
    }

    await handleConfigChange({
      ...config,
      enabled: checked,
      humanizeModel,
    })
  }

  const handleHumanizeModelChange = (value: string) => {
    if (!config || !activeProvider) return

    // 同步更新 providerModelMemory
    const newMemory = {
      ...config.providerModelMemory,
      [activeProvider]: value,
    }

    handleConfigChange({
      ...config,
      humanizeModel: value,
      providerModelMemory: newMemory,
    })
  }

  const handleAdvancedChange = (field: string, value: boolean | number) => {
    if (!config) return
    handleConfigChange({
      ...config,
      advancedOptions: {
        ...config.advancedOptions,
        [field]: value,
      },
    })
  }

  const handleClearCache = async () => {
    if (!confirm('确定要清空人性化缓存吗？此操作不可撤销。')) return

    try {
      await chrome.runtime.sendMessage({ type: 'CLEAR_HUMANIZE_CACHE' })
      setCacheStats(null)
      alert('缓存已清空')
    } catch (error) {
      alert('清空缓存失败')
    }
  }

  if (loading || !config) {
    return null
  }

  // 未配置任何 API 时不显示人性化设置
  if (!apiProfiles || apiProfiles.length === 0) {
    return null
  }

  // 当前 provider 的模型列表
  const getHumanizeModels = () => {
    if (!activeProvider) return []

    const modelLists: Record<string, Array<{ value: string; label: string; recommended: boolean }>> = {
      openai: [
        { value: 'gpt-5.4', label: 'GPT-5.4', recommended: true },
        { value: 'gpt-4o', label: 'GPT-4o', recommended: false },
      ],
      claude: [
        { value: 'claude-opus-4-6', label: 'Claude Opus 4.6', recommended: true },
        { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', recommended: false },
      ],
      glm: [
        { value: 'glm-5', label: 'GLM-5', recommended: true },
      ],
      deepseek: [
        { value: 'deepseek-reasoner', label: 'DeepSeek Reasoner', recommended: true },
      ],
      qwen: [
        { value: 'qwen3-max', label: 'Qwen 3 Max', recommended: true },
      ],
      kimi: [
        { value: 'kimi-k2.5', label: 'Kimi K2.5', recommended: true },
      ],
      doubao: [
        { value: 'doubao-seed-2-0-pro-260215', label: 'Doubao Pro', recommended: true },
      ],
      wenxin: [
        { value: 'ernie-5.0', label: 'ERNIE 5.0', recommended: true },
      ],
      custom: [
        { value: config.humanizeModel || 'custom-model', label: config.humanizeModel || '自定义模型', recommended: false },
      ]
    }

    const models = modelLists[activeProvider] || []

    // 如果当前模型不在列表中，添加进去
    if (config.humanizeModel && !models.find(m => m.value === config.humanizeModel)) {
      models.push({ value: config.humanizeModel, label: config.humanizeModel, recommended: false })
    }

    // 添加自定义输入选项
    models.push({ value: '__custom__', label: '✏️ 自定义模型', recommended: false })

    return models
  }

  const providerName = activeProvider
    ? (HUMANIZE_MODEL_CONFIG[activeProvider]?.description || activeProvider)
    : '未配置'

  return (
    <div className="section">
      <h2>人性化处理</h2>

      {/* 主开关 */}
      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => handleEnableToggle(e.target.checked)}
            disabled={saving}
          />
          <span>启用人性化处理</span>
        </label>
        <p className="help">
          自动去除 AI 写作痕迹，让生成的内容更加自然流畅
        </p>
      </div>

      {/* 当前 API 配置信息（只读） */}
      {config.enabled && (
        <>
          <div className="form-group">
            <div className="readonly-info">
              <div className="info-row">
                <span className="info-label">当前提供商:</span>
                <span className="info-value">{providerName}</span>
              </div>
              <div className="info-row">
                <span className="info-label">生成模型:</span>
                <span className="info-value">{activeProfile?.model || '默认'}</span>
              </div>
            </div>
            <p className="help">如需修改提供商或生成模型，请在上方 API 配置中操作</p>
          </div>

          {/* 人性化处理模型选择 */}
          {activeProvider && (
            <div className="form-group">
              <label>人性化处理模型</label>
              <select
                value={config.humanizeModel}
                onChange={(e) => handleHumanizeModelChange(e.target.value)}
                disabled={saving}
              >
                {!config.humanizeModel && (
                  <option value="">请选择模型</option>
                )}
                {getHumanizeModels().map(model => (
                  <option key={model.value} value={model.value}>
                    {model.label}{model.recommended ? ' ⭐推荐' : ''}
                  </option>
                ))}
              </select>
              {config.humanizeModel === '__custom__' && (
                <input
                  type="text"
                  onChange={(e) => {
                    handleConfigChange({
                      ...config,
                      humanizeModel: e.target.value,
                    })
                  }}
                  placeholder="输入模型名称"
                  style={{ marginTop: '8px', padding: '10px', border: '1px solid #E5E5E5', borderRadius: '6px', width: '100%' }}
                />
              )}
              <p className="help">用于去除 AI 痕迹的二次改写，建议选择效果更强的模型</p>
            </div>
          )}

          {/* 高级选项 */}
          <div className="form-group">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="toggle-btn"
              type="button"
              style={{ width: '100%' }}
            >
              {showAdvanced ? '隐藏' : '显示'}高级选项
            </button>
          </div>

          {showAdvanced && (
            <>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={config.advancedOptions?.doublePass || false}
                    onChange={(e) => handleAdvancedChange('doublePass', e.target.checked)}
                    disabled={saving}
                  />
                  <span>二次迭代</span>
                </label>
                <p className="help">进行两次人性化处理，效果更自然但耗时更长</p>
              </div>

              <div className="form-group">
                <label>温度值: {config.advancedOptions?.temperature?.toFixed(2) || 0.8}</label>
                <input
                  type="range"
                  min="0.7"
                  max="1.0"
                  step="0.05"
                  value={config.advancedOptions?.temperature || 0.8}
                  onChange={(e) => handleAdvancedChange('temperature', parseFloat(e.target.value))}
                  disabled={saving}
                />
                <p className="help">
                  <span>保守 (0.7)</span>
                  <span style={{ float: 'right' }}>创意 (1.0)</span>
                </p>
              </div>

              <div className="form-group">
                <label>最大 Token 数</label>
                <input
                  type="number"
                  min="1000"
                  max="8000"
                  step="500"
                  value={config.advancedOptions?.maxTokens || 4000}
                  onChange={(e) => handleAdvancedChange('maxTokens', parseInt(e.target.value))}
                  disabled={saving}
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={config.advancedOptions?.enableCache !== false}
                    onChange={(e) => handleAdvancedChange('enableCache', e.target.checked)}
                    disabled={saving}
                  />
                  <span>启用缓存</span>
                </label>
                <p className="help">相同内容直接返回缓存结果，节省时间和成本</p>
              </div>
            </>
          )}
        </>
      )}

      {/* 缓存统计 */}
      {permissions?.hasSmartCache && cacheStats && (
        <div className="form-group">
          <label>缓存统计</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <div>
              <p className="help">缓存条目</p>
              <p style={{ fontSize: '20px', fontWeight: 600 }}>{cacheStats.totalEntries}</p>
            </div>
            <div>
              <p className="help">命中次数</p>
              <p style={{ fontSize: '20px', fontWeight: 600, color: '#16A34A' }}>{cacheStats.hitCount}</p>
            </div>
            <div>
              <p className="help">未命中次数</p>
              <p style={{ fontSize: '20px', fontWeight: 600, color: '#DC2626' }}>{cacheStats.missCount}</p>
            </div>
            <div>
              <p className="help">命中率</p>
              <p style={{ fontSize: '20px', fontWeight: 600, color: '#2563EB' }}>
                {(cacheStats.hitRate * 100).toFixed(1)}%
              </p>
            </div>
          </div>
          <button
            onClick={handleClearCache}
            className="btn-primary"
            disabled={saving}
            style={{ marginTop: '16px' }}
          >
            清空缓存
          </button>
        </div>
      )}

      <style>{`
        .section {
          margin-bottom: 32px;
        }

        .section h2 {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 20px;
          color: #0A0A0A;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          font-size: 14px;
          color: #0A0A0A;
        }

        .form-group select,
        .form-group input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #E5E5E5;
          border-radius: 6px;
          font-size: 14px;
          color: #0A0A0A;
          background: #FFFFFF;
          transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .form-group select:focus,
        .form-group input:focus {
          outline: none;
          border-color: #0A0A0A;
          box-shadow: 0 0 0 2px rgba(10, 10, 10, 0.05);
        }

        .readonly-info {
          background: #FAFAFA;
          border-radius: 6px;
          padding: 12px 16px;
        }

        .readonly-info .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 0;
        }

        .readonly-info .info-row:not(:last-child) {
          border-bottom: 1px solid #E5E5E5;
        }

        .readonly-info .info-label {
          font-size: 13px;
          color: #737373;
        }

        .readonly-info .info-value {
          font-size: 13px;
          font-weight: 500;
          color: #0A0A0A;
        }

        .toggle-btn {
          padding: 10px 16px;
          border: 1px solid #E5E5E5;
          border-radius: 6px;
          background: #FFFFFF;
          cursor: pointer;
          font-size: 14px;
          color: #0A0A0A;
          transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .toggle-btn:hover {
          background: #FAFAFA;
          border-color: #D4D4D4;
        }

        .help {
          margin-top: 8px;
          font-size: 13px;
          color: #737373;
          line-height: 1.5;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          padding: 12px 0;
        }

        .checkbox-label input[type="checkbox"] {
          width: auto;
          margin: 0;
          width: 18px;
          height: 18px;
          accent-color: #0A0A0A;
        }

        .checkbox-label span {
          font-size: 14px;
          color: #0A0A0A;
        }

        .btn-primary {
          width: 100%;
          padding: 12px 20px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
          background: #0A0A0A;
          color: #FFFFFF;
        }

        .btn-primary:hover:not(:disabled) {
          background: #262626;
        }

        .btn-primary:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}
