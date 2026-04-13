import { EnhancedTextSelector } from './enhanced-text-selector'
import { PopupInjector } from './popup-injector'
import { StreamState } from '../shared/types'

// 初始化
const selector = new EnhancedTextSelector()
const injector = new PopupInjector()

// 监听来自 background 的消息
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const { type, data } = message

  if (type === 'SHOW_POPUP') {
    // 异步处理，保持消息通道打开
    (async () => {
      try {
        const selectedText = window.getSelection()?.toString()
        if (selectedText) {
          await injector.showPopup(selectedText)
          sendResponse({ success: true })
        } else {
          injector.showToast('请先选中要处理的文本')
          sendResponse({ success: false, error: '未选中文本' })
        }
      } catch (error) {
        sendResponse({ success: false, error: '显示弹窗失败' })
      }
    })()
    return true  // 保持消息通道打开
  }

  if (type === 'STREAM_CHUNK') {
    const { chunk, streamState } = data

    // 调试日志
    console.log('[Content] 收到STREAM_CHUNK:', {
      chunkLength: chunk?.length || 0,
      chunk: chunk?.substring(0, 20),
      streamState,
      currentState: injector.streamState
    })

    // 处理状态切换
    if (streamState === 'thinking' && injector.streamState !== StreamState.THINKING) {
      console.log('[Content] 切换到THINKING状态')
      injector.streamState = StreamState.THINKING
      injector.showThinkingUI()
    } else if (streamState === 'generating' && injector.streamState !== StreamState.GENERATING) {
      console.log('[Content] 切换到GENERATING状态')
      injector.streamState = StreamState.GENERATING
      injector.showGeneratingUI()
    } else if (streamState === 'completed') {
      console.log('[Content] 流式完成')
      injector.streamState = StreamState.COMPLETED
      injector.stopThinkingTimer()
      injector.finishStreamContent()
    }

    // 追加内容（仅在生成阶段）
    if (chunk && injector.streamState === StreamState.GENERATING) {
      console.log('[Content] 追加内容:', chunk.substring(0, 30))
      injector.appendStreamContent(chunk)
    }

    sendResponse({ success: true })
    return true
  }

  if (type === 'STREAM_COMPLETE') {
    // 流式输出完成，渲染 Markdown
    console.log('[Content] 收到 STREAM_COMPLETE 消息，开始渲染 Markdown')
    injector.finishStreamContent()
    return true
  }

  return false
})

// 监听文本选择（预留回调接口）
selector.onTextSelected((_text) => {
  // 预留：可以在这里添加用户提示功能
})
