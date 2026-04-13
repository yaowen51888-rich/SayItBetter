interface ProcessingIndicatorProps {
  isVisible: boolean
  stage?: 'initial' | 'humanized' | 'post-processed' | 'complete'
  progress?: number
  message?: string
}

export function ProcessingIndicator({
  isVisible,
  stage = 'initial',
  progress = 0,
  message,
}: ProcessingIndicatorProps) {
  if (!isVisible) return null

  const getStageText = () => {
    switch (stage) {
      case 'initial':
        return '正在生成内容...'
      case 'humanized':
        return '正在优化文笔...'
      case 'post-processed':
        return '正在最终处理...'
      case 'complete':
        return '处理完成'
      default:
        return '处理中...'
    }
  }

  const getStageIcon = () => {
    switch (stage) {
      case 'initial':
        return '✨'
      case 'humanized':
        return '🎯'
      case 'post-processed':
        return '🔧'
      case 'complete':
        return '✓'
      default:
        return '⚡'
    }
  }

  return (
    <div className="indicator-overlay">
      <div className="indicator-container">
        <div className="indicator-icon">{getStageIcon()}</div>
        <h3 className="indicator-title">{getStageText()}</h3>

        {message && <p className="indicator-message">{message}</p>}

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="progress-text">{progress.toFixed(0)}%</div>

        {stage !== 'complete' && (
          <div className="processing-dots">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        )}

        <style>{`
          .indicator-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.95);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 999;
            animation: fadeIn 150ms;
          }

          .indicator-container {
            text-align: center;
            padding: 32px;
            animation: scaleIn 200ms;
          }

          .indicator-icon {
            font-size: 48px;
            margin-bottom: 16px;
            animation: bounce 1s infinite;
          }

          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }

          .indicator-title {
            font-size: 18px;
            font-weight: 600;
            color: #0A0A0A;
            margin-bottom: 8px;
          }

          .indicator-message {
            font-size: 14px;
            color: #737373;
            margin-bottom: 24px;
          }

          .progress-bar {
            width: 280px;
            height: 6px;
            background: #E5E5E5;
            border-radius: 3px;
            overflow: hidden;
            margin: 0 auto 12px;
          }

          .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #0A0A0A 0%, #262626 100%);
            border-radius: 3px;
            transition: width 300ms ease;
            animation: shimmer 2s infinite;
          }

          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }

          .progress-text {
            font-size: 14px;
            font-weight: 500;
            color: #0A0A0A;
            margin-bottom: 16px;
          }

          .processing-dots {
            display: flex;
            gap: 8px;
            justify-content: center;
          }

          .dot {
            width: 8px;
            height: 8px;
            background: #0A0A0A;
            border-radius: 50%;
            animation: pulse 1.4s infinite;
          }

          .dot:nth-child(1) { animation-delay: 0s; }
          .dot:nth-child(2) { animation-delay: 0.2s; }
          .dot:nth-child(3) { animation-delay: 0.4s; }

          @keyframes pulse {
            0%, 80%, 100% {
              opacity: 0.3;
              transform: scale(0.8);
            }
            40% {
              opacity: 1;
              transform: scale(1);
            }
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes scaleIn {
            from {
              opacity: 0;
              transform: scale(0.9);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}</style>
      </div>
    </div>
  )
}
