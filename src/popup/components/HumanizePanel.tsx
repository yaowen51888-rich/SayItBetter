import type { HumanizeConfig } from '../../shared/types'

interface HumanizePanelProps {
  config: HumanizeConfig
  onConfigChange: (config: HumanizeConfig) => void
}

export function HumanizePanel({ config, onConfigChange }: HumanizePanelProps) {
  const handleEnabledChange = (enabled: boolean) => {
    onConfigChange({ ...config, enabled })
  }

  const openSettings = () => {
    chrome.runtime.openOptionsPage()
  }

  return (
    <div className="humanize-panel">
      <div className="panel-section">
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => handleEnabledChange(e.target.checked)}
          />
          <span className="toggle-label">
            <span className="toggle-title">启用人性化处理</span>
            <span className="toggle-desc">去除 AI 写作痕迹，让内容更自然</span>
          </span>
        </label>
      </div>

      {config.enabled && (
        <div className="panel-section">
          <div className="config-display">
            <div className="config-item">
              <span className="config-label">处理模型:</span>
              <span className="config-value">{config.humanizeModel || '未配置'}</span>
            </div>
          </div>
          <button onClick={openSettings} className="settings-btn">
            打开设置配置模型
          </button>
        </div>
      )}

      <style>{`
        .humanize-panel {
          padding: 16px;
        }

        .panel-section {
          margin-bottom: 16px;
        }

        .panel-section:last-child {
          margin-bottom: 0;
        }

        .toggle-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          cursor: pointer;
          padding: 8px 0;
        }

        .toggle-row input[type="checkbox"] {
          width: 18px;
          height: 18px;
          margin-top: 2px;
          cursor: pointer;
        }

        .toggle-label {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .toggle-title {
          font-size: 14px;
          font-weight: 500;
          color: #0A0A0A;
        }

        .toggle-desc {
          font-size: 12px;
          color: #737373;
          line-height: 1.4;
        }

        .config-display {
          background: #FAFAFA;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 12px;
        }

        .config-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 0;
        }

        .config-label {
          font-size: 13px;
          color: #737373;
        }

        .config-value {
          font-size: 13px;
          font-weight: 500;
          color: #0A0A0A;
        }

        .settings-btn {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #E5E5E5;
          border-radius: 6px;
          background: #FFFFFF;
          color: #0A0A0A;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 150ms;
        }

        .settings-btn:hover {
          background: #FAFAFA;
          border-color: #D4D4D4;
        }
      `}</style>
    </div>
  )
}
