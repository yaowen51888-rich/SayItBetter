/**
 * 增强的文本选择器 - 支持 Shadow DOM 和复杂场景
 */

type SelectionCallback = (text: string) => void

export class EnhancedTextSelector {
  private callback: SelectionCallback | null = null

  constructor() {
    this.init()
  }

  private init() {
    // 标准选择监听
    document.addEventListener('mouseup', () => this.handleSelection())
    document.addEventListener('keyup', (e) => {
      if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Meta') {
        this.handleSelection()
      }
    })

    // 监听 DOM 变化，处理动态内容
    this.observeDOMChanges()
  }

  /**
   * 获取选中的文本（增强版）
   */
  getSelectedText(): string {
    // Layer 1: 标准 Selection API
    const standardText = this.getStandardSelection()
    if (standardText) {
      return standardText
    }

    // Layer 2: Shadow DOM 遍历
    const shadowText = this.getShadowDOMSelection()
    if (shadowText) {
      return shadowText
    }

    return ''
  }

  /**
   * 标准选择 API
   */
  private getStandardSelection(): string {
    const selection = window.getSelection()
    return selection?.toString().trim() || ''
  }

  /**
   * Shadow DOM 选择检测
   */
  private getShadowDOMSelection(): string {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) {
      return ''
    }

    const range = selection.getRangeAt(0)
    if (!range) {
      return ''
    }

    // 检查选择是否在 Shadow DOM 中
    const shadowRoot = this.findShadowRoot(range.startContainer)
    if (shadowRoot) {
      // 尝试从 Shadow DOM 获取内部选择
      const shadowSelection = this.getShadowSelection(shadowRoot)
      return shadowSelection || selection.toString().trim()
    }

    return selection.toString().trim()
  }

  /**
   * 查找包含节点的 Shadow Root
   */
  private findShadowRoot(node: Node): ShadowRoot | null {
    let current: Node | null = node

    while (current && current !== document.body) {
      if (current instanceof ShadowRoot) {
        return current
      }
      current = current.parentNode
    }

    return null
  }

  /**
   * 从 Shadow Root 获取选择
   */
  private getShadowSelection(shadowRoot: ShadowRoot): string {
    try {
      const selection = (shadowRoot as any).getSelection()
      if (selection) {
        return selection.toString().trim()
      }
    } catch (e) {
      // Shadow Root 可能不支持 getSelection
    }

    // 备用方案：遍历 Shadow DOM 中的可编辑元素
    const editableElements = shadowRoot.querySelectorAll(
      '[contenteditable="true"], textarea, input:not([type])'
    )

    for (const element of editableElements) {
      const selection = this.getElementSelection(element as HTMLElement)
      if (selection) {
        return selection
      }
    }

    return ''
  }

  /**
   * 获取元素的选中内容（针对 contenteditable）
   */
  private getElementSelection(element: HTMLElement): string {
    try {
      const start = (element as any).selectionStart
      const end = (element as any).selectionEnd

      if (typeof start === 'number' && typeof end === 'number' && start !== end) {
        return (element as any).value.substring(start, end).trim()
      }
    } catch (e) {
      // 元素可能不支持 selectionStart/selectionEnd
    }

    return ''
  }

  /**
   * 监听 DOM 变化
   */
  private observeDOMChanges() {
    // 监听 DOM 变化，处理动态加载的内容
    const observer = new MutationObserver(() => {
      // DOM 变化后重新检查选择
      this.handleSelection()
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
  }

  /**
   * 处理文本选择事件
   */
  private handleSelection() {
    const text = this.getSelectedText()
    if (text && this.callback) {
      this.callback(text)
    }
  }

  /**
   * 注册选择回调
   */
  onTextSelected(callback: SelectionCallback): void {
    this.callback = callback
  }
}
