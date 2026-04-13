import { useState, useEffect } from 'react'
import { AI_PROVIDERS } from '../../shared/constants'
import { validateApiKeyFormat, prevalidateApiKey } from '../../shared/api-validator'

interface Props {
  apiKey: string
  provider: string
  customApiUrl?: string
  onSave: (apiKey: string, provider: string, customApiUrl?: string) => void
}

export function ApiKeyInput({ apiKey, provider, customApiUrl, onSave }: Props) {
  const [value, setValue] = useState('')
  const [selectedProvider, setSelectedProvider] = useState('openai')
  const [customUrl, setCustomUrl] = useState('')
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)
  const [validating, setValidating] = useState(false)
  const [validationError, setValidationError] = useState('')
  const [validationSuccess, setValidationSuccess] = useState(false)

  useEffect(() => {
    setValue(apiKey)
    setSelectedProvider(provider)
    setCustomUrl(customApiUrl || '')
  }, [apiKey, provider, customApiUrl])

  // 实时验证 API Key 格式
  useEffect(() => {
    if (value) {
      const result = validateApiKeyFormat(value, selectedProvider)
      if (!result.valid) {
        setValidationError(result.error)
        setValidationSuccess(false)
      } else {
        setValidationError('')
      }
    } else {
      setValidationError('')
      setValidationSuccess(false)
    }
  }, [value, selectedProvider])

  const handleSave = async () => {
    // 先验证
    const result = validateApiKeyFormat(value, selectedProvider)
    if (!result.valid) {
      setValidationError(result.error)
      return
    }

    setSaving(true)
    setValidationError('')
    setValidationSuccess(false)

    // 预验证 API Key
    if (value && selectedProvider !== 'wenxin') {
      try {
        setValidating(true)
        const validation = await prevalidateApiKey(
          value,
          selectedProvider,
          selectedProvider === 'custom' ? customUrl : undefined
        )

        if (!validation.valid) {
          setValidationError(validation.error)
          setValidating(false)
          setSaving(false)
          return
        }

        setValidationSuccess(true)
      } catch {
        // 预验证失败不阻止保存，只提示
        console.warn('API Key 预验证失败，但允许保存')
      } finally {
        setValidating(false)
      }
    }

    await onSave(value, selectedProvider, selectedProvider === 'custom' ? customUrl : undefined)
    setSaving(false)

    // 3秒后清除成功提示
    if (validationSuccess) {
      setTimeout(() => setValidationSuccess(false), 3000)
    }
  }

  const currentProvider = AI_PROVIDERS[selectedProvider as keyof typeof AI_PROVIDERS]
  const isCustomProvider = selectedProvider === 'custom'

  return (
    <div className="section">
      <h2>API 配置</h2>

      <div className="form-group">
        <label>AI 提供商</label>
        <select
          value={selectedProvider}
          onChange={(e) => setSelectedProvider(e.target.value)}
        >
          <optgroup label="国外模型">
            <option value="openai">OpenAI (GPT-4)</option>
            <option value="claude">Anthropic (Claude)</option>
          </optgroup>
          <optgroup label="国产大模型">
            <option value="qwen">通义千问 (阿里云)</option>
            <option value="glm">智谱 GLM</option>
            <option value="wenxin">文心一言 (百度)</option>
            <option value="kimi">Kimi (月之暗面)</option>
            <option value="deepseek">DeepSeek</option>
            <option value="doubao">豆包 (火山云)</option>
          </optgroup>
          <optgroup label="其他">
            <option value="custom">自定义 API</option>
          </optgroup>
        </select>
      </div>

      {isCustomProvider && (
        <div className="form-group">
          <label>自定义 API 端点</label>
          <input
            type="text"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="https://your-api-endpoint.com/v1/chat/completions"
          />
          <p className="help">请输入兼容 OpenAI 格式的 API 端点地址</p>
        </div>
      )}

      <div className="form-group">
        <label>API Key</label>
        <div className="input-group">
          <input
            type={show ? 'text' : 'password'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={selectedProvider === 'wenxin' ? 'accessKey.secretKey' : 'sk-...'}
          />
          <button
            type="button"
            className="toggle-btn"
            onClick={() => setShow(!show)}
          >
            {show ? '隐藏' : '显示'}
          </button>
        </div>
        <p className="help">
          您的 API Key 仅存储在本地，不会上传到我们的服务器。
          {currentProvider?.apiKeyUrl && (
            <>
              {' '}·{' '}
              <a href={currentProvider.apiKeyUrl} target="_blank" rel="noopener noreferrer">
                获取 {currentProvider.name} API Key →
              </a>
            </>
          )}
        </p>
        {validationError && (
          <p className="error">{validationError}</p>
        )}
        {validationSuccess && (
          <p className="success">✅ API Key 验证通过</p>
        )}
        {validating && (
          <p className="validating">验证中...</p>
        )}
      </div>

      <button
        className="btn-primary"
        onClick={handleSave}
        disabled={saving || (isCustomProvider && !customUrl)}
      >
        {saving ? '保存中...' : '保存配置'}
      </button>

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

        .form-group input::placeholder {
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
          white-space: nowrap;
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

        .error {
          margin-top: 8px;
          padding: 8px 12px;
          background: #FEF2F2;
          border: 1px solid #FECACA;
          border-radius: 6px;
          color: #DC2626;
          font-size: 13px;
        }

        .success {
          margin-top: 8px;
          padding: 8px 12px;
          background: #F0FDF4;
          border: 1px solid #BBF7D0;
          border-radius: 6px;
          color: #16A34A;
          font-size: 13px;
        }

        .validating {
          margin-top: 8px;
          padding: 8px 12px;
          background: #EFF6FF;
          border: 1px solid #DBEAFE;
          border-radius: 6px;
          color: #2563EB;
          font-size: 13px;
        }
      `}</style>
    </div>
  )
}
