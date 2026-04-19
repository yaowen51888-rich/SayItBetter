import { PLATFORMS, AI_PROVIDERS, type PlatformKey } from '../shared/constants'
import type { AIOptions } from '../shared/types'
import { StreamState } from '../shared/types'
import { ensureHostPermission } from '../shared/host-permissions'
import { fullHumanizePostProcess } from './humanize-postprocess'
import { parseApiError } from '../shared/api-validator'
import { getHumanizeConfig } from './config/humanize-config'
import { getHumanizeCache, setHumanizeCache } from './cache/humanize-cache'

interface GenerateResult {
  content: string
  tokensUsed: number
  isStreamComplete?: boolean  // 标记是否为流式输出完成
}

interface GenerateOptions {
  stylePrompt?: string
  platform?: PlatformKey
}

/**
 * 扩展的流式回调接口 - 支持状态传递
 */
interface StreamChunkCallback {
  (chunk: string, state?: StreamState): void;
}

/**
 * 扩展的生成选项
 */

const SECOND = 1000

// 人性化处理 Prompt（基于 Humanizer-zh 完整规则 - 强化版）
const HUMANIZER_PROMPT = `你是一位专业的文字编辑，专门去除 AI 生成文本的痕迹。请重写以下内容，使其听起来更自然、更像真人写的。

## ⚠️ 核心原则：去AI化

### AI 文本的致命特征（必须避免）
❌ 段落长度相似（都是2-3句话）
❌ 句式重复（都是"主语+谓语+宾语"）
❌ 过度使用连接词（此外、另外、同时、而且）
❌ 三段式列举（第一、第二、第三；首先、其次、最后）
❌ 二元对比（不仅X而且Y；既X又Y）
❌ 虚假范围（整个行业、所有领域、全球范围）
❌ 模板式结尾（综上所述、未来展望、值得期待）
❌ 夸大意义（标志着、彰显了、具有里程碑意义）
❌ AI 高频词（深入探讨、突出、强调、至关重要、获得、增强、培养、复杂、格局、关键性、展示、织锦、宝贵的）
❌ 谄媚语气（我很乐意为您解答、荣幸之至）
❌ 免责声明（仅供参考、个人观点）
❌ 过度限定（在一定程度上、可以说、某种程度上）

### 真人文本的特征（必须做到）
✅ **段落节奏变化** - 有时有1句，有时有4-5句，不要总是2-3句
✅ **句子长短不一** - 短句（3-5字）、中句（10-20字）、长句（30+字）混合
✅ **省略可理解的** - 不解释大家都知道的事情
✅ **有个人色彩** - 用"我觉得"、"从我经验来看"等
✅ **有具体场景** - 提到时间、地点、具体事件
✅ **直接表达** - 不绕弯子，直说重点
✅ **有时不完整** - 可以话说一半，留有余地
✅ **偶尔口语化** - 用"吧"、"嘛"、"呢"等语气词
✅ **可以情绪化** - 表达惊讶、赞同、反对

### 具体操作规则

#### 1. 删除填充连接词
- ❌ 不要：此外、然而、另外、同时、而且、况且
- ✅ 改为：直接开始下一句话

#### 2. 打破公式结构
- ❌ 不要：第一、第二、第三；首先、其次、最后
- ❌ 不要：不仅X而且Y；既X又Y
- ✅ 改为：直接说，用逗号或句号分隔

#### 3. 变化句子节奏
- ❌ 避免：所有���子都是10-15个字
- ✅ 必须：混用短句（3-5字）、中句（10-20字）、长句（30+字）
- ✅ 建议：每段至少有1个20字以上的长句

#### 4. 删除"正在"开头的分析
- ❌ 不要："正在改变"、"正在演变"、"正在成为"
- ✅ 改为：直接说结果或具体变化

#### 5. 删除模板式结尾
- ❌ 不要：综上所述、总而言之、未来展望、值得期待
- ✅ 改为：直接结束，或者加一个简单的观点

#### 6. 避免夸大意义
- ❌ 不要：标志着、彰显了、具有里程碑意义
- ✅ 改为：具体说明是什么、为什么重要

#### 7. 删除AI高频词
- ❌ 不要：深入探讨、突出、强调、至关重要、获得、增强、培养、复杂、格局、关键性、展示、织锦、宝贵的
- ✅ 改为：具体说明、明显体现、非常重要、得到、提升、练习、复杂、形势、很重要、表现

#### 8. 不要回避"是"
- ❌ 不要：不仅X而且Y；既X又Y
- ✅ 直接说：X是Y

#### 9. 避免虚假范围
- ❌ 不要：整个行业、所有领域、全球范围
- ✅ 改为：这个行业、很多领域、很多人

#### 10. 信任读者
- ❌ 不要：过度解释、软化、辩解
- ✅ 改为：直接说事实，相信读者能理解

#### 11. 删除金句
- ❌ 不要：可引用的总结性语句、励志格言式结尾
- ✅ 改为：直接表达观点，不要为了总结而总结

#### 12. 删除宣传性语言
- ❌ 不要：充满活力的、令人叹为观止的、无缝的、直观的
- ✅ 改为：有活力的、很好的、流畅的、简单的

#### 13. 避免破折号过度使用
- ❌ 不要：每段都用破折号，或一句话中用多次
- ✅ 建议：每段最多1次，整篇文章不超过2-3次

#### 14. 完全移除emoji
- ❌ 不要：💡🚀✨🌟💪🎯🌈🔥⭐
- ✅ 必须：全部删除，让文字本身说话

#### 15. 避免清单式结构
- ❌ 不要：短促的短语堆砌（一句一行）
- ✅ 改为：正常的段落表达

#### 16. 使用具体细节
- ❌ 不要：模糊的主张（"很有用"、"很重要"）
- ✅ 改为：具体数据、案例、场景（"用了5分钟"、"节省了30%"）

#### 17. 避免内联标题列表
- ❌ 不要：加粗短语模拟列表
- ✅ 改为：正常段落，用逗号分隔

#### 18. 删除模糊归因
- ❌ 不要：专家认为、观察者指出、业内人士表示
- ✅ 改为：具体来源（"张三在《报告》中说"）或直接陈述

#### 19. 删除谄媚语气
- ❌ 不要：我很乐意为您解答、荣幸之至、希望能帮助到您
- ✅ 改为：直接回答问题

#### 20. 删除填充短语
- ❌ 不要：一般来说、某种程度上、基本上、事实上
- ✅ 改为：直接说

#### 21. 删除过度限定
- ❌ 不要：在一定程度上、可以说、某种程度上
- ✅ 改为：直接判断

#### 22. 删除免责声明
- ❌ 不要：仅供参考、个人观点
- ✅ 改为：直接表达观点

#### 23. 使用第一人称
- ✅ 建议：用"我"表达观点，更真实
- ✅ 例如："我觉得..."、"从我经验来看..."

#### 24. 允许复杂性
- ✅ 可以：真实的人有矛盾感受
- ✅ 不要：过度简化，让一切看起来太完美

## 🎯 深度去AI化技巧

### 技巧1：制造"不完美"
- 故意让段落长度不一致
- 偶尔用短句（3-5个字）
- 偶尔用口语化表达
- 故意说一些不够"专业"的话

### 技巧2：添加"人味"
- 提到具体的时间、地点、人物
- 用"我觉得"、"我发现"
- 表达具体的感受
- 分享具体的经历

### 技巧3：避免"平衡"
- 不要每段都差不多
- 不要总是正反面都说
- 不要总是"虽然...但是..."
- 要么直接说，要么不说

### 技巧4：去掉"解释性"
- 不解释大家都知道的概念
- 不解释显而易见的原因
- 不解释本应理解的过程

### 技巧5：增加"主观性"
- 表达明确的观点
- 用明确的判断
- 可以有偏见，不要假装客观

## 改写示例

**改写前（典型的AI风格）：**
> 这款新应用作为公司致力于创新的证明。此外，它提供了无缝、直观和充满活力的用户体验。这不仅仅是一次更新，而是我们思考生产力方式的革命。行业专家认为这将对整个社会产生持久影响。首先，它简化了工作流程；其次，它提高了协作效率；最后，它增强了创造力。

**问题分析：**
- 段落结构：四句话，长度相似（太规整）
- 连接词："此外"、"这不仅仅是...而是"
- 夸大意义："致力于创新的证明"、"革命的"
- 模板结构："首先、其次、最后"
- 模糊归因："行业专家认为"
- AI高频词："无缝、直观、充满活力的"

**改写后（真人风格）：**
> 新应用加了批处理、键盘快捷键和离线模式。测试用户反馈不错，多数人说任务完成更快了。张三说他的团队现在每周能节省5小时。我觉得这工具确实有用，但价格是个问题。现在免费试用一个月，之后要按用户数收费。

**改写要点：**
- ❌ 删除了"此外"、"这不仅仅是...而是"
- ❌ 删除了"首先、其次、最后"
- ❌ 删除了"无缝、直观、充满活力的"
- ✅ 段落长度：2句→4句，节奏变化
- ✅ 加入具体场景："张三"、"每周节省5小时"
- ✅ 加入个人观点："我觉得这工具确实有用"
- ✅ 加入真实感受："价格是个问题"
- ✅ 口语化表达："这工具确实有用"

原文：{content}

重写后的文本：`

