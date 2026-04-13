import type { ComplexityScore } from '../../shared/types'

/**
 * 分析文本复杂度
 *
 * 基于多个因子计算复杂度分数：
 * - 长度：文本长度
 * - 结构：句子结构复杂度
 * - 词汇：词汇丰富度和专业度
 * - 领域：领域专业度
 */
export async function analyzeComplexity(text: string): Promise<ComplexityScore> {
  const factors = {
    length: analyzeLength(text),
    structure: analyzeStructure(text),
    vocabulary: analyzeVocabulary(text),
    domain: analyzeDomain(text),
  }

  const total = (factors.length * 0.3 +
                factors.structure * 0.3 +
                factors.vocabulary * 0.2 +
                factors.domain * 0.2)

  let recommendation: ComplexityScore['recommendation'] = 'default'
  if (total < 30) recommendation = 'haiku'
  else if (total < 60) recommendation = 'sonnet'
  else if (total >= 80) recommendation = 'opus'

  return {
    total: Math.min(100, Math.round(total)),
    factors,
    recommendation,
  }
}

/**
 * 分析文本长度复杂度
 */
function analyzeLength(text: string): number {
  const length = text.length
  // 0-100 字: 0-20 分
  // 100-500 字: 20-50 分
  // 500+ 字: 50-100 分
  if (length < 100) return length / 5
  if (length < 500) return 20 + (length - 100) * 30 / 400
  return Math.min(100, 50 + (length - 500) * 50 / 500)
}

/**
 * 分析文本结构复杂度
 */
function analyzeStructure(text: string): number {
  const sentences = text.split(/[.!?。！？]+/).filter(s => s.trim().length > 0)
  const avgSentenceLength = text.length / Math.max(1, sentences.length)

  // 句子越长，结构越复杂
  const structureScore = Math.min(100, avgSentenceLength * 2)

  return structureScore
}

/**
 * 分析词汇复杂度
 */
function analyzeVocabulary(text: string): number {
  const words = text.split(/\s+/)
  const uniqueWords = new Set(words.map(w => w.toLowerCase()))

  // 词汇丰富度
  const vocabularyRichness = (uniqueWords.size / Math.max(1, words.length)) * 100

  // 检测专业词汇（简单示例）
  const technicalTerms = ['API', 'algorithm', 'database', 'framework', 'architecture',
                          '代码', '算法', '数据库', '架构', '系统']
  const technicalCount = words.filter(w => technicalTerms.some(term =>
    w.toLowerCase().includes(term.toLowerCase())
  )).length

  const technicalScore = Math.min(100, technicalCount * 20)

  return (vocabularyRichness + technicalScore) / 2
}

/**
 * 分析领域专业度
 */
function analyzeDomain(text: string): number {
  // 简单的领域专业度检测
  const domainIndicators = {
    technical: ['code', 'data', 'system', 'function', 'variable', 'algorithm',
                '代码', '数据', '系统', '函数', '变量', '算法'],
    business: ['revenue', 'profit', 'customer', 'market', 'strategy', 'growth',
               '收入', '利润', '客户', '市场', '策略', '增长'],
    academic: ['research', 'theory', 'analysis', 'methodology', 'hypothesis',
               '研究', '理论', '分析', '方法', '假设'],
  }

  let maxScore = 0
  for (const [, indicators] of Object.entries(domainIndicators)) {
    const score = indicators.reduce((sum, indicator) =>
      sum + (text.toLowerCase().includes(indicator) ? 1 : 0), 0)
    maxScore = Math.max(maxScore, score * 10)
  }

  return Math.min(100, maxScore)
}
