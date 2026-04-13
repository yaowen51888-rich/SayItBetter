import type { HumanizeConfig } from '../../shared/types'

/**
 * 默认人性化处理配置
 * provider 和 model 均为空，等待用户选择已配置的提供商后再填充
 */
export const DEFAULT_HUMANIZE_CONFIG: HumanizeConfig = {
  enabled: false,
  humanizeModel: '',
  advancedOptions: {
    doublePass: false,
    temperature: 0.8,
    maxTokens: 4000,
    enableCache: true,
  },
}

/**
 * 平台特性指令映射
 */
export const PLATFORM_HUMANIZE_INSTRUCTIONS: Record<string, string> = {
  twitter: `Twitter特性：
- 保持简洁有力
- 可适度使用口语化表达
- 避免过于正式的表达
- 可以用简短句子`,

  linkedin: `LinkedIn特性：
- 保持专业语气
- 用行业术语
- 结构清晰
- 避免过于随意`,

  xiaohongshu: `小红书特性：
- 保持生动活泼
- 可以用感叹号增强语气
- 细节描写要具体
- 避免过于正式`,

  moments: `朋友圈特性：
- 引发共鸣
- 用情感化语言
- 鼓励互动评论
- 控制在200字内`,

  weibo: `微博特性：
- 简洁有力
- 添加话题标签
- 结合热门话题
- 口语化表达`,

  zhihu: `知乎特性：
- 逻辑清晰
- 用具体例子支撑观点
- 有深度分析
- 提供独特见解`,

  toutiao: `今日头条特性：
- 标题吸引人
- 提供有价值信息
- 用关键词优化
- 避免空洞内容`,

  wechat: `微信公众号特性：
- 排版精美
- 内容丰富
- 段落清晰
- 视觉优化`
}