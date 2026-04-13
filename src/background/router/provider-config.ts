export interface ProviderRoutingConfig {
  models: string[]
  routingStrategy: 'complexity-based' | 'single-model'
  modelAliases?: Record<string, string>
}

export const PROVIDER_CONFIG: Record<string, ProviderRoutingConfig> = {
  claude: {
    models: ['haiku', 'sonnet', 'opus'],
    routingStrategy: 'complexity-based',
    modelAliases: {
      haiku: 'claude-3-5-haiku-20241022',
      sonnet: 'claude-3-5-sonnet-20241022',
      opus: 'claude-3-5-opus-20241022',
    },
  },
  openai: {
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'],
    routingStrategy: 'complexity-based',
    modelAliases: {
      'gpt-4o-mini': 'gpt-4o-mini',
      'gpt-4o': 'gpt-4o',
      'gpt-4-turbo': 'gpt-4-turbo',
    },
  },
  qwen: { models: ['qwen-max'], routingStrategy: 'single-model' },
  glm: { models: ['glm-4'], routingStrategy: 'single-model' },
  wenxin: { models: ['ernie-4.0'], routingStrategy: 'single-model' },
  kimi: { models: ['moonshot-v1-128k'], routingStrategy: 'single-model' },
  deepseek: { models: ['deepseek-chat'], routingStrategy: 'single-model' },
  doubao: { models: ['doubao-pro-256k'], routingStrategy: 'single-model' },
  custom: { models: ['custom'], routingStrategy: 'single-model' },
}

export function getProviderConfig(provider: string): ProviderRoutingConfig {
  return PROVIDER_CONFIG[provider] || PROVIDER_CONFIG.custom
}

export function supportsRouting(provider: string): boolean {
  return getProviderConfig(provider).routingStrategy === 'complexity-based'
}
