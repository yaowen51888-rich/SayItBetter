import { useState, useEffect } from 'react'
import { HumanizeSettings } from './components/HumanizeSettings'
import { StyleManager } from './components/StyleManager'
import { ApiProfileSelector } from './components/ApiProfileSelector'
import { ApiProfileManager } from './components/ApiProfileManager'
import { QuickHelp } from '../components/TourGuide'
import { PLATFORMS } from '../shared/constants'
import type { PlatformKey } from '../shared/constants'
import type { UserSettings, UserStyle, HistoryItem, ApiProfile } from '../shared/types'

export function App() {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [styles, setStyles] = useState<UserStyle[]>([])
  const [activeTab, setActiveTab] = useState<'api' | 'styles' | 'history' | 'about'>('api')
  const [permissions] = useState<any>(null)
  const [showProfileManager, setShowProfileManager] = useState(false)
  const [apiProfiles, setApiProfiles] = useState<ApiProfile[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    console.log('[App] 开始加载数据...')
    try {
      const [settingsRes, stylesRes] = await Promise.all([
        chrome.runtime.sendMessage({ type: 'GET_USER_SETTINGS' }),
        chrome.runtime.sendMessage({ type: 'GET_USER_STYLES' }),
      ])

      console.log('[App] 收到响应:', { settingsRes, stylesRes })

      if (settingsRes?.success) {
        const settingsData = settingsRes.settings
        console.log('[App] 设置数据:', settingsData)
        setSettings(settingsData)

        // 加载API配置列表 - 确保总是有一个数组
        const profiles = settingsData.apiProfiles || []
        console.log('[App] API配置列表:', profiles)
        setApiProfiles(profiles)

        // 如果没有配置，且用户有旧的apiKey，触发迁移
        if (profiles.length === 0 && settingsData.apiKey) {
          console.log('[App] 检测到旧数据，正在迁移...')
          await chrome.runtime.sendMessage({ type: 'GET_USER_SETTINGS' })
          // 重新加载
          const updatedRes = await chrome.runtime.sendMessage({ type: 'GET_USER_SETTINGS' })
          if (updatedRes?.success && updatedRes.settings.apiProfiles) {
            setApiProfiles(updatedRes.settings.apiProfiles)
            setSettings(updatedRes.settings)
          }
        }
      } else {
        console.error('[App] 获取设置失败:', settingsRes)
        // 即使失败也要设置一个默认值，避免页面卡死
        setSettings({
          apiProfiles: [],
          activeProfileId: '',
          defaultStyle: 'professional',
          defaultPlatform: 'twitter'
        })
      }

      if (stylesRes?.success) {
        setStyles(stylesRes.styles)
      }
    } catch (error) {
      console.error('[App] 加载数据异常:', error)
      // 异常时也要设置默认值，确保页面能渲染
      setSettings({
        apiProfiles: [],
        activeProfileId: '',
        defaultStyle: 'professional',
        defaultPlatform: 'twitter'
      })
    }
  }

  const handleSaveStyles = async (newStyles: UserStyle[]) => {
    await chrome.runtime.sendMessage({
      type: 'SAVE_USER_STYLES',
      data: { styles: newStyles },
    })
    setStyles(newStyles)
  }

  const handleProfileSelect = async (profileId: string) => {
    try {
      await chrome.runtime.sendMessage({
        type: 'SET_ACTIVE_API_PROFILE',
        data: { profileId }
      })

      setSettings(prev => prev ? { ...prev, activeProfileId: profileId } : null)
      await loadData()
    } catch (error) {
      alert('切换配置失败')
    }
  }

  const handleProfilesUpdate = async (profiles: ApiProfile[]) => {
    setApiProfiles(profiles)
    await loadData()
  }

  const handlePlatformChange = async (platform: string) => {
    try {
      await chrome.runtime.sendMessage({
        type: 'SAVE_USER_SETTINGS',
        data: { defaultPlatform: platform }
      })
      setSettings(prev => prev ? { ...prev, defaultPlatform: platform } : null)
    } catch (error) {
      alert('保存默认平台失败')
    }
  }

  if (!settings) {
    console.log('[App] settings为null，显示加载中')
    return <div className="loading">加载中...</div>
  }

  return (
    <div className="options-container">
      {/* Header */}
      <header className="options-header">
        <div className="header-logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13 2L3 14H8L11 22L21 10H16L13 2Z" fill="currentColor"/>
          </svg>
          <h1>ContentCraft</h1>
          <span className="free-badge">完全免费</span>
        </div>
        <p className="header-subtitle">AI 文案生成助手</p>
      </header>

      {/* Tabs */}
      <nav className="tabs">
        <button
          className={`tab ${activeTab === 'api' ? 'active' : ''}`}
          onClick={() => setActiveTab('api')}
        >
          设置
        </button>
        <button
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          历史记录
        </button>
        <button
          className={`tab ${activeTab === 'styles' ? 'active' : ''}`}
          onClick={() => setActiveTab('styles')}
        >
          风格模板
        </button>
        <button
          className={`tab ${activeTab === 'about' ? 'active' : ''}`}
          onClick={() => setActiveTab('about')}
        >
          关于
        </button>
      </nav>

      {/* Content */}
      <main className="options-content">
        {activeTab === 'api' && (
          <>
            {/* API配置选择器和管理 - 根据是否有配置显示不同UI */}
            {apiProfiles.length === 0 ? (
              /* 没有配置时：显示添加配置引导 */
              <div className="section" style={{
                padding: '32px',
                textAlign: 'center',
                background: '#FAFAFA',
                borderRadius: '8px',
                border: '1px dashed #E5E5E5'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  margin: '0 auto 16px',
                  borderRadius: '50%',
                  background: '#E5E5E5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px'
                }}>🔑</div>
                <h2 style={{ margin: '0 0 8px', fontSize: '18px' }}>开始使用</h2>
                <p style={{ margin: '0 0 20px', color: '#737373', fontSize: '14px' }}>
                  添加您的第一个API配置即可开始使用ContentCraft
                </p>
                <button
                  onClick={() => setShowProfileManager(true)}
                  style={{
                    padding: '10px 24px',
                    background: '#0A0A0A',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  添加API配置
                </button>
              </div>
            ) : (
              <>
                {/* 有配置时：显示配置选择器 */}
                <ApiProfileSelector
                  profiles={apiProfiles}
                  activeId={settings.activeProfileId || ''}
                  onSelect={handleProfileSelect}
                  onManage={() => setShowProfileManager(true)}
                />

                {/* 人性化设置：只在有配置时显示 */}
                {apiProfiles.length > 0 && (
                  <HumanizeSettings
                    permissions={permissions}
                    apiProfiles={apiProfiles}
                    activeProfileId={settings.activeProfileId || ''}
                  />
                )}

                {/* 默认平台选择器 */}
                <div className="section" style={{
                  padding: '20px',
                  background: '#F9FAFB',
                  borderRadius: '8px',
                  border: '1px solid #E5E5E5'
                }}>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#0A0A0A',
                    marginBottom: '12px'
                  }}>默认生成平台</h3>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <select
                      value={settings.defaultPlatform || 'twitter'}
                      onChange={(e) => handlePlatformChange(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #E5E5E5',
                        borderRadius: '6px',
                        fontSize: '14px',
                        color: '#0A0A0A',
                        background: '#FFFFFF',
                        cursor: 'pointer'
                      }}
                    >
                      {Object.keys(PLATFORMS).map(key => (
                        <option key={key} value={key}>
                          {PLATFORMS[key as PlatformKey].emoji} {PLATFORMS[key as PlatformKey].name}
                        </option>
                      ))}
                    </select>
                    <p className="help" style={{ marginTop: '8px' }}>
                      选择默认的内容生成平台，使用插件时将自动选中该平台
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* API配置管理器对话框 */}
            {showProfileManager && (
              <ApiProfileManager
                profiles={apiProfiles}
                activeId={settings.activeProfileId || ''}
                onUpdate={handleProfilesUpdate}
                onSetActive={handleProfileSelect}
                onClose={() => setShowProfileManager(false)}
              />
            )}
          </>
        )}

        {activeTab === 'history' && <HistoryPanel />}

        {activeTab === 'styles' && (
          <StyleManager styles={styles} onSave={handleSaveStyles} />
        )}

        {activeTab === 'about' && <AboutPanel />}
      </main>

      {/* 快速帮助按钮 */}
      <QuickHelp position="bottom-right" />

      <style>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: "Inter", -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #0A0A0A;
          background: #FFFFFF;
        }

        .options-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 48px 32px;
        }

        /* ========== Header ========== */
        .options-header {
          text-align: center;
          margin-bottom: 48px;
        }

        .header-logo {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .header-logo svg {
          color: #0A0A0A;
        }

        .header-logo h1 {
          font-size: 30px;
          font-weight: 600;
          color: #0A0A0A;
          margin: 0;
        }

        .free-badge {
          display: inline-block;
          margin-left: 12px;
          padding: 4px 12px;
          background: #dcfce7;
          color: #166534;
          font-size: 12px;
          font-weight: 600;
          border-radius: 12px;
        }

        .header-subtitle {
          font-size: 15px;
          color: #737373;
        }

        /* ========== Tabs ========== */
        .tabs {
          display: flex;
          gap: 8px;
          border-bottom: 1px solid #E5E5E5;
          margin-bottom: 32px;
          padding: 0 8px;
        }

        .tab {
          padding: 12px 16px;
          border: none;
          background: none;
          font-size: 14px;
          color: #737373;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }

        .tab:hover {
          color: #0A0A0A;
        }

        .tab.active {
          color: #0A0A0A;
          border-bottom-color: #0A0A0A;
        }

        /* ========== Section ========== */
        .section {
          margin-bottom: 32px;
        }

        .section h2 {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 16px;
          color: #0A0A0A;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .section-header h2 {
          margin-bottom: 0;
        }

        /* ========== Form ========== */
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

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #E5E5E5;
          border-radius: 6px;
          font-size: 14px;
          color: #0A0A0A;
          background: #FFFFFF;
          transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #0A0A0A;
          box-shadow: 0 0 0 2px rgba(10, 10, 10, 0.05);
        }

        .form-group input::placeholder,
        .form-group textarea::placeholder {
          color: #A3A3A3;
        }

        .input-group {
          display: flex;
          gap: 8px;
        }

        .input-group input {
          flex: 1;
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

        .help a {
          color: #0EA5E9;
          text-decoration: none;
        }

        .help a:hover {
          color: #0284C7;
          text-decoration: underline;
        }

        /* ========== Checkbox ========== */
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

        /* ========== Buttons ========== */
        .btn-primary,
        .btn-secondary {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .btn-primary {
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

        .btn-secondary {
          background: #FFFFFF;
          color: #0A0A0A;
          border: 1px solid #E5E5E5;
        }

        .btn-secondary:hover {
          background: #FAFAFA;
          border-color: #D4D4D4;
        }

        /* ========== Style List ========== */
        .style-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .style-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border: 1px solid #E5E5E5;
          border-radius: 8px;
          background: #FFFFFF;
          transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .style-item:hover {
          border-color: #D4D4D4;
        }

        .style-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .style-name {
          font-weight: 500;
          font-size: 14px;
          color: #0A0A0A;
        }

        .style-prompt {
          font-size: 13px;
          color: #737373;
        }

        .style-actions {
          display: flex;
          gap: 8px;
        }

        .style-actions button {
          padding: 6px 12px;
          border: 1px solid #E5E5E5;
          border-radius: 4px;
          background: #FFFFFF;
          cursor: pointer;
          font-size: 13px;
          color: #0A0A0A;
          transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .style-actions button:hover {
          background: #FAFAFA;
          border-color: #D4D4D4;
        }

        /* ========== Modal ========== */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(10, 10, 10, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 150ms cubic-bezier(0, 0, 0.2, 1);
        }

        .modal {
          background: #FFFFFF;
          padding: 24px;
          border-radius: 12px;
          width: 100%;
          max-width: 400px;
          animation: scaleIn 150ms cubic-bezier(0, 0, 0.2, 1);
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.98);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .modal h3 {
          margin-bottom: 20px;
          font-size: 18px;
          font-weight: 600;
          color: #0A0A0A;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 20px;
        }

        /* ========== Loading ========== */
        .loading {
          text-align: center;
          padding: 48px;
          color: #737373;
          font-size: 14px;
        }

        /* ========== History ========== */
        .history-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .history-item {
          padding: 16px;
          border: 1px solid #E5E5E5;
          border-radius: 8px;
          background: #FFFFFF;
        }

        .history-meta {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          font-size: 13px;
        }

        .history-platform {
          background: #FAFAFA;
          color: #0A0A0A;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 500;
        }

        .history-date {
          color: #737373;
        }

        .history-original {
          font-size: 13px;
          color: #737373;
          margin-bottom: 8px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .history-generated {
          font-size: 14px;
          color: #0A0A0A;
          white-space: pre-wrap;
          line-height: 1.6;
        }

        /* ========== Empty State ========== */
        .empty-state {
          text-align: center;
          padding: 48px;
          color: #737373;
        }

        .empty-state p {
          font-size: 14px;
        }

        /* ========== Account Panel ========== */
        .account-panel {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .account-info {
          background: #F9FAFB;
          border-radius: 8px;
          padding: 20px;
        }

        .account-info h3 {
          font-size: 18px;
          font-weight: 600;
          color: #0A0A0A;
          margin-bottom: 12px;
        }

        .account-info p {
          font-size: 14px;
          color: #0A0A0A;
          margin: 8px 0;
        }

        .account-info strong {
          font-weight: 500;
        }

        /* ========== Spacing ========== */
        .space-y-6 > * + * {
          margin-top: 24px;
        }

        /* ========== Region Switcher ========== */
        .region-switcher {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          padding: 4px;
          background: #F5F5F5;
          border-radius: 8px;
        }

        .region-btn {
          flex: 1;
          padding: 10px 16px;
          border: none;
          background: transparent;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          color: #737373;
          cursor: pointer;
          transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .region-btn:hover {
          color: #0A0A0A;
        }

        .region-btn.active {
          background: #FFFFFF;
          color: #0A0A0A;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .account-section,
        .upgrade-section {
          display: flex;
          flex-direction: column;
        }
      `}</style>
    </div>
  )
}

function AboutPanel() {
  return (
    <div className="section">
      <h2>关于 ContentCraft</h2>

      <div className="about-content">
        <div className="about-section">
          <h3>版本信息</h3>
          <p>ContentCraft v1.0.0 (免费版)</p>
          <p className="help">所有功能完全免费，永久使用</p>
        </div>

        <div className="about-section">
          <h3>核心功能</h3>
          <ul className="feature-list">
            <li>✓ 智能文案生成 - 支持 8 种 AI 模型</li>
            <li>✓ 风格模板管理 - 自定义写作风格</li>
            <li>✓ 智能缓存系统 - 重复内容秒级响应</li>
            <li>✓ 智能路由引擎 - 自动选择最优模型</li>
            <li>✓ 人性化处理 - 去除 AI 写作痕迹</li>
            <li>✓ 批量处理 - 最多 50 条并发</li>
            <li>✓ 历史记录 - 永久保存</li>
          </ul>
        </div>

        <div className="about-section">
          <h3>使用说明</h3>
          <ol className="instruction-list">
            <li>在"设置"页面配置您的 API Key</li>
            <li>选择合适的 AI 提供商（推荐 OpenAI 或 Claude）</li>
            <li>在任意网页选中文本，右键选择"生成文案"</li>
            <li>在"风格模板"中创建自定义风格</li>
            <li>查看"历史记录"管理所有生成内容</li>
          </ol>
        </div>

        <div className="about-section">
          <h3>隐私声明</h3>
          <p className="privacy-notice">
            ContentCraft 完全在本地运行，不会收集或上传您的任何数据。
            所有 API 调用直接发送到您选择的 AI 提供商，我们不做任何中间处理。
            您的历史记录和配置信息仅保存在浏览器本地存储中。
          </p>
        </div>

        <div className="about-section">
          <h3>技术支持</h3>
          <p className="help">
            遇到问题？请检查：
            <br />
            • API Key 是否正确配置
            <br />
            • API 额度是否充足
            <br />
            • 网络连接是否正常
          </p>
        </div>
      </div>

      <style>{`
        .about-content {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .about-section {
          background: #F9FAFB;
          border-radius: 8px;
          padding: 20px;
        }

        .about-section h3 {
          font-size: 16px;
          font-weight: 600;
          color: #0A0A0A;
          margin-bottom: 12px;
        }

        .about-section p {
          font-size: 14px;
          color: #0A0A0A;
          line-height: 1.6;
          margin: 8px 0;
        }

        .feature-list,
        .instruction-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .feature-list li,
        .instruction-list li {
          font-size: 14px;
          color: #0A0A0A;
          padding: 8px 0;
          line-height: 1.6;
        }

        .instruction-list {
          counter-reset: step;
        }

        .instruction-list li {
          counter-increment: step;
          padding-left: 24px;
          position: relative;
        }

        .instruction-list li::before {
          content: counter(step);
          position: absolute;
          left: 0;
          top: 8px;
          width: 18px;
          height: 18px;
          background: #0A0A0A;
          color: #FFFFFF;
          border-radius: 50%;
          font-size: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .privacy-notice {
          font-size: 13px;
          color: #737373;
          line-height: 1.8;
          background: #FFFFFF;
          padding: 16px;
          border-radius: 6px;
          border: 1px solid #E5E5E5;
        }
      `}</style>
    </div>
  )
}

function HistoryPanel() {
  const [history, setHistory] = useState<HistoryItem[]>([])

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    const res = await chrome.runtime.sendMessage({
      type: 'GET_HISTORY',
      data: { limit: 50 },
    })
    if (res.success) {
      setHistory(res.history)
    }
  }

  const handleClear = async () => {
    if (confirm('确定要清除所有历史记录吗？')) {
      await chrome.runtime.sendMessage({ type: 'CLEAR_HISTORY' })
      setHistory([])
    }
  }

  return (
    <div className="section">
      <div className="section-header">
        <h2>历史记录</h2>
        <button className="btn-secondary" onClick={handleClear}>
          清除
        </button>
      </div>

      {history.length === 0 ? (
        <div className="empty-state">
          <p>暂无历史记录</p>
        </div>
      ) : (
        <div className="history-list">
          {history.map((item) => (
            <div key={item.id} className="history-item">
              <div className="history-meta">
                <span className="history-platform">{item.platform}</span>
                <span className="history-date">
                  {new Date(item.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="history-original">{item.originalText}</p>
              <p className="history-generated">{item.generatedText}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
