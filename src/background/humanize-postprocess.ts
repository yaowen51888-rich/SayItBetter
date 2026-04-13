/**
 * 人性化后处理器
 * 代码层面强制清理AI痕迹，不依赖AI完全遵守规则
 */

// AI 常用 emoji 黑名单（这些emoji最容易被识别为AI生成）
const AI_EMOJI_BLACKLIST = [
  '💡', '🚀', '✨', '🌟', '💪', '🎯', '⭐', '🔥',
  '📈', '🎨', '🔮', '💎', '🌈', '✅', '✔️', '🎉',
  '🏆', '👏', '🤝', '💼', '📊', '🎪', '⚡', '💫',
  '🌍', '🔑', '💰', '📱', '💻', '🎓', '🌺', '🎬'
]

/**
 * 移除所有 emoji
 */
export function removeAllEmojis(text: string): string {
  // Unicode emoji 范围
  return text.replace(/[\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}\u{1F9B0}-\u{1F9B3}]/gu, '')
}

/**
 * 移除 AI 常用 emoji（更精准）
 */
export function removeAiEmojis(text: string): string {
  let result = text
  AI_EMOJI_BLACKLIST.forEach(emoji => {
    result = result.split(emoji).join('')
  })
  return result
}

/**
 * 清理多余空行
 */
export function cleanupEmptyLines(text: string): string {
  return text.replace(/\n{3,}/g, '\n\n').trim()
}

/**
 * 清理重复标点
 */
export function cleanupRepeatedPunctuation(text: string): string {
  // 替换连续的感叹号或问号为单个
  return text
    .replace(/！{2,}/g, '！')
    .replace(/？{2,}/g, '？')
    .replace(/!{2,}/g, '!')
    .replace(/\?{2,}/g, '?')
}

/**
 * 规范引号（统一使用中文引号）
 */
export function normalizeQuotes(text: string): string {
  return text
    .replace(/(["'])(.+?)\1/g, '"$2"')  // 英文引号转中文
    .replace(/'/g, '"')                // 单引号转双引号
}

/**
 * 移除装饰性符号
 */
export function removeDecorativeSymbols(text: string): string {
  return text.replace(/[★●✓▪▫◾◽]/g, '')
}

/**
 * 清理中英混排标点
 */
export function normalizeMixedPunctuation(text: string): string {
  // 英文句子中的逗号句号
  return text
    .replace(/([a-zA-Z0-9]),/g, '$1，')
    .replace(/([a-zA-Z0-9])/g, '$1。')
}

/**
 * 智能清理（根据平台差异）
 */
export interface HumanizeOptions {
  platform?: string
  strictMode?: boolean  // 严格模式：完全移除emoji
}

export function smartPostProcess(text: string, options: HumanizeOptions = {}): string {
  const { platform = 'twitter', strictMode = false } = options

  let result = text

  // 基础清理（所有平台都执行）
  result = cleanupEmptyLines(result)
  result = cleanupRepeatedPunctuation(result)
  result = removeDecorativeSymbols(result)

  // 平台差异化处理
  if (platform === 'twitter' || platform === 'weibo' || platform === 'xiaohongshu') {
    // 社交平台：适度保留emoji，但移除AI黑名单
    result = removeAiEmojis(result)
  } else if (platform === 'linkedin' || platform === 'wechat' || platform === 'zhihu' || platform === 'toutiao') {
    // 专业平台：严格模式，移除所有emoji
    result = removeAllEmojis(result)
  } else if (platform === 'moments') {
    // 朋友圈：用户偏好决定
    if (strictMode) {
      result = removeAllEmojis(result)
    } else {
      result = removeAiEmojis(result)
    }
  }

  // 统一后处理
  result = normalizeQuotes(result)
  result = result.trim()

  return result
}

/**
 * 完整的人性化后处理流程
 */
export function fullHumanizePostProcess(text: string, platform: string = 'twitter'): string {
  return smartPostProcess(text, { platform })
}