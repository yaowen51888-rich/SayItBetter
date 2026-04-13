type SelectionCallback = (text: string, range: Range) => void

export class TextSelector {
  private callback: SelectionCallback | null = null
  private debounceTimer: ReturnType<typeof setTimeout> | null = null
  private lastSelectedText = ''

  constructor() {
    this.init()
  }

  private init() {
    // 监听鼠标抬起事件
    document.addEventListener('mouseup', () => {
      this.handleSelection()
    })

    // 监听键盘事件（某些网站用键盘选择文本）
    document.addEventListener('keyup', (e) => {
      if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Meta') {
        this.handleSelection()
      }
    })
  }

  private handleSelection() {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) {
      return
    }

    const text = selection.toString().trim()
    if (!text || text === this.lastSelectedText) {
      return
    }

    this.lastSelectedText = text

    // 防抖，避免频繁触发
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }

    this.debounceTimer = setTimeout(() => {
      if (this.callback && text) {
        const range = selection.getRangeAt(0)
        this.callback(text, range)
      }
    }, 300)
  }

  /**
   * 注册选择回调
   */
  onTextSelected(callback: SelectionCallback): void {
    this.callback = callback
  }

  /**
   * 获取当前选中的文本
   */
  getSelectedText(): string {
    const selection = window.getSelection()
    return selection?.toString().trim() || ''
  }

  /**
   * 获取选中的范围
   */
  getSelectedRange(): Range | null {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) {
      return null
    }
    return selection.getRangeAt(0)
  }
}
