import { useState } from 'react'
import type { ApiProfile, AIProvider } from '../../shared/types'
import { getRecommendedProfileModel } from '../../background/config'

interface Props {
  profiles: ApiProfile[]
  activeId: string
  onUpdate: (profiles: ApiProfile[]) => void
  onSetActive: (id: string) => void
  onClose: () => void
}

export function ApiProfileManager({
  profiles,
  activeId,
  onUpdate,
  onSetActive,
  onClose
}: Props) {
  const [newForm, setNewForm] = useState<{
    provider: 'openai' | 'claude' | 'qwen' | 'glm' | 'wenxin' | 'kimi' | 'deepseek' | 'doubao' | 'custom'
    apiKey: string
    customApiUrl: string
    model: string
  }>({
    provider: 'openai',
    apiKey: '',
    customApiUrl: '',
    model: getRecommendedProfileModel('openai')
  })

  // 编辑状态
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{
    provider: 'openai' | 'claude' | 'qwen' | 'glm' | 'wenxin' | 'kimi' | 'deepseek' | 'doubao' | 'custom'
    apiKey: string
    customApiUrl: string
    model: string
  }>({
    provider: 'openai',
    apiKey: '',
    customApiUrl: '',
    model: ''
  })

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此API配置吗？')) return

    try {
      await chrome.runtime.sendMessage({
        type: 'DELETE_API_PROFILE',
        data: { id }
      })

      const updated = profiles.filter(p => p.id !== id)
      onUpdate(updated)
    } catch (error: any) {
      alert(error.message || '删除失败')
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      await chrome.runtime.sendMessage({
        type: 'SET_DEFAULT_API_PROFILE',
        data: { id }
      })

      const updated = profiles.map(p => ({
        ...p,
        isDefault: p.id === id
      }))
      onUpdate(updated)
    } catch (error: any) {
      alert(error.message || '设置失败')
    }
  }

  const handleAdd = async () => {
    if (!newForm.apiKey.trim()) {
      alert('请输入API Key')
      return
    }

    if (newForm.provider === 'custom' && !newForm.customApiUrl.trim()) {
      alert('请输入自定义API端点')
      return
    }

    try {
      const result = await chrome.runtime.sendMessage({
        type: 'ADD_API_PROFILE',
        data: newForm
      })

      if (result.success) {
        const newProfile = result.profile
        onUpdate([...profiles, newProfile])
        setNewForm({ provider: 'openai', apiKey: '', customApiUrl: '', model: getRecommendedProfileModel('openai') })
      } else {
        alert(result.error || '添加失败')
      }
    } catch (error: any) {
      alert(error.message || '添加失败')
    }
  }

  const handleStartEdit = (profile: ApiProfile) => {
    setEditingId(profile.id)
    setEditForm({
      provider: profile.provider,
      apiKey: profile.apiKey,
      customApiUrl: profile.customApiUrl || '',
      model: profile.model || getRecommendedProfileModel(profile.provider)
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditForm({ provider: 'openai', apiKey: '', customApiUrl: '', model: '' })
  }

  const handleSaveEdit = async () => {
    if (!editingId) return
    if (!editForm.apiKey.trim()) {
      alert('请输入API Key')
      return
    }
    if (editForm.provider === 'custom' && !editForm.customApiUrl.trim()) {
      alert('请输入自定义API端点')
      return
    }

    try {
      await chrome.runtime.sendMessage({
        type: 'UPDATE_API_PROFILE',
        data: {
          id: editingId,
          updates: {
            provider: editForm.provider,
            apiKey: editForm.apiKey.trim(),
            model: editForm.model.trim() || getRecommendedProfileModel(editForm.provider),
            customApiUrl: editForm.provider === 'custom' ? editForm.customApiUrl.trim() : undefined
          }
        }
      })

      const updated = profiles.map(p =>
        p.id === editingId
          ? {
              ...p,
              provider: editForm.provider,
              apiKey: editForm.apiKey.trim(),
              model: editForm.model.trim() || getRecommendedProfileModel(editForm.provider),
              customApiUrl: editForm.provider === 'custom' ? editForm.customApiUrl.trim() : undefined
            }
          : p
      )
      onUpdate(updated)
      setEditingId(null)
      setEditForm({ provider: 'openai', apiKey: '', customApiUrl: '', model: '' })
    } catch (error: any) {
      alert(error.message || '更新失败')
    }
  }

  const getProviderName = (provider: string) => {
    const names: Record<string, string> = {
      openai: 'OpenAI',
      claude: 'Claude',
      qwen: '通义千问',
      glm: '智谱 GLM',
      wenxin: '文心一言',
      kimi: 'Kimi',
      deepseek: 'DeepSeek',
      doubao: '豆包',
      custom: '自定义'
    }
    return names[provider] || provider
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>API配置管理</h2>
          <button onClick={onClose} className="modal-close">✕</button>
        </div>

        <div className="modal-body">
          {/* 现有配置列表 */}
          <div className="profile-list">
            {profiles.map(profile => (
              <div key={profile.id} className="profile-item">
                {editingId === profile.id ? (
                  /* 编辑模式 */
                  <div className="edit-form">
                    <div className="form-group">
                      <label>AI 提供商</label>
                      <select
                        value={editForm.provider}
                        onChange={e => {
                          const p = e.target.value as AIProvider
                          setEditForm({ ...editForm, provider: p as any, model: getRecommendedProfileModel(p) })
                        }}
                      >
                        <option value="openai">OpenAI</option>
                        <option value="claude">Claude</option>
                        <option value="qwen">通义千问</option>
                        <option value="glm">智谱 GLM</option>
                        <option value="wenxin">文心一言</option>
                        <option value="kimi">Kimi</option>
                        <option value="deepseek">DeepSeek</option>
                        <option value="doubao">豆包</option>
                        <option value="custom">自定义 API</option>
                      </select>
                    </div>

                    {editForm.provider === 'custom' && (
                      <div className="form-group">
                        <label>自定义端点</label>
                        <input
                          type="text"
                          value={editForm.customApiUrl}
                          onChange={e => setEditForm({ ...editForm, customApiUrl: e.target.value })}
                          placeholder="https://api.example.com/v1/chat/completions"
                        />
                      </div>
                    )}

                    <div className="form-group">
                      <label>API Key</label>
                      <input
                        type="text"
                        value={editForm.apiKey}
                        onChange={e => setEditForm({ ...editForm, apiKey: e.target.value })}
                        placeholder="sk-..."
                      />
                    </div>

                    <div className="form-group">
                      <label>默认生成模型</label>
                      <input
                        type="text"
                        value={editForm.model}
                        onChange={e => setEditForm({ ...editForm, model: e.target.value })}
                        placeholder={getRecommendedProfileModel(editForm.provider as AIProvider)}
                      />
                      <p className="help-text">用于内容生成的模型，留空使用推荐值</p>
                    </div>

                    <div className="edit-actions">
                      <button onClick={handleSaveEdit} className="btn-primary btn-sm">
                        保存
                      </button>
                      <button onClick={handleCancelEdit} className="btn-cancel">
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  /* 展示模式 */
                  <>
                    <div className="profile-info">
                      <span className="profile-provider">{getProviderName(profile.provider)}</span>
                      <span className="profile-model">模型: {profile.model || '默认'}</span>
                      <span className="profile-key">
                        {profile.apiKey.slice(0, 8)}...{profile.apiKey.slice(-4)}
                      </span>
                      {profile.isDefault && <span className="default-badge">默认</span>}
                      {profile.id === activeId && <span className="active-badge">当前使用</span>}
                    </div>
                    <div className="profile-actions">
                      <button
                        onClick={() => onSetActive(profile.id)}
                        className={profile.id === activeId ? 'btn-disabled' : ''}
                        disabled={profile.id === activeId}
                      >
                        切换
                      </button>
                      <button
                        onClick={() => handleSetDefault(profile.id)}
                        className={profile.isDefault ? 'btn-disabled' : ''}
                        disabled={profile.isDefault}
                      >
                        设为默认
                      </button>
                      <button
                        onClick={() => handleStartEdit(profile)}
                        className="btn-edit"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => profiles.length > 1 && handleDelete(profile.id)}
                        disabled={profiles.length <= 1}
                        title={profiles.length <= 1 ? '至少保留一个配置' : ''}
                      >
                        删除
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* 添加新配置 */}
          <div className="add-profile-section">
            <h3>添加新配置</h3>
            <div className="form-group">
              <label>AI 提供商</label>
              <select
                value={newForm.provider}
                onChange={e => {
                  const p = e.target.value as AIProvider
                  setNewForm({ ...newForm, provider: p as any, model: getRecommendedProfileModel(p) })
                }}
              >
                <option value="openai">OpenAI</option>
                <option value="claude">Claude</option>
                <option value="qwen">通义千问</option>
                <option value="glm">智谱 GLM</option>
                <option value="wenxin">文心一言</option>
                <option value="kimi">Kimi</option>
                <option value="deepseek">DeepSeek</option>
                <option value="doubao">豆包</option>
                <option value="custom">自定义 API</option>
              </select>
            </div>

            {newForm.provider === 'custom' && (
              <div className="form-group">
                <label>自定义端点</label>
                <input
                  type="text"
                  value={newForm.customApiUrl}
                  onChange={e => setNewForm({ ...newForm, customApiUrl: e.target.value })}
                  placeholder="https://api.example.com/v1/chat/completions"
                />
              </div>
            )}

            <div className="form-group">
              <label>API Key</label>
              <input
                type="password"
                value={newForm.apiKey}
                onChange={e => setNewForm({ ...newForm, apiKey: e.target.value })}
                placeholder="sk-..."
              />
            </div>

            <div className="form-group">
              <label>默认生成模型</label>
              <input
                type="text"
                value={newForm.model}
                onChange={e => setNewForm({ ...newForm, model: e.target.value })}
                placeholder={getRecommendedProfileModel(newForm.provider as AIProvider)}
              />
              <p className="help-text">用于内容生成的模型，留空使用推荐值</p>
            </div>

            <button onClick={handleAdd} className="btn-primary">
              添加配置
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-container {
          background: #FFFFFF;
          border-radius: 12px;
          width: 90%;
          max-width: 600px;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #E5E5E5;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        .modal-close {
          width: 32px;
          height: 32px;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 18px;
        }

        .modal-body {
          padding: 20px;
          overflow-y: auto;
        }

        .profile-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        }

        .profile-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          border: 1px solid #E5E5E5;
          border-radius: 6px;
          background: #FAFAFA;
        }

        .profile-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .profile-provider {
          font-weight: 500;
          font-size: 14px;
        }

        .profile-key {
          font-size: 12px;
          color: #737373;
        }

        .profile-model {
          font-size: 12px;
          color: #525252;
        }

        .help-text {
          margin-top: 4px;
          font-size: 12px;
          color: #737373;
        }

        .default-badge {
          font-size: 11px;
          padding: 2px 6px;
          background: #DCFCE7;
          color: #166534;
          border-radius: 4px;
        }

        .active-badge {
          font-size: 11px;
          padding: 2px 6px;
          background: #DBEAFE;
          color: #1E40AF;
          border-radius: 4px;
        }

        .profile-actions {
          display: flex;
          gap: 8px;
        }

        .profile-actions button {
          padding: 6px 12px;
          border: 1px solid #E5E5E5;
          border-radius: 4px;
          background: #FFFFFF;
          cursor: pointer;
          font-size: 12px;
        }

        .profile-actions button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .add-profile-section {
          border-top: 1px solid #E5E5E5;
          padding-top: 20px;
        }

        .add-profile-section h3 {
          margin: 0 0 16px 0;
          font-size: 16px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          font-size: 14px;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #E5E5E5;
          border-radius: 6px;
          font-size: 14px;
        }

        .btn-primary {
          width: 100%;
          padding: 12px;
          border: none;
          border-radius: 6px;
          background: #0A0A0A;
          color: #FFFFFF;
          cursor: pointer;
          font-weight: 500;
        }

        .btn-primary:hover {
          background: #262626;
        }

        .btn-disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-edit {
          color: #0369A1;
          border-color: #0369A1;
        }

        .edit-form {
          width: 100%;
        }

        .edit-form .form-group {
          margin-bottom: 12px;
        }

        .edit-actions {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }

        .btn-sm {
          width: auto;
          padding: 8px 20px;
        }

        .btn-cancel {
          padding: 8px 20px;
          border: 1px solid #E5E5E5;
          border-radius: 6px;
          background: #FFFFFF;
          cursor: pointer;
          font-size: 13px;
          color: #0A0A0A;
        }

        .btn-cancel:hover {
          background: #FAFAFA;
          border-color: #D4D4D4;
        }
      `}</style>
    </div>
  )
}
