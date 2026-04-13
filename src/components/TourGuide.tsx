/**
 * 使用说明组件
 * 位置策略：非侵入式，易发现但不打扰
 */

import { useState } from 'react'

export interface TourStep {
  title: string
  content: string
  target?: string
  action?: string
}

export function TourGuide({ steps, onComplete }: { steps: TourStep[], onComplete?: () => void }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  const next = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      complete()
    }
  }

  const prev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const complete = () => {
    setIsVisible(false)
    onComplete?.()
    // 标记已完成
    localStorage.setItem('contentcraft-tour-completed', 'true')
  }

  const skip = () => {
    complete()
  }

  if (!isVisible) return null

  const step = steps[currentStep]

  return (
    <>
      {/* 遮罩层 */}
      <div className="tour-overlay" onClick={skip} />

      {/* 引导卡片 */}
      <div className="tour-card">
        <div className="tour-header">
          <div className="tour-progress">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`tour-dot ${i === currentStep ? 'active' : ''} ${i < currentStep ? 'completed' : ''}`}
              />
            ))}
          </div>
          <button className="tour-close" onClick={skip} aria-label="关闭">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="tour-content">
          <h3>{step.title}</h3>
          <p>{step.content}</p>
          {step.action && (
            <div className="tour-action">
              <button className="btn-primary" onClick={next}>
                {step.action}
              </button>
            </div>
          )}
        </div>

        <div className="tour-footer">
          <span className="tour-step-info">
            {currentStep + 1} / {steps.length}
          </span>
          <div className="tour-actions">
            <button className="btn-text" onClick={prev} disabled={currentStep === 0}>
              上一步
            </button>
            <button className="btn-primary" onClick={next}>
              {currentStep === steps.length - 1 ? '完成' : '下一步'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .tour-overlay {
          position: fixed;
          inset: 0;
          background: rgba(10, 10, 10, 0.5);
          z-index: 9999;
          animation: fadeIn 150ms cubic-bezier(0, 0, 0.2, 1);
        }

        .tour-card {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: #FFFFFF;
          border: 1px solid #E5E5E5;
          border-radius: 12px;
          padding: 24px;
          width: 90%;
          max-width: 400px;
          z-index: 10000;
          animation: scaleIn 200ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes scaleIn {
          from {
            opacity: 0,
            transform: translate(-50%, -50%) scale(0.98);
          }
          to {
            opacity: 1,
            transform: translate(-50%, -50%) scale(1);
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .tour-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .tour-progress {
          display: flex;
          gap: 6px;
        }

        .tour-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #E5E5E5;
          transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .tour-dot.active {
          background: #0A0A0A;
          width: 20px;
          border-radius: 3px;
        }

        .tour-dot.completed {
          background: #0A0A0A;
        }

        .tour-close {
          background: none;
          border: none;
          padding: 4px;
          cursor: pointer;
          color: #737373;
          transition: color 150ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .tour-close:hover {
          color: #0A0A0A;
        }

        .tour-content h3 {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 8px;
          color: #0A0A0A;
        }

        .tour-content p {
          font-size: 14px;
          color: #737373;
          line-height: 1.6;
        }

        .tour-action {
          margin-top: 16px;
        }

        .tour-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 20px;
        }

        .tour-step-info {
          font-size: 13px;
          color: #737373;
        }

        .tour-actions {
          display: flex;
          gap: 8px;
        }

        .btn-text {
          background: none;
          border: none;
          padding: 8px 16px;
          font-size: 14px;
          color: #0A0A0A;
          cursor: pointer;
          transition: color 150ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .btn-text:hover:not(:disabled) {
          color: #0A0A0A;
        }

        .btn-text:disabled {
          color: #D4D4D4;
          cursor: not-allowed;
        }

        .btn-primary {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          background: #0A0A0A;
          color: #FFFFFF;
          cursor: pointer;
          transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .btn-primary:hover {
          background: #262626;
        }
      `}</style>
    </>
  )
}

export function QuickHelp({ position = 'bottom-right' }: { position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }) {
  const [isOpen, setIsOpen] = useState(false)

  const helpItems = [
    {
      icon: '⌨️',
      title: '快捷键',
      description: 'Ctrl+Shift+Q (Mac: Cmd+Shift+Q)',
    },
    {
      icon: '✨',
      title: '人性化处理',
      description: '自动去除 AI 写作痕迹',
    },
    {
      icon: '📋',
      title: '多平台支持',
      description: 'Twitter、小红书、LinkedIn、朋友圈',
    },
    {
      icon: '🎨',
      title: '自定义风格',
      description: '在设置中添加自定义模板',
    },
  ]

  return (
    <div className={`quick-help quick-help-${position}`}>
      <button
        className="quick-help-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="帮助"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2ZM10 16C6.68629 16 4 13.3137 4 10C4 6.68629 6.68629 4 10 4C13.3137 4 16 6.68629 16 10C16 13.3137 13.3137 16 10 16ZM10 12C11.1046 12 12 11.1046 12 10C12 8.89543 11.1046 8 10 8C8.89543 8 8 8.89543 8 10C8 11.1046 8.89543 12 10 12Z"
            fill="currentColor"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="quick-help-panel">
          <div className="quick-help-header">
            <span>快速帮助</span>
            <button
              className="quick-help-close"
              onClick={() => setIsOpen(false)}
              aria-label="关闭"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          <div className="quick-help-content">
            {helpItems.map((item, index) => (
              <div key={index} className="quick-help-item">
                <span className="quick-help-icon">{item.icon}</span>
                <div className="quick-help-text">
                  <span className="quick-help-title">{item.title}</span>
                  <span className="quick-help-desc">{item.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .quick-help {
          position: fixed;
          z-index: 100;
        }

        .quick-help-bottom-right {
          bottom: 20px;
          right: 20px;
        }

        .quick-help-top-right {
          top: 20px;
          right: 20px;
        }

        .quick-help-trigger {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #0A0A0A;
          color: #FFFFFF;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .quick-help-trigger:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
        }

        .quick-help-panel {
          position: absolute;
          bottom: 60px;
          right: 0;
          width: 280px;
          background: #FFFFFF;
          border: 1px solid #E5E5E5;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
          animation: scaleIn 150ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .quick-help-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid #E5E5E5;
        }

        .quick-help-header span {
          font-size: 14px;
          font-weight: 600;
          color: #0A0A0A;
        }

        .quick-help-close {
          background: none;
          border: none;
          padding: 4px;
          cursor: pointer;
          color: #737373;
          transition: color 150ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .quick-help-close:hover {
          color: #0A0A0A;
        }

        .quick-help-content {
          padding: 12px;
        }

        .quick-help-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 8px 0;
        }

        .quick-help-icon {
          font-size: 18px;
          flex-shrink: 0;
        }

        .quick-help-text {
          flex: 1;
        }

        .quick-help-title {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #0A0A0A;
          margin-bottom: 2px;
        }

        .quick-help-desc {
          font-size: 13px;
          color: #737373;
          line-height: 1.4;
        }

        .quick-help-footer {
          padding: 12px 16px;
          border-top: 1px solid #E5E5E5;
        }

        .quick-help-link {
          font-size: 13px;
          color: #0EA5E9;
          text-decoration: none;
          display: block;
        }

        .quick-help-link:hover {
          color: #0284C7;
          text-decoration: underline;
        }
      `}</style>
    </div>
  )
}
