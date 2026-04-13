import type { RoutingDecision, ComplexityScore } from './types'
import { getProviderConfig, supportsRouting } from './provider-config'

export async function selectModel(input: {
  text: string
  style: string
  provider: string
  styleModelPreference?: Record<string, { primary?: string }>
}): Promise<RoutingDecision> {
  // 检查提供商是否支持路由
  if (!supportsRouting(input.provider)) {
    const config = getProviderConfig(input.provider)
    return {
      input: {
        text: input.text,
        style: input.style,
        provider: input.provider,
        complexity: { total: 0, factors: { length: 0, structure: 0, vocabulary: 0, domain: 0 }, recommendation: 'default' },
      },
      output: {
        provider: input.provider,
        model: config.modelAliases?.[config.models[0]] || config.models[0],
        confidence: 1.0,
        reason: [`${input.provider} 不支持多模型路由，使用默认模型`],
      },
    }
  }

  // 分析复杂度
  const complexity = await import('./analyzer').then(m => m.analyzeComplexity(input.text))

  // 决策逻辑
  const decision = makeRoutingDecision(complexity, input.styleModelPreference)

  return {
    input: {
      text: input.text,
      style: input.style,
      provider: input.provider,
      complexity,
    },
    output: decision,
  }
}

function makeRoutingDecision(
  complexity: ComplexityScore,
  stylePreference?: Record<string, { primary?: string }>
): RoutingDecision['output'] {
  let model = complexity.recommendation
  let confidence = 0.8
  const reasons: string[] = []

  // 风格偏好优先
  if (stylePreference?.claude?.primary) {
    model = stylePreference.claude.primary as 'haiku' | 'sonnet' | 'opus' | 'default'
    reasons.push(`风格模板推荐模型: ${model}`)
    confidence = 0.9
  } else {
    // 基于复杂度选择模型
    reasons.push(`文本复杂度: ${complexity.total}，推荐模型: ${model}`)
    confidence = 0.8
  }

  // 获取模型别名
  const config = getProviderConfig('claude') // 默认使用 Claude 配置
  const actualModel = config.modelAliases?.[model] || model

  return {
    provider: 'claude',
    model: actualModel,
    confidence,
    reason: reasons,
  }
}
