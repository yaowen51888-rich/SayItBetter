import type { CacheInput } from '../../shared/types'
import { generateFullTextKey, generateSegmentKey } from './key-generator'

const FULL_TEXT_THRESHOLD = 500 // 字符数

export interface CacheStrategy {
  type: 'full' | 'segment'
  keys: string[]
}

/**
 * 选择缓存策略
 */
export async function selectCacheStrategy(input: CacheInput): Promise<CacheStrategy> {
  const textLength = input.input.length

  // 短文本使用完整缓存
  if (textLength < FULL_TEXT_THRESHOLD) {
    const key = await generateFullTextKey(input)
    return {
      type: 'full',
      keys: [key],
    }
  }

  // 长文本使用分段缓存
  const segments = splitIntoSegments(input.input)
  const keys = await Promise.all(
    segments.map((_segment, index) =>
      generateSegmentKey({
        input: input.input,
        style: input.style,
        platform: input.platform,
        humanize: input.humanize,
        position: index,
      })
    )
  )

  return {
    type: 'segment',
    keys,
  }
}

/**
 * 将文本分段
 */
function splitIntoSegments(text: string): string[] {
  const maxSegmentLength = FULL_TEXT_THRESHOLD
  const segments: string[] = []

  for (let i = 0; i < text.length; i += maxSegmentLength) {
    segments.push(text.slice(i, i + maxSegmentLength))
  }

  return segments
}
