import type { AIProvider } from '../../shared/types.js'

/**
 * 各AI提供商的模型映射配置
 * defaultModel: 初始改写使用的模型（性价比高）
 * humanizeModel: 人性化处理使用的模型（最强效果）
 */
export const HUMANIZE_MODEL_CONFIG: Record<AIProvider, {
  defaultModel: string
  humanizeModel: string
  description: string
}> = {
  openai: {
    defaultModel: 'gpt-5.4-mini',
    humanizeModel: 'gpt-5.4',
    description: 'GPT-5.4：OpenAI最新旗舰模型'
  },
  claude: {
    defaultModel: 'claude-sonnet-4-6',
    humanizeModel: 'claude-opus-4-6',
    description: 'Claude Opus 4.6：Anthropic最强模型'
  },
  glm: {
    defaultModel: 'glm-4.7',
    humanizeModel: 'glm-5.1',
    description: 'GLM-5.1：智谱AI最新旗舰模型'
  },
  deepseek: {
    defaultModel: 'deepseek-chat',
    humanizeModel: 'deepseek-reasoner',
    description: 'DeepSeek Reasoner：强化推理能力'
  },
  qwen: {
    defaultModel: 'qwen3.6-plus',
    humanizeModel: 'qwen3-max',
    description: 'Qwen3 Max：通义千问旗舰模型'
  },
  kimi: {
    defaultModel: 'kimi-k2-turbo-preview',
    humanizeModel: 'kimi-k2.5',
    description: 'Kimi K2.5：月之暗面最新模型'
  },
  doubao: {
    defaultModel: 'doubao-seed-2-0-lite-260215',
    humanizeModel: 'doubao-seed-2-0-pro-260215',
    description: 'Doubao Seed 2.0 Pro：豆包最新推理模型'
  },
  wenxin: {
    defaultModel: 'ernie-4.5-turbo-vl',
    humanizeModel: 'ernie-5.0',
    description: 'ERNIE 5.0：百度最新旗舰模型'
  },
  custom: {
    defaultModel: 'custom-model',
    humanizeModel: 'custom-model',
    description: '自定义模型'
  }
}

/**
 * 获取提供商的人性化模型
 */
export function getHumanizeModel(provider: AIProvider): string {
  return HUMANIZE_MODEL_CONFIG[provider]?.humanizeModel || 'gpt-4o'
}

/**
 * 获取提供商的默认模型
 */
export function getDefaultModel(provider: AIProvider): string {
  return HUMANIZE_MODEL_CONFIG[provider]?.defaultModel || 'gpt-4o-mini'
}

/**
 * 获取模型配置
 */
export function getModelConfig(provider: AIProvider) {
  return HUMANIZE_MODEL_CONFIG[provider]
}

/**
 * 获取推荐的 ApiProfile 默认模型
 */
export function getRecommendedProfileModel(provider: AIProvider): string {
  return HUMANIZE_MODEL_CONFIG[provider]?.defaultModel || 'gpt-4o-mini'
}