export class AIService {
  /**
   * 检测响应格式类型
   */
  private static detectResponseFormat(data: any): 'openai' | 'responses_qwen' | 'responses_baidu' {
    if (data.type && data.type.startsWith('response.')) {
      // Responses API 格式
      if (data.type.includes('reasoning_summary')) {
        return 'responses_qwen';
      } else if (data.type.includes('reasoning_text')) {
        return 'responses_baidu';
      }
      return 'responses_qwen'; // 默认 Qwen 格式
    }
    return 'openai';
  }

  /**
   * 检测推理内容（统一接口）
   */
  private static detectReasoningContent(data: any, format: string): {
    hasReasoning: boolean;
    reasoningText?: string;
    actualContent?: string;
  } {
    if (format === 'openai') {
      // OpenAI 兼容格式（GLM、DeepSeek、Kimi）
      // GLM: reasoning_content 在 choices[0].delta.reasoning_content
      // DeepSeek: reasoning_content 在 choices[0].delta.reasoning_content
      // 其他模型: 可能有不同的位置
      const reasoningContent = data.choices?.[0]?.delta?.reasoning_content ||
                              data.reasoning_content ||
                              data.reasoning;
      const actualContent = data.choices?.[0]?.delta?.content || data.content;

      return {
        hasReasoning: !!reasoningContent,
        reasoningText: reasoningContent,
        actualContent: actualContent
      };
    } else {
      // Responses API 格式（Qwen、百度千帆）
      const isQwenReasoning = data.type === 'response.reasoning_summary_text.delta';
      const isBaiduReasoning = data.type === 'response.reasoning_text.delta';
      const isReasoningItem = data.item?.type === 'reasoning';

      return {
        hasReasoning: isQwenReasoning || isBaiduReasoning || isReasoningItem,
        reasoningText: data.delta || data.text,
        actualContent: undefined
      };
    }
  }

