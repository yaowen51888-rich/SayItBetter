/**
 * HTML 消毒工具 — 过滤 AI 生成内容中的危险标签和属性
 */

const DANGEROUS_TAGS = /^(script|iframe|object|embed|form|input|textarea|select|button|meta|link|base|applet|body|html|head|frame|frameset)$/i
const DANGEROUS_ATTRS = /^on/i
const DANGEROUS_HREF = /^\s*(javascript|data|vbscript):/i

export function sanitizeHtml(html: string): string {
  return html
    .replace(/<\s*\/?\s*([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g, (match, tagName) => {
      if (DANGEROUS_TAGS.test(tagName)) return ''
      return match.replace(
        /\s([a-zA-Z][a-zA-Z0-9-]*)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/g,
        (_, attrName, attrVal) => {
          if (DANGEROUS_ATTRS.test(attrName)) return ''
          if ((attrName === 'href' || attrName === 'src') && DANGEROUS_HREF.test(attrVal)) return ''
          return _
        }
      )
    })
}
