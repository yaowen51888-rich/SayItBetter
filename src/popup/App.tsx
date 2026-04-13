import { useState, useEffect } from 'react'
import { UserSettings, HumanizeConfig } from '../shared/types'
import { DEFAULT_STYLES } from '../shared/constants'
import { HumanizePanel } from './components/HumanizePanel'
import { ProcessingIndicator } from './components/ProcessingIndicator'

export function App() {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [styles, setStyles] = useState<any[]>([])
  const [hasApiKey, setHasApiKey] = useState(false)
  const [humanizeConfig, setHumanizeConfig] = useState<HumanizeConfig>({
    enabled: false,
    humanizeModel: '',
    advancedOptions: {
      doublePass: false,
      temperature: 0.8,
      maxTokens: 4000,
      enableCache: true,
    },
  })
  const [showIndicator] = useState(false)
  const [processingStage] = useState<any>('initial')
  const [processingProgress] = useState(0)

  useEffect(() => {
    checkSettings()
  }, [])

  const checkSettings = async () => {
    const [settingsRes, stylesRes, configRes] = await Promise.all([
      chrome.runtime.sendMessage({ type: 'GET_USER_SETTINGS' }),
      chrome.runtime.sendMessage({ type: 'GET_USER_STYLES' }),
      chrome.runtime.sendMessage({ type: 'GET_HUMANIZE_CONFIG' }),
    ])

    if (settingsRes.success) {
      setSettings(settingsRes.settings)
      setHasApiKey(!!settingsRes.settings.apiKey || (settingsRes.settings.apiProfiles?.length > 0))
    }

    if (stylesRes.success) {
      setStyles(stylesRes.styles)
    }

    if (configRes.success && configRes.config) {
      setHumanizeConfig(configRes.config)
    }
  }

  const openOptions = () => {
    chrome.runtime.openOptionsPage()
  }

  const handleConfigSave = async (newConfig: HumanizeConfig) => {
    setHumanizeConfig(newConfig)
    await chrome.runtime.sendMessage({
      type: 'SAVE_HUMANIZE_CONFIG',
      data: { config: newConfig },
    })
  }

  // 从 activeProfile 获取提供商名称
  const getActiveProviderName = () => {
    if (!settings?.apiProfiles || !settings?.activeProfileId) {
      return settings?.defaultProvider ? getProviderName(settings.defaultProvider) : '未配置'
    }
    const active = settings.apiProfiles.find(p => p.id === settings.activeProfileId)
    return active ? getProviderName(active.provider) : '未配置'
  }

  // 从 activeProfile 获取模型名称
  const getActiveModelName = () => {
    if (!settings?.apiProfiles || !settings?.activeProfileId) return '默认'
    const active = settings.apiProfiles.find(p => p.id === settings.activeProfileId)
    return active?.model || '默认'
  }

  const getProviderName = (provider?: string) => {
    const names: Record<string, string> = {
      openai: 'OpenAI',
      claude: 'Claude',
      qwen: '通义千问',
      glm: '智谱 GLM',
      wenxin: '文心一言',
      kimi: 'Kimi',
      deepseek: 'DeepSeek',
      doubao: '豆包',
    }
    return names[provider || ''] || provider || '未配置'
  }

  const getPlatformName = (platform?: string) => {
    const names: Record<string, string> = {
      twitter: 'Twitter/X',
      xiaohongshu: '小红书',
      linkedin: 'LinkedIn',
      moments: '朋友圈',
      weibo: '微博',
      zhihu: '知乎',
      toutiao: '今日头条',
      wechat: '公众号',
    }
    return names[platform || ''] || platform || 'Twitter'
  }

  const getStyleName = (styleId?: string) => {
    const allStyles = [...DEFAULT_STYLES, ...styles]
    const style = allStyles.find((s: any) => s.id === styleId)
    return style?.name || '专业正式'
  }

  return (
    <>
      <div className="popup-container">
        {/* Header */}
        <div className="popup-header">
          <div className="popup-logo">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 2L3 14H8L11 22L21 10H16L13 2Z" fill="currentColor"/>
            </svg>
            <span>ContentCraft</span>
          </div>
        </div>

        {/* Body */}
        <div className="popup-body">
          {!hasApiKey ? (
            <div className="setup-state">
              <div className="setup-icon">⚡</div>
              <h2>欢迎使用 ContentCraft</h2>
              <p className="setup-description">配置 API Key 开始使用</p>
              <button onClick={openOptions} className="btn btn-primary">
                前往设置
              </button>
            </div>
          ) : (
            <div className="ready-state">
              <div className="ready-header">
                <div className="ready-icon">✓</div>
                <h2>已就绪</h2>
              </div>

              <p className="ready-description">
                选中网页文本，使用快捷键生成
              </p>

              {/* 快捷键提示 */}
              <div className="shortcut-hint">
                <kbd>Ctrl</kbd>
                <span>+</span>
                <kbd>Shift</kbd>
                <span>+</span>
                <kbd>Q</kbd>
              </div>

              {/* 设置信息卡片 */}
              <div className="info-card">
                <div className="info-row">
                  <span className="info-label">AI 提供商</span>
                  <span className="info-value">{getActiveProviderName()}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">生成模型</span>
                  <span className="info-value">{getActiveModelName()}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">默认平台</span>
                  <span className="info-value">{getPlatformName(settings?.defaultPlatform)}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">默认风格</span>
                  <span className="info-value">{getStyleName(settings?.defaultStyle)}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">人性化处理</span>
                  <span className="info-value">
                    {humanizeConfig.enabled ? '已启用' : '已关闭'}
                  </span>
                </div>
              </div>

              {/* 人性化配置面板 */}
              <HumanizePanel
                config={humanizeConfig}
                onConfigChange={handleConfigSave}
              />

              <div className="button-group">
                <button onClick={openOptions} className="btn btn-primary">
                  打开设置
                </button>
              </div>
            </div>
          )}
        </div>

        <style>{`
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }

          .popup-container {
            width: 380px;
            max-height: 600px;
            overflow-y: auto;
            font-family: "Inter", -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #FFFFFF;
            color: #0A0A0A;
          }

          .popup-header {
            padding: 16px 20px;
            border-bottom: 1px solid #E5E5E5;
            display: flex;
            align-items: center;
            position: sticky;
            top: 0;
            background: #FFFFFF;
            z-index: 10;
          }

          .popup-logo {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 15px;
            font-weight: 600;
            color: #0A0A0A;
          }

          .popup-logo svg {
            color: #0A0A0A;
          }

          .popup-body {
            padding: 24px 20px;
          }

          .setup-state {
            text-align: center;
          }

          .setup-icon {
            font-size: 32px;
            margin-bottom: 16px;
          }

          .setup-state h2 {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 8px;
            color: #0A0A0A;
          }

          .setup-description {
            font-size: 14px;
            color: #737373;
            margin-bottom: 20px;
          }

          .ready-state {
            text-align: center;
          }

          .ready-header {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-bottom: 12px;
          }

          .ready-icon {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: #F5F5F5;
            color: #0A0A0A;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            margin-bottom: 12px;
          }

          .ready-state h2 {
            font-size: 18px;
            font-weight: 600;
            color: #0A0A0A;
          }

          .ready-description {
            font-size: 14px;
            color: #737373;
            margin-bottom: 20px;
            line-height: 1.5;
          }

          .shortcut-hint {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 8px 12px;
            background: #F5F5F5;
            border-radius: 6px;
            margin-bottom: 20px;
            font-size: 13px;
          }

          .shortcut-hint kbd {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 24px;
            height: 24px;
            padding: 0 6px;
            background: #FFFFFF;
            border: 1px solid #E5E5E5;
            border-radius: 4px;
            font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
            font-size: 11px;
            font-weight: 500;
            color: #0A0A0A;
          }

          .shortcut-hint span {
            color: #737373;
          }

          .info-card {
            background: #FAFAFA;
            border-radius: 8px;
            padding: 12px 16px;
            margin-bottom: 20px;
            text-align: left;
          }

          .info-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 6px 0;
            font-size: 13px;
          }

          .info-row:not(:last-child) {
            border-bottom: 1px solid #E5E5E5;
          }

          .info-label {
            color: #737373;
          }

          .info-value {
            color: #0A0A0A;
            font-weight: 500;
          }

          .button-group {
            display: flex;
            gap: 8px;
            margin-top: 16px;
          }

          .btn {
            flex: 1;
            padding: 10px 16px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
            border: none;
          }

          .btn-primary {
            background: #0A0A0A;
            color: #FFFFFF;
          }

          .btn-primary:hover {
            background: #262626;
          }

          .btn-primary:active {
            background: #404040;
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(8px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .popup-container {
            animation: fadeIn 150ms cubic-bezier(0, 0, 0.2, 1);
          }

          .setup-state,
          .ready-state {
            animation: slideUp 200ms cubic-bezier(0.4, 0, 0.2, 1);
          }
        `}</style>
      </div>

      {/* 处理状态指示器 */}
      <ProcessingIndicator
        isVisible={showIndicator}
        stage={processingStage}
        progress={processingProgress}
      />
    </>
  )
}