  /**
   * 生成 AI 内容
   */
  static async generateContent(
    provider: string,
    apiKey: string,
    content: string,
    options: GenerateOptions = {},
    aiOptions: AIOptions = {}
  ): Promise<GenerateResult> {
    // 确保有对应提供商的主机权限（optional_host_permissions 按需授权）
    const hasPermission = await ensureHostPermission(provider)
    if (!hasPermission) {
      throw new Error(`需要授权访问 ${provider} 的 API 服务，请在弹出的权限请求中点击"允许"`)
    }

    // 增加超时时间，考虑人性化处理的时间（主生成30秒 + 人性化20秒 = 50秒）
    const timeout = aiOptions.timeout || 50000
    const maxRetries = aiOptions.maxRetries || 2

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const platform = options.platform || 'twitter'
      const style = options.stylePrompt || '专业正式，商务语气'
      // 传递 enableHumanize 参数到 buildPrompt
      const enableHumanize = aiOptions.enableHumanize !== false
      const prompt = this.buildPrompt(content, platform, style, enableHumanize)

      let result: GenerateResult | undefined
      let attempts = 0

      // 重试逻辑
      while (attempts <= maxRetries) {
        try {
          const providerConfig = AI_PROVIDERS[provider as keyof typeof AI_PROVIDERS]

          if (!providerConfig) {
            throw new Error(`不支持的提供商: ${provider}`)
          }

          // 根据提供商调用不同的 API
          switch (provider) {
            case 'openai':
              result = await this.callOpenAI(apiKey, prompt, controller.signal, aiOptions.model)
              break
            case 'claude':
              result = await this.callClaude(apiKey, prompt, controller.signal, aiOptions.model)
              break
            case 'qwen':
            case 'glm':
            case 'kimi':
            case 'deepseek':
            case 'doubao':
            case 'custom': {
              // 这些模型都兼容 OpenAI 格式
              // 对于自定义提供商，优先使用用户配置的 customApiUrl
              const apiUrl = provider === 'custom' && aiOptions.customApiUrl
                ? aiOptions.customApiUrl
                : providerConfig.apiUrl

              const model = aiOptions.model || providerConfig.model
              result = await this.callOpenAICompatible(
                apiUrl,
                model,
                apiKey,
                prompt,
                controller.signal,
                aiOptions.onChunk
              )
              break
            }
            case 'wenxin':
              result = await this.callWenxin(apiKey, prompt, controller.signal, aiOptions.model)
              break
            default:
              throw new Error(`不支持的提供商: ${provider}`)
          }
          break
        } catch (error) {
          // AbortError 不应该重试
          if (error instanceof Error && error.name === 'AbortError') {
            throw error
          }
          attempts++
          if (attempts > maxRetries) throw error
          // 指数退避
          await new Promise(r => setTimeout(r, Math.pow(2, attempts) * SECOND))
        }
      }

      clearTimeout(timeoutId)

      if (!result) {
        throw new Error('API 返回内容为空')
      }

      // 人性化后处理（默认启用）
      if (aiOptions.enableHumanize !== false) {
        result = await this.humanize(
          result.content,
          provider,
          apiKey,
          result.tokensUsed,
          platform,
          aiOptions.model,
          aiOptions.customApiUrl,
          aiOptions.onChunk  // 传递流式回调
        )
      }

      return result

    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('请求超时，请检查网络连接后重试')
      }
      throw error
    }
  }

  /**
   * 构建 Prompt（支持平台特定高级优化 + 去AI味道）
   */
  static buildPrompt(content: string, platform: PlatformKey, stylePrompt: string, enableHumanize: boolean = true): string {
    const platformInfo = PLATFORMS[platform]
    const baseTemplate = platformInfo.promptTemplate
    const features = platformInfo.features as Record<string, boolean> | undefined

    // 收集优化提示
    const tips: string[] = []

    // 根据平台特性收集优化提示（去AI化措辞）
    if (features) {
      // Twitter/X 特定优化
      if (features.autoSplit && content.length > 280) {
        tips.push('内容超过280字符，分割为多推文串，每条推文以 1/n、2/n 等标号。')
      }
      if (features.hashtagSuggestion) {
        tips.push('添加2-5个相关热门话题标签（#格式）。')
      }
      if (features.toneOptimization) {
        tips.push('口语化表达，用简写和缩写，增强互动感。')
      }

      // 小红书特定优化
      if (features.attractiveTitle) {
        tips.push('创建吸引人标题，用emoji、感叹号、问号，激发好奇心。')
      }
      if (features.structureOptimization && platform === 'xiaohongshu') {
        tips.push('分段结构，每段2-3句话，添加emoji点缀。')
      }

      // LinkedIn 特定优化
      if (features.professionalTone) {
        tips.push('专业语气，用行业术语，避免随意表达。')
      }
      if (features.callToAction) {
        tips.push('结尾加行动呼吁（如"欢迎交流讨论"、"期待您的观点"）。')
      }

      // 朋友圈特定优化
      if (features.engagementOptimization) {
        tips.push('引发共鸣，用情感化语言，鼓励互动评论。')
      }
      if (features.lengthOptimization) {
        tips.push('控制在200字内，简洁有力，快速阅读。')
      }

      // 知乎特定优化
      if (features.logicalStructure) {
        tips.push('逻辑清晰，用具体例子支撑观点。')
      }
      if (features.depthOptimization) {
        tips.push('有深度分析，提供独特见解，避免泛泛而谈。')
      }

      // 今日头条特定优化
      if (features.valueContent) {
        tips.push('提供有价值信息，避免空洞内容。')
      }
      if (features.seoOptimization) {
        tips.push('用关键词优化，便于搜索发现。')
      }

      // 微信公众号特定优化
      if (features.richFormatting) {
        tips.push('丰富排版，包括标题、分段、重点标注。')
      }
      if (features.visualOptimization) {
        tips.push('考虑视觉呈现，适当用emoji、符号增强可读性。')
      }

      // 微博特定优化
      if (features.trendingTopics) {
        tips.push('结合当前热门话题，用热搜话题标签。')
      }
    }

    // 去除AI味道的核心要求（如果启用人性化处理）
    const humanizeInstructions = enableHumanize ? `
## ⚠️ 必须去除AI写作痕迹

绝对禁止：
- 段落长度相似（都2-3句话）→ 必须段落长度不一致
- 过度使用"此外、另外、同时、而且"→ 直接开始下一句话
- 三段式列举（第一、第二、第三）→ 不要用这种结构
- 模板式结尾（综上所述、未来展望）→ 直接结束
- 夸大意义（标志着、彰显了）→ 具体说明是什么
- AI高频词（深入探讨、突出、强调、至关重要）→ 用具体表达

必须做到：
- 段落长度变化（有时1句，有时4-5句）
- 句子长短不一（短句3-5字、中句10-20字、长句30+字混用）
- 直接表达，不绕弯子
- 用具体细节、数据、案例
- 可以用"我觉得"、"我发现"等个人表达
- 省略可理解的，���过度解释
- 偶尔口语化，让文字更自然

深度技巧：
- 制造"不完美"：故意让段落长度不一致
- 添加"人味"：提到具体时间、地点、人物
- 避免"平衡"：不要总是正反面都说
- 去掉"解释性"：不解释显而易见的事
` : ''

    let result = baseTemplate

    // 在"改写"之前插入去AI提示
    if (tips.length > 0 || enableHumanize) {
      const parts = result.split('改写')
      if (parts.length >= 2) {
        let insertText = ''

        if (enableHumanize) {
          insertText += humanizeInstructions
        }

        if (tips.length > 0) {
          const tipsText = '\n提示：' + tips.join('\n提示：') + '\n\n'
          insertText = tipsText + insertText
        }

        result = parts[0] + insertText + '改写' + parts.slice(1).join('改写')
      }
    }

    return result
      .replace('{style}', stylePrompt)
      .replace('{content}', content)
  }

  /**
   * 调用 OpenAI API
   */
  private static async callOpenAI(
    apiKey: string,
    prompt: string,
    signal: AbortSignal,
    model: string = 'gpt-4o-mini'
  ): Promise<GenerateResult> {
    // 检查 API Key 配置
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('OpenAI API Key 未配置，请在设置中填写正确的 API Key')
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: '你是一个专业的社交媒体文案写作助手。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
      signal,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorInfo = parseApiError(errorData, response.status, 'openai')
      throw new Error(`${errorInfo.message}${errorInfo.solution ? '。' + errorInfo.solution : ''}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    if (!content) {
      throw new Error('API 返回内容为空')
    }
    const tokensUsed = data.usage?.total_tokens || 0

    return { content, tokensUsed }
  }

  /**
   * 调用 Claude API
   */
  private static async callClaude(
    apiKey: string,
    prompt: string,
    signal: AbortSignal,
    model: string = 'claude-3-haiku-20240307'
  ): Promise<GenerateResult> {
    // 检查 API Key 配置
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('API Key 未配置，请在设置中填写正确的 Claude API Key')
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: '你是一个专业的社交媒体文案写作助手。\n\n' + prompt,
          },
        ],
      }),
      signal,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorInfo = parseApiError(errorData, response.status, 'claude')
      throw new Error(`${errorInfo.message}${errorInfo.solution ? '。' + errorInfo.solution : ''}`)
    }

    const data = await response.json()
    const content = data.content?.[0]?.text || ''
    if (!content) {
      throw new Error('API 返回内容为空')
    }
    // Claude 不返回 tokens，估算
    const tokensUsed = Math.ceil((prompt.length + content.length) / 2)

    return { content, tokensUsed }
  }

  /**
   * 调用 OpenAI 兼容 API (支持大部分国产大模型)
   */
  private static async callOpenAICompatible(
    apiUrl: string,
    model: string,
    apiKey: string,
    prompt: string,
    signal: AbortSignal,
    onChunk?: StreamChunkCallback
  ): Promise<GenerateResult> {
    // 检查 API URL 配置
    if (!apiUrl || apiUrl.trim() === '') {
      throw new Error('自定义 API 端点未配置，请在设置中填写正确的 API 地址')
    }

    // 检查 API Key 配置
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('API Key 未配置，请在设置中填写正确的 API Key')
    }

    // 重新启用流式输出（带兼容性处理）
    const enableStream = !!onChunk

    const requestBody = {
      model,
      messages: [
        {
          role: 'system',
          content: '你是一个专业的社交媒体文案写作助手。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
      stream: enableStream,
      // GLM 特殊处理：禁用 thinking 模式
      // 原因：GLM 在 thinking 模式下的流式响应只返回 reasoning_content，不返回 content
      // 这导致无法获得实际答案，因此禁用 thinking 模式以确保正常流式输出
      ...(model.toLowerCase().includes('glm') ? { thinking: { type: 'disabled' } } : {})
    }

    console.log(`[API] 请求 ${apiUrl}`, {
      model,
      stream: enableStream,
      hasOnChunk: !!onChunk,
      provider: apiUrl.includes('bigmodel') ? 'GLM' :
               apiUrl.includes('deepseek') ? 'DeepSeek' :
               apiUrl.includes('dashscope') ? 'Qwen' :
               apiUrl.includes('moonshot') ? 'Kimi' : 'Other'
    })

    const startTime = Date.now()

    try {
      console.log(`[API] 开始请求...`)
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal,
      })

      console.log(`[API] 响应状态: ${response.status}, Content-Type: ${response.headers.get('content-type')}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error(`[API] 错误响应:`, errorData)
        const errorInfo = parseApiError(errorData, response.status)
        throw new Error(`${errorInfo.message}${errorInfo.solution ? '。' + errorInfo.solution : ''}`)
      }

      // 流式处理
      if (enableStream) {
        console.log(`[API] 开始流式处理...`)
        let fullContent = ''
        const reader = response.body?.getReader()

        if (!reader) {
          console.warn(`[API] 无法获取响应流，降级到非流式`)
          // 降级到非流式
          const data = await response.json()
          const content = data.choices?.[0]?.message?.content || ''
          if (!content) {
            throw new Error('API 返回内容为空')
          }
          const tokensUsed = data.usage?.total_tokens || 0
          const elapsed = Date.now() - startTime
          console.log(`[API] 降级非流式成功，耗时: ${elapsed}ms, tokens: ${tokensUsed}`)
          return { content, tokensUsed }
        }

        const decoder = new TextDecoder()
        let buffer = ''
        let chunkCount = 0
        let emptyLineCount = 0
        const MAX_EMPTY_LINES = 100 // 防止无限循环
        const STREAM_TIMEOUT = 60000 // 流式读取超时 60 秒（独立于请求超时）

        // 流式读取超时保护
        const streamTimeoutId = setTimeout(() => {
          console.warn(`[API] 流式读取超时 (${STREAM_TIMEOUT}ms)，强制取消`)
          reader.cancel().catch(() => {})
        }, STREAM_TIMEOUT)

        try {
          while (true) {
            // 检查是否被外部 abort
            if (signal.aborted) {
              console.warn(`[API] 外部请求被中止，停止流式读取`)
              throw new Error('请求被中止')
            }

            const { done, value } = await reader.read()

            if (done) {
              console.log(`[API] 流式读取完成，共接收 ${chunkCount} 个数据块`)
              break
            }

            // 解码并添加到缓冲区
            buffer += decoder.decode(value, { stream: true })

            // 按行分割
            const lines = buffer.split('\n')
            buffer = lines.pop() || '' // 保留最后一个不完整的行

            for (const line of lines) {
              const trimmedLine = line.trim()

              // 跳过空行
              if (!trimmedLine) {
                emptyLineCount++
                if (emptyLineCount > MAX_EMPTY_LINES) {
                  console.warn(`[API] 空行过多，可能存在问题`)
                  break
                }
                continue
              }

              emptyLineCount = 0 // 重置空行计数

              // SSE 格式必须以 "data: " 开头
              if (!trimmedLine.startsWith('data: ')) {
                console.log(`[API] 跳过非 SSE 行: ${trimmedLine.substring(0, 50)}...`)
                continue
              }

              const data = trimmedLine.slice(6).trim()

              // 检查结束标记
              if (data === '[DONE]') {
                console.log(`[API] 收到流式结束标记`)
                continue
              }

              // 解析 JSON
              try {
                const parsed = JSON.parse(data)

                // 调试：记录前几个块的完整结构
                if (chunkCount < 3) {
                  console.log(`[API] 块 #${chunkCount + 1} 原始数据:`, JSON.stringify(parsed))
                }

                // 检测响应格式
                const format = this.detectResponseFormat(parsed)

                // 检测推理内容
                const reasoningResult = this.detectReasoningContent(parsed, format)

                // 检测是否为 GLM 模型（用于后续处理）
                const isGLMModel = model.toLowerCase().includes('glm')

                // 调试日志 - 详细记录 GLM 响应结构
                const shouldLog = chunkCount < 15 || (chunkCount % 100 === 0 && chunkCount < 1000)
                if (shouldLog) {
                  console.log(`[API] ========== 块 #${chunkCount + 1} ==========`)
                  console.log(`[API] 模型: ${model}`)
                  console.log(`[API] choices[0].delta:`, parsed.choices?.[0]?.delta)
                  const deltaKeys = Object.keys(parsed.choices?.[0]?.delta || {})
                  console.log(`[API] delta 的 keys:`, deltaKeys)
                  console.log(`[API] 推理检测:`, {
                    hasReasoning: reasoningResult.hasReasoning,
                    reasoningLen: reasoningResult.reasoningText?.length || 0,
                    contentLen: reasoningResult.actualContent?.length || 0
                  })
                  if (isGLMModel && reasoningResult.actualContent) {
                    console.log(`[API] ✅ GLM 检测到 content 字段！内容:`, reasoningResult.actualContent.substring(0, 50))
                  }
                  console.log(`[API] =================================`)
                }

                // 统一处理所有模型的思考链和内容
                // 1. 处理推理内容（reasoning_content）- 思考阶段，不添加到最终内容
                if (reasoningResult.hasReasoning && reasoningResult.reasoningText) {
                  chunkCount++
                  console.log(`[API] 检测到推理内容，长度: ${reasoningResult.reasoningText.length}`)

                  try {
                    // 发送空内容和 THINKING 状态，触发"正在深度思考中"UI
                    onChunk('', StreamState.THINKING)
                  } catch (callbackError) {
                    console.error(`[API] onChunk 回调错误:`, callbackError)
                  }
                }

                // 2. 处理实际答案内容（content）- 生成阶段，添加到最终内容
                if (reasoningResult.actualContent) {
                  fullContent += reasoningResult.actualContent
                  chunkCount++

                  try {
                    // 发送实际内容和 GENERATING 状态，触发"AI 生成中"UI
                    onChunk(reasoningResult.actualContent, StreamState.GENERATING)
                  } catch (callbackError) {
                    console.error(`[API] onChunk 回调错误:`, callbackError)
                  }
                }

                if (!reasoningResult.hasReasoning && !reasoningResult.actualContent) {
                  // 记录没有内容的块，帮助调试
                  if (chunkCount === 0) {
                    console.log(`[API] 第一个块的 keys:`, Object.keys(parsed))
                    console.log(`[API] 推理检测结果:`, reasoningResult)
                  }
                }
              } catch (parseError) {
                // JSON 解析失败，记录但继续
                if (chunkCount === 0) {
                  console.warn(`[API] 首次 JSON 解析失败，数据: ${data.substring(0, 100)}`)
                }
              }
            }
          }

          const elapsed = Date.now() - startTime
          console.log(`[API] 流式处理完成，耗时: ${elapsed}ms, 总块数: ${chunkCount}, 内容长度: ${fullContent.length}`)
          console.log(`[API] 最终内容预览:`, fullContent.substring(0, 200))
          console.log(`[API] 最终内容完整:`, fullContent)

          // 添加完成状态通知
          if (onChunk && fullContent) {
            try {
              onChunk('', StreamState.COMPLETED)
              console.log(`[API] 已发送完成状态通知`)
            } catch (callbackError) {
              console.error(`[API] 完成状态回调错误:`, callbackError)
            }
          }

          if (!fullContent) {
            console.error(`[API] 流式处理完成但内容为空`)
            throw new Error('流式响应内容为空')
          }

          const tokensUsed = Math.ceil((prompt.length + fullContent.length) / 2)
          return { content: fullContent, tokensUsed, isStreamComplete: true }

        } catch (streamError) {
          console.error(`[API] 流式处理错误:`, streamError)

          // 识别 AbortError，确保不会被重试
          if (streamError instanceof Error) {
            if (streamError.name === 'AbortError' || streamError.message.includes('aborted')) {
              const abortError = new Error('请求被中止')
              abortError.name = 'AbortError'
              throw abortError
            }
          }

          throw streamError
        } finally {
          clearTimeout(streamTimeoutId)
        }
      }

      // 非流式处理
      console.log(`[API] 开始非流式解析...`)
      const data = await response.json()
      console.log(`[API] 响应数据:`, data)

      const content = data.choices?.[0]?.message?.content || ''
      if (!content) {
        console.error(`[API] 响应格式异常:`, data)
        throw new Error('API 返回内容为空')
      }
      const tokensUsed = data.usage?.total_tokens || 0

      const elapsed = Date.now() - startTime
      console.log(`[API] 请求成功，耗时: ${elapsed}ms, tokens: ${tokensUsed}`)

      return { content, tokensUsed }
    } catch (error) {
      const elapsed = Date.now() - startTime
      console.error(`[API] 请求失败，耗时: ${elapsed}ms`, error)

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`请求超时（${elapsed}ms），请检查网络连接或稍后重试`)
      }
      throw error
    }
  }

  /**
   * 调用百度文心一言千帆平台V2 API (OpenAI兼容格式)
   */
  private static async callWenxin(
    apiKey: string,
    prompt: string,
    signal: AbortSignal,
    model: string = 'ernie-speed-128k'
  ): Promise<GenerateResult> {
    // 检查 API Key 配置
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('文心一言 API Key 未配置，请在设置中填写正确的 API Key')
    }

    // 千帆平台V2使用OpenAI兼容格式
    const apiUrl = 'https://qianfan.baidubce.com/v2/chat/completions'

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: '你是一个专业的社交媒体文案写作助手。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
      signal,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMsg = errorData.error?.message || errorData.message || `文心一言 API 请求失败 (状态码: ${response.status})`
      throw new Error(errorMsg)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    if (!content) {
      throw new Error('API 返回内容为空')
    }
    const tokensUsed = data.usage?.total_tokens || 0

    return { content, tokensUsed }
  }

  /**
   * 人性化处理 - 去除 AI 写作痕迹（三层防护 + 缓存支持 + 流式输出）
   */
  private static async humanize(
    content: string,
    provider: string,
    apiKey: string,
    originalTokens: number,
    platform: PlatformKey = 'twitter',
    customModel?: string,
    customApiUrl?: string,
    onChunk?: StreamChunkCallback  // 流式回调（可选）
  ): Promise<GenerateResult> {
    // 防止空内容导致模板替换失败
    if (!content || content.trim().length === 0) {
      return { content, tokensUsed: originalTokens }
    }

    try {
      // 获取人性化配置
      const config = await getHumanizeConfig()

      // 如果未配置或未启用人性化处理，直接返回
      if (!config || !config.enabled) {
        return { content, tokensUsed: originalTokens }
      }

      // 检查缓存
      if (config.advancedOptions?.enableCache !== false) {
        const cacheKey = this.buildCacheKey(content, config.humanizeModel, platform)
        const cached = await getHumanizeCache(cacheKey)

        if (cached) {
          return {
            content: cached.output.content,
            tokensUsed: originalTokens // 缓存命中不消耗token
          }
        }
      }

      // 第3层：代码后处理（强制执行，无需等待AI）
      const processedContent = fullHumanizePostProcess(content, platform)

      // 如果内容已经被完全处理干净，跳过AI调用
      if (processedContent !== content && processedContent.length > 10) {
        return { content: processedContent, tokensUsed: originalTokens }
      }

      // 使用人性化处理专用模型
      const humanizeModel = customModel || config.humanizeModel
      const humanizeProvider = this.getProviderFromModel(humanizeModel, provider)

      const prompt = await this.buildHumanizePrompt(content)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 人性化处理超时 60 秒（长文本需要更长时间）

      try {
        let result: GenerateResult

        // 使用人性化处理专用模型
        switch (humanizeProvider) {
          case 'openai':
            result = await this.callOpenAIForHumanize(apiKey, prompt, controller.signal, humanizeModel)
            break
          case 'claude':
            result = await this.callClaudeForHumanize(apiKey, prompt, controller.signal, humanizeModel)
            break
          case 'qwen':
          case 'glm':
          case 'kimi':
          case 'deepseek':
          case 'doubao':
          case 'custom': {
            const providerConfig = AI_PROVIDERS[humanizeProvider as keyof typeof AI_PROVIDERS]
            // 对于自定义提供商，优先使用用户配置的 customApiUrl
            const apiUrl = humanizeProvider === 'custom' && customApiUrl
              ? customApiUrl
              : providerConfig.apiUrl

            result = await this.callOpenAICompatibleForHumanize(
              apiUrl,
              humanizeModel,
              apiKey,
              prompt,
              controller.signal,
              onChunk  // 传递流式回调
            )
            break
          }
          case 'wenxin':
            result = await this.callWenxinForHumanize(apiKey, prompt, controller.signal, humanizeModel)
            break
          default:
            // 如果不支持，只做代码后处理
            return { content: processedContent, tokensUsed: originalTokens }
        }

        clearTimeout(timeoutId)

        // AI 处理后再次执行代码后处理
        const finalContent = fullHumanizePostProcess(result.content, platform)

        // 保存到缓存
        if (config.advancedOptions?.enableCache !== false) {
          const cacheKey = this.buildCacheKey(content, humanizeModel, platform)
          await setHumanizeCache(cacheKey, {
            input: {
              contentHash: cacheKey,
              style: '',
              platform: platform,
              provider: humanizeProvider,
              humanizeEnabled: true,
              humanizeModel: humanizeModel,
              originalContent: content
            },
            output: {
              content: finalContent,
              model: humanizeModel,
              tokensUsed: result.tokensUsed,
              processedAt: Date.now()
            },
            metadata: {
              hitCount: 0,
              lastHitAt: Date.now()
            }
          })
        }

        return {
          content: finalContent,
          tokensUsed: originalTokens + result.tokensUsed
        }
      } catch (error) {
        clearTimeout(timeoutId)
        // 人性化处理失败，返回代码处理后的内容
        console.warn('人性化处理失败，返回后处理内容:', error)
        return { content: processedContent, tokensUsed: originalTokens }
      }
    } catch (error) {
      console.warn('人性化配置读取失败，跳过人性化处理:', error)
      return { content, tokensUsed: originalTokens }
    }
  }

  /**
   * 构建缓存键（支持中文）
   */
  private static buildCacheKey(content: string, model: string, platform: PlatformKey): string {
    // 使用 TextEncoder 处理中文，然后转换为 base64
    const encoder = new TextEncoder()
    const data = encoder.encode(content)
    const contentHash = btoa(String.fromCharCode(...new Uint8Array(data)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .substring(0, 32)
    return `${platform}_${model}_${contentHash}`
  }

  /**
   * 从模型名称推断提供商
   */
  private static getProviderFromModel(model: string, defaultProvider: string): string {
    if (model.startsWith('gpt-')) return 'openai'
    if (model.startsWith('claude-')) return 'claude'
    if (model.startsWith('qwen-')) return 'qwen'
    if (model.startsWith('glm-')) return 'glm'
    if (model.startsWith('ERNIE')) return 'wenxin'
    if (model.startsWith('moonshot-')) return 'kimi'
    if (model.startsWith('deepseek-')) return 'deepseek'
    if (model.startsWith('ep-')) return 'doubao'
    return defaultProvider
  }

  /**
   * SKILL文件缓存
   */
  private static humanizeSkillCache: string | null = null

  /**
   * 加载人性化处理增强SKILL
   */
  private static async loadHumanizeSkill(): Promise<string> {
    // 从缓存返回
    if (this.humanizeSkillCache) {
      return this.humanizeSkillCache
    }

    try {
      // 动态导入SKILL文件内容
      const skillUrl = chrome.runtime.getURL('.agents/skills/humanize-enhancer/SKILL.md')
      const response = await fetch(skillUrl)
      if (!response.ok) {
        throw new Error(`Failed to load skill: ${response.status}`)
      }
      const skillContent = await response.text()

      // 缓存内容
      this.humanizeSkillCache = skillContent
      return skillContent
    } catch (error) {
      console.warn('[AI] 无法加载增强SKILL，使用基础规则:', error)
      // 如果加载失败，返回空字符串，将只使用基础规则
      return ''
    }
  }

  /**
   * 构建人性化处理专用 Prompt（增强版）
   */
  private static async buildHumanizePrompt(content: string): Promise<string> {
    // 基础prompt
    let prompt = HUMANIZER_PROMPT.replace('{content}', content)

    // 尝试加载增强SKILL
    try {
      const skillContent = await this.loadHumanizeSkill()
      if (skillContent) {
        // 将SKILL的核心规则附加到prompt中
        prompt += `

---

## 增强规则（仅在开启人性化处理时应用）

${skillContent}
`
      }
    } catch (error) {
      // 如果加载失败，只使用基础prompt
      console.warn('[AI] SKILL加载失败，使用基础人性化规则')
    }

    return prompt
  }

  /**
   * 调用 OpenAI 进行人性化处理
   */
  private static async callOpenAIForHumanize(
    apiKey: string,
    prompt: string,
    signal: AbortSignal,
    model: string = 'gpt-4o-mini'
  ): Promise<GenerateResult> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.8, // 稍高的温度增加变化性
      }),
      signal,
    })

    if (!response.ok) {
      throw new Error(`人性化处理失败，状态码: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    const tokensUsed = data.usage?.total_tokens || 0

    return { content, tokensUsed }
  }

  /**
   * 调用 Claude 进行人性化处理
   */
  private static async callClaudeForHumanize(
    apiKey: string,
    prompt: string,
    signal: AbortSignal,
    model: string = 'claude-3-haiku-20240307'
  ): Promise<GenerateResult> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
      signal,
    })

    if (!response.ok) {
      throw new Error(`人性化处理失败，状态码: ${response.status}`)
    }

    const data = await response.json()
    const content = data.content?.[0]?.text || ''
    const tokensUsed = Math.ceil((prompt.length + content.length) / 2)

    return { content, tokensUsed }
  }

  /**
   * 调用 OpenAI 兼容 API 进行人性化处理（支持流式输出和 GLM thinking 模式处理）
   */
  private static async callOpenAICompatibleForHumanize(
    apiUrl: string,
    model: string,
    apiKey: string,
    prompt: string,
    signal: AbortSignal,
    onChunk?: StreamChunkCallback  // 流式回调（可选）
  ): Promise<GenerateResult> {
    console.log(`[Humanize] 开始人性化处理，模型: ${model}, API: ${apiUrl}, 流式: ${!!onChunk}`)

    // 启用流式输出（如果有回调）
    const enableStream = !!onChunk

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 2000,  // 增加到 2000 以支持长文本
        temperature: 0.8,
        stream: enableStream,
        // GLM 特殊处理：禁用 thinking 模式
        // 原因：GLM-5/5.1 在 thinking 模式下可能只返回 reasoning_content，导致实际内容为空
        ...(model.toLowerCase().includes('glm') ? { thinking: { type: 'disabled' } } : {})
      }),
      signal,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error(`[Humanize] API 错误:`, errorData)
      throw new Error(`人性化处理失败，状态码: ${response.status}`)
    }

    // 流式处理
    if (enableStream) {
      console.log(`[Humanize] 开始流式处理...`)
      let fullContent = ''
      const reader = response.body?.getReader()

      if (!reader) {
        console.warn(`[Humanize] 无法获取响应流，降级到非流式`)
        // 降级到非流式
        const data = await response.json()
        const content = data.choices?.[0]?.message?.content || ''
        if (!content) {
          throw new Error('API 返回内容为空')
        }
        const tokensUsed = data.usage?.total_tokens || 0
        console.log(`[Humanize] 降级非流式成功，内容长度: ${content.length}`)
        return { content, tokensUsed }
      }

      const decoder = new TextDecoder()
      let buffer = ''
      let chunkCount = 0
      const STREAM_TIMEOUT = 60000  // 流式读取超时 60 秒

      // 流式读取超时保护
      const streamTimeoutId = setTimeout(() => {
        console.warn(`[Humanize] 流式读取超时 (${STREAM_TIMEOUT}ms)，强制取消`)
        reader.cancel().catch(() => {})
      }, STREAM_TIMEOUT)

      try {
        while (true) {
          // 检查是否被外部 abort
          if (signal.aborted) {
            console.warn(`[Humanize] 外部请求被中止，停止流式读取`)
            throw new Error('请求被中止')
          }

          const { done, value } = await reader.read()

          if (done) {
            console.log(`[Humanize] 流式读取完成，共接收 ${chunkCount} 个数据块`)
            break
          }

          // 解码并添加到缓冲区
          buffer += decoder.decode(value, { stream: true })

          // 按行分割
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''  // 保留最后一个不完整的行

          for (const line of lines) {
            const trimmedLine = line.trim()

            // 跳过空行
            if (!trimmedLine) continue

            // SSE 格式必须以 "data: " 开头
            if (!trimmedLine.startsWith('data: ')) {
              continue
            }

            const data = trimmedLine.slice(6).trim()

            // 检查结束标记
            if (data === '[DONE]') {
              console.log(`[Humanize] 收到流式结束标记`)
              continue
            }

            // 解析 JSON
            try {
              const parsed = JSON.parse(data)

              // 检测响应格式
              const format = this.detectResponseFormat(parsed)

              // 检测推理内容
              const reasoningResult = this.detectReasoningContent(parsed, format)

              // 处理推理内容（不添加到最终内容）
              if (reasoningResult.hasReasoning && reasoningResult.reasoningText) {
                chunkCount++
                console.log(`[Humanize] 检测到推理内容，长度: ${reasoningResult.reasoningText.length}`)

                try {
                  // 发送空内容和 THINKING 状态
                  onChunk('', StreamState.THINKING)
                } catch (callbackError) {
                  console.error(`[Humanize] onChunk 回调错误:`, callbackError)
                }
              }

              // 处理实际答案内容
              if (reasoningResult.actualContent) {
                fullContent += reasoningResult.actualContent
                chunkCount++

                try {
                  // 发送实际内容和 GENERATING 状态
                  onChunk(reasoningResult.actualContent, StreamState.GENERATING)
                } catch (callbackError) {
                  console.error(`[Humanize] onChunk 回调错误:`, callbackError)
                }
              }
            } catch (parseError) {
              // JSON 解析失败，继续
            }
          }
        }

        console.log(`[Humanize] 流式处理完成，总块数: ${chunkCount}, 内容长度: ${fullContent.length}`)

        // 添加完成状态通知
        if (onChunk && fullContent) {
          try {
            onChunk('', StreamState.COMPLETED)
            console.log(`[Humanize] 已发送完成状态通知`)
          } catch (callbackError) {
            console.error(`[Humanize] 完成状态回调错误:`, callbackError)
          }
        }

        if (!fullContent) {
          console.error(`[Humanize] 流式处理完成但内容为空`)
          throw new Error('流式响应内容为空')
        }

        const tokensUsed = Math.ceil((prompt.length + fullContent.length) / 2)
        return { content: fullContent, tokensUsed, isStreamComplete: true }

      } catch (streamError) {
        console.error(`[Humanize] 流式处理错误:`, streamError)

        // 识别 AbortError
        if (streamError instanceof Error) {
          if (streamError.name === 'AbortError' || streamError.message.includes('aborted')) {
            const abortError = new Error('请求被中止')
            abortError.name = 'AbortError'
            throw abortError
          }
        }

        throw streamError
      } finally {
        clearTimeout(streamTimeoutId)
      }
    }

    // 非流式处理
    console.log(`[Humanize] 开始非流式解析...`)
    const data = await response.json()
    console.log(`[Humanize] API 响应:`, { hasChoices: !!data.choices, hasContent: !!data.choices?.[0]?.message?.content })

    const content = data.choices?.[0]?.message?.content || ''

    if (!content) {
      console.error(`[Humanize] API 返回内容为空，响应数据:`, data)
      throw new Error('人性化处理 API 返回内容为空，请检查模型配置')
    }

    const tokensUsed = data.usage?.total_tokens || 0
    console.log(`[Humanize] 处理完成，内容长度: ${content.length}, tokens: ${tokensUsed}`)

    return { content, tokensUsed }
  }

  /**
   * 调用文心一言进行人性化处理
   */
  private static async callWenxinForHumanize(
    apiKey: string,
    prompt: string,
    signal: AbortSignal,
    model: string = 'ernie-speed-128k'
  ): Promise<GenerateResult> {
    // 检查 API Key 配置
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('文心一言 API Key 未配置，请在设置中填写正确的 API Key')
    }

    // 千帆平台V2使用OpenAI兼容格式
    const apiUrl = 'https://qianfan.baidubce.com/v2/chat/completions'

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
      signal,
    })

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as any
      const errorMessage = errorData.error?.message || errorData.message || `文心一言 API 请求失败 (状态码: ${response.status})`
      throw new Error(errorMessage)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    const tokensUsed = data.usage?.total_tokens || 0

    return { content, tokensUsed }
  }
}
