import { useState, useEffect } from 'react'
import type { ApiProfile } from '../../shared/types'

interface Props {
  profiles: ApiProfile[]
  activeId: string
  onSelect: (id: string) => void
  onManage: () => void
  disabled?: boolean
}

export function ApiProfileSelector({
  profiles,
  activeId,
  onSelect,
  onManage,
  disabled = false
}: Props) {
  const [isOpen, setIsOpen] = useState(false)

  const activeProfile = profiles.find(p => p.id === activeId)

  const getDisplayName = (profile: ApiProfile) => {
    const providerNames: Record<string, string> = {
      openai: 'OpenAI',
      claude: 'Claude',
      qwen: '通义千问',
      glm: '智谱 GLM',
      wenxin: '文心一言',
      kimi: 'Kimi',
      deepseek: 'DeepSeek',
      doubao: '豆包',
      custom: '自定义 API'
    }

    const keyPreview = profile.apiKey.slice(0, 3) + '...' + profile.apiKey.slice(-3)
    return `${providerNames[profile.provider]} (${keyPreview})`
  }

  // 点击外部关闭下拉菜单
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = () => setIsOpen(false)
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isOpen])

  return (
    <div className="form-group">
      <label>当前使用</label>
      <div className="profile-selector">
        <button
          type="button"
          className="profile-dropdown-btn"
          onClick={(e) => {
            e.stopPropagation()
            setIsOpen(!isOpen)
          }}
          disabled={disabled}
        >
          {activeProfile ? getDisplayName(activeProfile) : '选择API配置'}
          <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>▼</span>
        </button>

        {isOpen && (
          <div className="profile-dropdown-menu">
            {profiles.map(profile => (
              <div
                key={profile.id}
                className={`profile-option ${profile.id === activeId ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  onSelect(profile.id)
                  setIsOpen(false)
                }}
              >
                <span className="profile-name">{getDisplayName(profile)}</span>
                {profile.isDefault && <span className="default-badge">默认</span>}
              </div>
            ))}
            <div
              className="profile-option profile-option-manage"
              onClick={(e) => {
                e.stopPropagation()
                onManage()
                setIsOpen(false)
              }}
            >
              ⚙️ 管理配置
            </div>
          </div>
        )}
      </div>

      <style>{`
        .profile-selector {
          position: relative;
        }

        .profile-dropdown-btn {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #E5E5E5;
          border-radius: 6px;
          background: #FFFFFF;
          cursor: pointer;
          font-size: 14px;
          color: #0A0A0A;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 150ms;
        }

        .profile-dropdown-btn:hover:not(:disabled) {
          border-color: #D4D4D4;
        }

        .profile-dropdown-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .dropdown-arrow {
          transition: transform 150ms;
          font-size: 10px;
        }

        .dropdown-arrow.open {
          transform: rotate(180deg);
        }

        .profile-dropdown-menu {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          margin-top: 4px;
          background: #FFFFFF;
          border: 1px solid #E5E5E5;
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          z-index: 100;
          max-height: 300px;
          overflow-y: auto;
        }

        .profile-option {
          padding: 10px 12px;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #F5F5F5;
          font-size: 14px;
        }

        .profile-option:last-child {
          border-bottom: none;
        }

        .profile-option:hover {
          background: #FAFAFA;
        }

        .profile-option.active {
          background: #F0F9FF;
        }

        .profile-option-manage {
          color: #0369A1;
          font-weight: 500;
        }

        .default-badge {
          font-size: 11px;
          padding: 2px 6px;
          background: #DCFCE7;
          color: #166534;
          border-radius: 4px;
        }

        .profile-name {
          color: #0A0A0A;
        }
      `}</style>
    </div>
  )
}
