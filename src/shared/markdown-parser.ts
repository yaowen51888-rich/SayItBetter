/**
 * 轻量级 Markdown 解析器
 * 支持基础格式：粗体、斜体、代码、链接、换行、列表
 */

export function parseMarkdown(text: string): string {
  if (!text) return ''

  // 转义 HTML 特殊字符（先处理）
  let result = escapeHtml(text)

  // 代码块 ```code```
  result = result.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')

  // 行内代码 `code`
  result = result.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')

  // 粗体 **text**
  result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')

  // 斜体 *text*
  result = result.replace(/\*([^*]+)\*/g, '<em>$1</em>')

  // 链接 [text](url)
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')

  // 标题 # heading
  result = result.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  result = result.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  result = result.replace(/^# (.+)$/gm, '<h1>$1</h1>')

  // 无序列表 - item
  result = result.replace(/^- (.+)$/gm, '<li>$1</li>')
  result = result.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')

  // 换行（双换行变段落，单换行变<br>）
  result = result.replace(/\n\n/g, '</p><p>')
  result = result.replace(/\n/g, '<br>')

  // 包裹段落
  result = '<p>' + result + '</p>'

  // 清理空段落
  result = result.replace(/<p><\/p>/g, '')
  result = result.replace(/<p>\s*<\/p>/g, '')

  return result
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * 流式 Markdown 解析器（用于实时渲染）
 * 追加新内容时智能处理 Markdown 标签
 */
export class MarkdownStreamParser {
  private buffer: string = ''
  private lastResult: string = ''

  append(chunk: string): string {
    this.buffer += chunk

    // 解析当前缓冲区
    const parsed = parseMarkdown(this.buffer)
    this.lastResult = parsed

    return parsed
  }

  getResult(): string {
    return this.lastResult
  }

  reset(): void {
    this.buffer = ''
    this.lastResult = ''
  }
}