import { StreamState } from '../shared/types'

export class PopupInjector {
  private popupElement: HTMLElement | null = null
  private shadowRoot: ShadowRoot | null = null
  private currentLoadingElement: HTMLElement | null = null
  private currentResultElement: HTMLElement | null = null
  private currentPlatform: string = 'twitter'
  private currentStyle: string = 'professional' // 默认风格
  private originalText: string = ''
  private generatedContent: string = '' // 存储生成的纯文本内容（用于复制）

  // 新增属性：状态管理
  streamState: StreamState = StreamState.THINKING
  private thinkingStartTime: number = 0
  private thinkingTimerElement: HTMLElement | null = null
  private thinkingTimerInterval: number | null = null
  private stateTimeoutTimer: number | null = null

  /**
   * 显示浮窗
   */
  async showPopup(text: string) {
    this.removePopup()

    // 从存储中读取用户设置的默认平台和风格
    try {
      const result = await chrome.storage.local.get('userSettings')
      const userSettings = result.userSettings
      if (userSettings?.defaultPlatform) {
        this.currentPlatform = userSettings.defaultPlatform
      }
      if (userSettings?.defaultStyle) {
        this.currentStyle = userSettings.defaultStyle
      }
    } catch (error) {
      console.warn('读取用户设置失败，使用默认值:', error)
    }

    // 创建容器
    this.popupElement = document.createElement('div')
    this.popupElement.className = 'contentcraft-popup-wrapper'

    // 创建 Shadow DOM
    this.shadowRoot = this.popupElement.attachShadow({ mode: 'open' })

    // 注入样式
    this.injectStyles()

    // 创建浮窗内容
    const popup = await this.createPopupContent(text)
    this.shadowRoot.appendChild(popup)

    // 计算位置
    const position = this.calculatePosition()

    // 设置样式
    this.popupElement.style.cssText = `
      position: fixed;
      z-index: 2147483647;
      left: ${position.x}px;
      top: ${position.y}px;
    `

    // 添加到页面
    document.body.appendChild(this.popupElement)
  }

  /**
   * 移除浮窗
   */
  removePopup() {
    // 清理所有计时器
    this.stopThinkingTimer()

    // 清理状态超时
    if (this.stateTimeoutTimer) {
      clearTimeout(this.stateTimeoutTimer)
      this.stateTimeoutTimer = null
    }

    // 移除弹窗
    if (this.popupElement && this.popupElement.parentNode) {
      this.popupElement.parentNode.removeChild(this.popupElement)
    }

    // 清理引用
    this.popupElement = null
    this.shadowRoot = null
    this.currentResultElement = null
    this.thinkingTimerElement = null
  }

