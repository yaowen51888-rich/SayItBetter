/**
 * 推荐模型配置 (2026年最新)
 *
 * 每个提供商都有推荐的初始改写模型和人性化处理模型组合
 * default: 用于初始文案生成的性价比模型
 * humanize: 用于人性化处理的旗舰模型
 *
 * 注：智谱 GLM 模型名称来自官方文档
 * https://docs.bigmodel.cn/cn/guide/models/text/glm-5.1
 */
export const RECOMMENDED_MODELS: Record<string, {
  default: string
  humanize: string
}> = {
  openai: {
    default: 'gpt-5.4-mini',
    humanize: 'gpt-5.4'
  },
  claude: {
    default: 'claude-sonnet-4-6',
    humanize: 'claude-opus-4-6'
  },
  glm: {
    default: 'glm-4.7',
    humanize: 'glm-5.1'
  },
  qwen: {
    default: 'qwen3-plus',
    humanize: 'qwen3-max'
  },
  kimi: {
    default: 'kimi-k2-turbo-preview',
    humanize: 'kimi-k2.5'
  },
  doubao: {
    default: 'doubao-lite',
    humanize: 'doubao-pro'
  },
  wenxin: {
    default: 'ernie-4.0-8k',
    humanize: 'ernie-4.0-turbo'
  },
  deepseek: {
    default: 'deepseek-chat',
    humanize: 'deepseek-reasoner'
  }
}

/**
 * 获取提供商的推荐模型
 */
export function getRecommendedModels(provider: string): { default: string; humanize: string } | null {
  return RECOMMENDED_MODELS[provider] || null
}

/**
 * 检查是否为自定义提供商
 */
export function isCustomProvider(provider: string): boolean {
  return provider === 'custom'
}
