import type { CacheInput } from '../../shared/types'

/**
 * 生成缓存键
 *
 * 基于输入内容、风格、平台、人性化选项生成唯一的缓存键。
 */

/**
 * 生成完整文本缓存键
 */
export async function generateFullTextKey(input: CacheInput): Promise<string> {
  const data = `${input.input}|${input.style}|${input.platform}|${input.humanize}`
  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(data)
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * 生成分段缓存键
 */
export async function generateSegmentKey(input: CacheInput & {
  position: number
}): Promise<string> {
  const data = `${input.input}|${input.style}|${input.platform}|${input.humanize}|segment:${input.position}`
  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(data)
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}