  /**
   * 显示提示消息
   */
  showToast(message: string) {
    const toast = document.createElement('div')
    toast.textContent = message
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 2147483647;
      background: #3b82f6;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: slideIn 0.3s ease-out;
    `

    // 添加动画
    const style = document.createElement('style')
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `
    document.head.appendChild(style)

    document.body.appendChild(toast)

    // 3秒后移除
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast)
      }
    }, 3000)
  }

  /**
   * 追加流式生成的内容
   */
  appendStreamContent(chunk: string) {
    if (!this.currentResultElement) return

    // 隐藏加载状态
    if (this.currentLoadingElement) {
      this.currentLoadingElement.style.display = 'none'
    }
    if (this.currentResultElement.parentElement) {
      this.currentResultElement.parentElement.style.display = 'block'
    }

    // 追加内容到 generatedContent
    this.generatedContent += chunk

    // 实时更新显示（纯文本）
    this.currentResultElement.textContent = this.generatedContent

    // 启用复制按钮
    const copyBtn = this.shadowRoot?.querySelector('.contentcraft-btn-primary') as HTMLButtonElement
    if (copyBtn && this.generatedContent) {
      copyBtn.disabled = false
    }
  }

  /**
   * 完成流式输出，渲染最终 Markdown
   */
  async finishStreamContent() {
    console.log('[PopupInjector] finishStreamContent 被调用')
    console.log('[PopupInjector] currentResultElement:', !!this.currentResultElement)
    console.log('[PopupInjector] generatedContent:', this.generatedContent?.substring(0, 50))

    if (!this.currentResultElement || !this.generatedContent) {
      console.warn('[PopupInjector] finishStreamContent 条件不满足，跳过渲染')
      return
    }

    // 渲染 Markdown 内容
    try {
      const { parseMarkdown } = await import('../shared/markdown-parser')
      console.log('[PopupInjector] 开始解析 Markdown...')
      const renderedHTML = parseMarkdown(this.generatedContent)
      console.log('[PopupInjector] Markdown 解析完成，HTML 长度:', renderedHTML.length)
      this.currentResultElement.innerHTML = renderedHTML
      this.currentResultElement.style.color = '#1f2937'
      console.log('[PopupInjector] Markdown 渲染完成')
    } catch (error) {
      console.error('[PopupInjector] Markdown 解析失败:', error)
      // Markdown 解析失败，使用纯文本
      this.currentResultElement.textContent = this.generatedContent
    }
  }

  /**
   * 注入样式 - OpenAI 极简风格
   */
  private injectStyles() {
    if (!this.shadowRoot) return

    const style = document.createElement('style')
    style.textContent = `
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      .contentcraft-popup {
        background: #FFFFFF;
        border: 1px solid #E5E5E5;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        width: 360px;
        max-height: 500px;
        display: flex;
        flex-direction: column;
        font-family: "Inter", -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        animation: popupEnter 200ms cubic-bezier(0.16, 1, 0.3, 1);
      }

      @keyframes popupEnter {
        from {
          opacity: 0;
          transform: translateY(4px) scale(0.98);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes popupExit {
        from {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
        to {
          opacity: 0;
          transform: translateY(4px) scale(0.98);
        }
      }

      .contentcraft-popup.closing {
        animation: popupExit 150ms cubic-bezier(0.4, 0, 1, 1) forwards;
      }

      .contentcraft-header {
        padding: 16px;
        border-bottom: 1px solid #E5E5E5;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .contentcraft-title {
        font-size: 15px;
        font-weight: 600;
        color: #0A0A0A;
      }

      .contentcraft-close {
        background: none;
        border: none;
        font-size: 18px;
        color: #737373;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
        transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
      }

      .contentcraft-close:hover {
        color: #0A0A0A;
        background: #F5F5F5;
      }

      .contentcraft-body {
        padding: 16px;
        flex: 1;
        overflow-y: auto;
        min-height: 0;
      }

      .contentcraft-original {
        font-size: 13px;
        color: #737373;
        margin-bottom: 16px;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        line-height: 1.5;
      }

      .contentcraft-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 32px;
        gap: 12px;
      }

      /* AI 思考动画 - 克制版 */
      .contentcraft-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 32px;
        gap: 16px;
      }

      .contentcraft-thinking {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 12px;
        background: #FAFAFA;
        border-radius: 20px;
      }

      .contentcraft-thinking-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #0A0A0A;
        opacity: 0.4;
        animation: thinkingDot 1.2s infinite;
      }

      .contentcraft-thinking-dot:nth-child(1) {
        animation-delay: 0s;
      }

      .contentcraft-thinking-dot:nth-child(2) {
        animation-delay: 0.2s;
      }

      .contentcraft-thinking-dot:nth-child(3) {
        animation-delay: 0.4s;
      }

      @keyframes thinkingDot {
        0%, 80%, 100% {
          opacity: 0.4;
        }
        40% {
          opacity: 1;
        }
      }

      .contentcraft-loading-text {
        font-size: 13px;
        color: #737373;
      }

      /* 思考状态容器 */
      .contentcraft-thinking-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px 20px;
        gap: 16px;
        animation: fadeIn 200ms ease-out;
      }

      /* 思考图标 */
      .contentcraft-thinking-icon {
        font-size: 48px;
        opacity: 0.8;
        animation: thinkingPulse 2s ease-in-out infinite;
      }

      @keyframes thinkingPulse {
        0%, 100% {
          transform: scale(1);
          opacity: 0.8;
        }
        50% {
          transform: scale(1.05);
          opacity: 1;
        }
      }

      /* 思考文字 */
      .contentcraft-thinking-text {
        font-size: 15px;
        font-weight: 500;
        color: #0A0A0A;
        text-align: center;
      }

      /* 思考计时器 */
      .contentcraft-thinking-timer {
        font-size: 13px;
        color: #737373;
        font-family: 'Menlo', 'Monaco', monospace;
        background: #FAFAFA;
        padding: 6px 12px;
        border-radius: 12px;
      }

      /* 处理进度条（仅在底部显示） */
      .contentcraft-progress-bar {
        width: 100%;
        height: 2px;
        background: #E5E5E5;
        border-radius: 1px;
        overflow: hidden;
        margin-top: 8px;
      }

      .contentcraft-progress-bar::after {
        content: '';
        display: block;
        width: 30%;
        height: 100%;
        background: #0A0A0A;
        border-radius: 1px;
        animation: progressSlide 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
      }

      @keyframes progressSlide {
        0% {
          transform: translateX(-100%);
        }
        100% {
          transform: translateX(400%);
        }
      }

      .contentcraft-result {
        font-size: 14px;
        line-height: 1.6;
        color: #0A0A0A;
        animation: fadeIn 150ms cubic-bezier(0, 0, 0.2, 1);
        word-wrap: break-word;
        overflow-wrap: break-word;
      }

      .contentcraft-result-container {
        display: none;
      }

      /* 字符计数样式 */
      .contentcraft-char-count {
        font-size: 12px;
        padding: 8px 12px;
        margin-bottom: 8px;
        background: #FAFAFA;
        border-radius: 4px;
        color: #737373;
      }

      .contentcraft-count-ok {
        color: #16a34a;
        background: #f0fdf4;
      }

      .contentcraft-count-over {
        color: #dc2626;
        background: #fef2f2;
      }

      /* Markdown 渲染样式 */
      .contentcraft-result strong {
        font-weight: 600;
      }

      .contentcraft-result em {
        font-style: italic;
      }

      .contentcraft-result code.inline-code {
        font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
        font-size: 0.9em;
        padding: 2px 6px;
        background: #F5F5F5;
        border-radius: 3px;
        color: #d63384;
      }

      .contentcraft-result pre {
        font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
        font-size: 13px;
        padding: 12px;
        background: #F5F5F5;
        border-radius: 6px;
        overflow-x: auto;
        white-space: pre;
        margin: 8px 0;
      }

      .contentcraft-result pre code {
        background: none;
        padding: 0;
        color: inherit;
      }

      .contentcraft-result a {
        color: #2563eb;
        text-decoration: underline;
      }

      .contentcraft-result a:hover {
        color: #1d4ed8;
      }

      .contentcraft-result ul {
        margin: 8px 0;
        padding-left: 20px;
      }

      .contentcraft-result li {
        margin: 4px 0;
      }

      .contentcraft-result p {
        margin: 8px 0;
      }

      .contentcraft-result h1,
      .contentcraft-result h2,
      .contentcraft-result h3 {
        margin: 12px 0 8px 0;
        font-weight: 600;
      }

      .contentcraft-result h1 {
        font-size: 16px;
      }

      .contentcraft-result h2 {
        font-size: 15px;
      }

      .contentcraft-result h3 {
        font-size: 14px;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .contentcraft-actions {
        padding: 12px 16px;
        border-top: 1px solid #E5E5E5;
        display: flex;
        gap: 8px;
        flex-shrink: 0;
        background: #FFFFFF;
        border-radius: 0 0 8px 8px;
      }

      .contentcraft-btn {
        flex: 1;
        padding: 10px 16px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
      }

      .contentcraft-btn-primary {
        background: #0A0A0A;
        color: #FFFFFF;
      }

      .contentcraft-btn-primary:hover {
        background: #262626;
      }

      .contentcraft-btn-primary:active {
        background: #404040;
      }

      .contentcraft-btn-secondary {
        background: #FFFFFF;
        color: #0A0A0A;
        border: 1px solid #E5E5E5;
      }

      .contentcraft-btn-secondary:hover {
        background: #FAFAFA;
        border-color: #D4D4D4;
      }

      .contentcraft-platform-selector {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 6px;
        margin-bottom: 16px;
      }

      .contentcraft-platform-btn {
        padding: 8px 4px;
        border: 1px solid #E5E5E5;
        border-radius: 6px;
        background: #FFFFFF;
        font-size: 11px;
        color: #737373;
        cursor: pointer;
        transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .contentcraft-platform-btn:hover {
        border-color: #D4D4D4;
        color: #0A0A0A;
      }

      .contentcraft-platform-btn.active {
        border-color: #0A0A0A;
        background: #0A0A0A;
        color: #FFFFFF;
      }

      /* 风格选择器 */
      .contentcraft-style-selector {
        margin-bottom: 16px;
      }

      .contentcraft-style-label {
        font-size: 12px;
        color: #737373;
        margin-bottom: 8px;
        display: block;
      }

      .contentcraft-style-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .contentcraft-style-btn {
        padding: 6px 10px;
        border: 1px solid #E5E5E5;
        border-radius: 4px;
        background: #FFFFFF;
        font-size: 12px;
        color: #737373;
        cursor: pointer;
        transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
        white-space: nowrap;
      }

      .contentcraft-style-btn:hover {
        border-color: #D4D4D4;
        color: #0A0A0A;
      }

      .contentcraft-style-btn.active {
        border-color: #0A0A0A;
        background: #0A0A0A;
        color: #FFFFFF;
      }

      .contentcraft-char-count {
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 13px;
        font-weight: 500;
        margin-bottom: 16px;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .contentcraft-count-ok {
        background: #F5F5F5;
        color: #0A0A0A;
      }

      .contentcraft-count-over {
        background: #FEF2F2;
        color: #DC2626;
      }

      /* 滚动条样式 */
      .contentcraft-body::-webkit-scrollbar {
        width: 6px;
      }

      .contentcraft-body::-webkit-scrollbar-track {
        background: transparent;
      }

      .contentcraft-body::-webkit-scrollbar-thumb {
        background: #E5E5E5;
        border-radius: 3px;
      }

      .contentcraft-body::-webkit-scrollbar-thumb:hover {
        background: #D4D4D4;
      }
    `
    this.shadowRoot.appendChild(style)
  }

  /**
   * 创建浮窗内容
   */
  private async createPopupContent(text: string): Promise<HTMLElement> {
    const container = document.createElement('div')
    container.className = 'contentcraft-popup'

    // 头部
    const header = document.createElement('div')
    header.className = 'contentcraft-header'
    header.innerHTML = `
      <span class="contentcraft-title">ContentCraft AI</span>
      <button class="contentcraft-close">&times;</button>
    `
    container.appendChild(header)

    // 主体
    const body = document.createElement('div')
    body.className = 'contentcraft-body'

    // 原文预览
    const original = document.createElement('div')
    original.className = 'contentcraft-original'
    original.textContent = text.length > 100 ? text.slice(0, 100) + '...' : text
    body.appendChild(original)

    // 平台选择器
    const platformSelector = this.createPlatformSelector()
    body.appendChild(platformSelector)

    // 风格选择器
    const styleSelector = await this.createStyleSelector()
    body.appendChild(styleSelector)

    // 加载状态
    const loading = document.createElement('div')
    loading.className = 'contentcraft-loading'
    loading.innerHTML = `
      <div class="contentcraft-thinking">
        <div class="contentcraft-thinking-dot"></div>
        <div class="contentcraft-thinking-dot"></div>
        <div class="contentcraft-thinking-dot"></div>
      </div>
      <div class="contentcraft-progress-bar"></div>
      <span class="contentcraft-loading-text">AI 生成中...</span>
    `
    body.appendChild(loading)
    this.currentLoadingElement = loading

    // 结果区域（初始隐藏）
    const resultContainer = document.createElement('div')
    resultContainer.className = 'contentcraft-result-container'
    resultContainer.style.display = 'none'
    body.appendChild(resultContainer)

    // 结果内容
    const result = document.createElement('div')
    result.className = 'contentcraft-result'
    resultContainer.appendChild(result)
    this.currentResultElement = result

    container.appendChild(body)

    // 底部操作按钮
    const actions = document.createElement('div')
    actions.className = 'contentcraft-actions'
    actions.innerHTML = `
      <button class="contentcraft-btn contentcraft-btn-secondary">重新生成</button>
      <button class="contentcraft-btn contentcraft-btn-primary" disabled>复制</button>
    `
    container.appendChild(actions)

    // 绑定事件
    this.bindPopupEvents(container, text)

    return container
  }

  /**
   * 创建平台选择器
   */
  private createPlatformSelector(): HTMLElement {
    const container = document.createElement('div')
    container.className = 'contentcraft-platform-selector'

    const platforms = [
      { key: 'twitter', label: 'Twitter 🐦' },
      { key: 'xiaohongshu', label: '小红书 📕' },
      { key: 'linkedin', label: 'LinkedIn 💼' },
      { key: 'moments', label: '朋友圈 👥' },
      { key: 'weibo', label: '微博 📱' },
      { key: 'zhihu', label: '知乎 🧠' },
      { key: 'toutiao', label: '今日头条 📰' },
      { key: 'wechat', label: '公众号 💬' },
    ]

    platforms.forEach((platform) => {
      const btn = document.createElement('button')
      // 根据 currentPlatform 设置 active 状态
      const isActive = platform.key === this.currentPlatform
      btn.className = 'contentcraft-platform-btn' + (isActive ? ' active' : '')
      btn.textContent = platform.label
      btn.dataset.platform = platform.key

      btn.addEventListener('click', () => {
        container.querySelectorAll('.contentcraft-platform-btn').forEach(b => b.classList.remove('active'))
        btn.classList.add('active')
        this.currentPlatform = platform.key
      })

      container.appendChild(btn)
    })

    return container
  }

  /**
   * 创建风格选择器
   */
  private async createStyleSelector(): Promise<HTMLElement> {
    const container = document.createElement('div')
    container.className = 'contentcraft-style-selector'

    // 获取用户风格
    let userStyles: any[] = []
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_USER_STYLES' })
      if (response.success) {
        userStyles = response.styles || []
      }
    } catch {
      // 忽略错误，使用默认风格
    }

    // 默认风格 - 不使用解构赋值避免压缩问题
    const constantsModule = await import('../shared/constants')
    const DEFAULT_STYLES = constantsModule.DEFAULT_STYLES

    // 合并并去重（基于 id）
    const styleMap = new Map()
    DEFAULT_STYLES.forEach(style => styleMap.set(style.id, style))
    userStyles.forEach(style => {
      // 用户风格覆盖默认风格（如果 id 相同）
      styleMap.set(style.id, style)
    })

    const allStyles = Array.from(styleMap.values())

    // 标签
    const label = document.createElement('span')
    label.className = 'contentcraft-style-label'
    label.textContent = '写作风格'
    container.appendChild(label)

    // 按钮容器
    const buttonsContainer = document.createElement('div')
    buttonsContainer.className = 'contentcraft-style-buttons'

    // 免费版：所有风格完全可用
    allStyles.forEach((style) => {
      const btn = document.createElement('button')
      btn.className = 'contentcraft-style-btn'
      // 根据 currentStyle 设置 active 状态
      if (style.id === this.currentStyle) {
        btn.classList.add('active')
      }
      btn.textContent = style.name
      btn.dataset.styleId = style.id

      btn.addEventListener('click', async () => {
        buttonsContainer.querySelectorAll('.contentcraft-style-btn').forEach(b => b.classList.remove('active'))
        btn.classList.add('active')
        this.currentStyle = style.id
      })

      buttonsContainer.appendChild(btn)
    })

    container.appendChild(buttonsContainer)
    return container
  }

  /**
   * 绑定浮窗事件
   */
  private bindPopupEvents(container: HTMLElement, originalText: string) {
    this.originalText = originalText

    const closeBtn = container.querySelector('.contentcraft-close') as HTMLElement
    const regenerateBtn = container.querySelector('.contentcraft-btn-secondary') as HTMLElement
    const copyBtn = container.querySelector('.contentcraft-btn-primary') as HTMLElement

    // 关闭按钮
    closeBtn?.addEventListener('click', () => {
      this.removePopup()
    })

    // 重新生成按钮
    regenerateBtn?.addEventListener('click', () => {
      this.generateContent()
    })

    // 复制按钮
    copyBtn?.addEventListener('click', () => {
      if (this.generatedContent) {
        // 只复制生成的纯文本内容
        navigator.clipboard.writeText(this.generatedContent)
        copyBtn.textContent = '已复制!'
        setTimeout(() => {
          copyBtn.textContent = '复制'
        }, 2000)
      }
    })

    // 自动开始生成（重置内容并开始流式输出）
    setTimeout(() => {
      this.generatedContent = '' // 重置内容
      this.generateContent()
    }, 100)
  }

  /**
   * 启动思考计时器
   */
  startThinkingTimer(): void {
    // 确保只启动一个计时器
    this.stopThinkingTimer();

    this.thinkingStartTime = Date.now();

    this.thinkingTimerInterval = window.setInterval(() => {
      const elapsed = Date.now() - this.thinkingStartTime;
      const seconds = (elapsed / 1000).toFixed(1);

      if (this.thinkingTimerElement) {
        this.thinkingTimerElement.textContent = `已用时 ${seconds} 秒`;
      }
    }, 100);  // 每100ms更新一次
  }

  /**
   * 停止思考计时器
   */
  stopThinkingTimer(): void {
    if (this.thinkingTimerInterval) {
      clearInterval(this.thinkingTimerInterval);
      this.thinkingTimerInterval = null;
    }
  }

  /**
   * 显示思考状态 UI
   */
  showThinkingUI(): void {
    if (!this.shadowRoot) return;

    // 移除旧的思考状态 UI
    const existingThinking = this.shadowRoot.querySelector('.contentcraft-thinking-state');
    if (existingThinking) {
      existingThinking.remove();
    }

    // 隐藏加载状态
    if (this.currentLoadingElement) {
      this.currentLoadingElement.style.display = 'none';
    }

    // 隐藏结果区域
    if (this.currentResultElement?.parentElement) {
      this.currentResultElement.parentElement.style.display = 'none';
    }

    // 创建思考状态容器
    const thinkingState = document.createElement('div');
    thinkingState.className = 'contentcraft-thinking-state';

    // 创建思考图标
    const icon = document.createElement('div');
    icon.className = 'contentcraft-thinking-icon';
    icon.textContent = '🤔';

    // 创建思考文字
    const text = document.createElement('div');
    text.className = 'contentcraft-thinking-text';
    text.textContent = '正在深度思考中...';

    // 创建计时器
    const timer = document.createElement('div');
    timer.className = 'contentcraft-thinking-timer';
    timer.textContent = '已用时 0.0 秒';

    thinkingState.appendChild(icon);
    thinkingState.appendChild(text);
    thinkingState.appendChild(timer);

    // 插入到加载状态之后
    if (this.currentLoadingElement) {
      this.currentLoadingElement.parentNode?.insertBefore(
        thinkingState,
        this.currentLoadingElement.nextSibling
      );
    }

    this.thinkingTimerElement = timer;

    // 启动计时器
    this.startThinkingTimer();

    // 设置30秒超时保护：如果思考状态持续超过30秒，自动切换到生成状态
    this.stateTimeoutTimer = window.setTimeout(() => {
      console.warn('[PopupInjector] 思考状态超时（30秒），强制切换到生成状态');
      if (this.streamState === StreamState.THINKING) {
        this.streamState = StreamState.GENERATING;
        this.stopThinkingTimer();
        this.hideThinkingUI();
        this.showGeneratingUI();
      }
    }, 30000);
  }

  /**
   * 隐藏思考状态 UI
   */
  private hideThinkingUI(): void {
    // 先停止计时器
    this.stopThinkingTimer();

    if (!this.shadowRoot) return;

    const thinkingState = this.shadowRoot.querySelector('.contentcraft-thinking-state');
    if (thinkingState) {
      thinkingState.remove();
    }

    this.thinkingTimerElement = null;
  }

  /**
   * 显示生成状态 UI
   */
  showGeneratingUI(): void {
    // 隐藏思考状态
    this.hideThinkingUI();

    // 显示加载状态
    if (this.currentLoadingElement) {
      this.currentLoadingElement.style.display = 'flex';
    }

    // 显示结果区域
    if (this.currentResultElement?.parentElement) {
      this.currentResultElement.parentElement.style.display = 'block';
    }
  }

  /**
   * 生成内容（支持流式输出）
   */
  private async generateContent() {
    if (!this.currentLoadingElement || !this.currentResultElement) return

    // 重置状态（确保每次生成都从初始状态开始）
    this.streamState = StreamState.THINKING
    this.stopThinkingTimer() // 停止之前的计时器（如果有）

    // 显示加载状态
    this.currentLoadingElement.style.display = 'flex'
    if (this.currentResultElement.parentElement) {
      this.currentResultElement.parentElement.style.display = 'none'
    }
    this.generatedContent = '' // 重置内容

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GENERATE_CONTENT',
        data: {
          content: this.originalText,
          platform: this.currentPlatform,
          style: this.currentStyle,
        },
      })

      if (!response) {
        this.currentLoadingElement.style.display = 'none'
        this.currentResultElement.parentElement!.style.display = 'block'
        this.currentResultElement.textContent = '❌ 未收到响应，请重试'
        this.currentResultElement.style.color = '#ef4444'
      } else if (response.error) {
        this.currentLoadingElement.style.display = 'none'
        this.currentResultElement.parentElement!.style.display = 'block'
        this.currentResultElement.textContent = '❌ ' + response.error
        this.currentResultElement.style.color = '#ef4444'
      }
      // 成功时，流式数据已经通过 appendStreamContent 实时更新
      // 这里只需要处理最终状态
    } catch (error) {
      this.currentLoadingElement.style.display = 'none'
      if (this.currentResultElement.parentElement) {
        this.currentResultElement.parentElement.style.display = 'block'
      }
      this.currentResultElement.textContent = '❌ 生成失败，请重试'
      this.currentResultElement.style.color = '#ef4444'
    }
  }

  /**
   * 计算浮窗位置
   */
  private calculatePosition(): { x: number; y: number } {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) {
      return { x: 100, y: 100 }
    }

    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // 浮窗尺寸
    const popupWidth = 360
    const popupHeight = 500

    // 计算水平位置
    let x = rect.left
    if (x + popupWidth > viewportWidth) {
      x = viewportWidth - popupWidth - 20
    }
    if (x < 20) x = 20

    // 计算垂直位置
    let y = rect.bottom + 10
    if (y + popupHeight > viewportHeight) {
      // 下方空间不足，显示在上方
      y = rect.top - popupHeight - 10
    }
    if (y < 20) y = 20

    // position: fixed 定位相对于视口，不需要添加滚动偏移
    return {
      x: x,
      y: y,
    }
  }
}
