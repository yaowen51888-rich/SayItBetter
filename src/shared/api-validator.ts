/**
 * API Key 验证和错误处理模块（宽松版本，避免误判）
 * 提供统一的验证逻辑和友好的错误提示
 */

export interface ValidationError {
  valid: false
  error: string
  solution: string
  provider?: string
}

export interface ValidationResult {
  valid: true
}

export type ApiKeyValidation = ValidationResult | ValidationError

/**
 * 验证 API Key 格式（宽松验证，避免误判）
 * 实际有效性由 API 调用时验证
 */
export function validateApiKeyFormat(apiKey: string, provider: string = ''): ApiKeyValidation {
  // 检查是否为空
  if (!apiKey || apiKey.trim() === '') {
    return {
      valid: false,
      error: 'API Key 不能为空',
      solution: '请在设置中填写正确的 API Key',
      provider,
    }
  }

  // 去除所有空白字符后检查
  const cleanKey = apiKey.replace(/\s+/g, '')

  // 检查长度（宽松规则：10-200字符）
  if (cleanKey.length < 10) {
    return {
      valid: false,
      error: 'API Key 长度过短',
      solution: '请检查是否复制了完整的 API Key',
      provider,
    }
  }

  if (cleanKey.length > 200) {
    return {
      valid: false,
      error: 'API Key 过长',
      solution: '请确认没有复制多余的内容',
      provider,
    }
  }

  // 检查是否包含明显的非法字符（HTML、脚本、危险协议）
  if (/[<>"'&]|<script|javascript:|data:/i.test(cleanKey)) {
    return {
      valid: false,
      error: 'API Key 包含非法字符',
      solution: '请确保复制时没有多余的符号或空格',
      provider,
    }
  }

  // 通过基础验证（实际有效性由 API 调用时验证）
  return { valid: true }
}

/**
 * 解析 API 错误响应，返回友好的错误信息
 */
export interface ApiErrorInfo {
  message: string
  solution: string
  category: 'invalid_key' | 'expired' | 'quota_exceeded' | 'rate_limit' | 'network' | 'unknown'
}

export function parseApiError(
  errorData: any,
  status: number,
  provider: string = ''
): ApiErrorInfo {
  const errorMessage = errorData.error?.message || errorData.message || ''

  // 1. 无效或错误的 API Key
  if (
    status === 401 ||
    errorMessage.includes('无效') ||
    errorMessage.includes('Invalid') ||
    errorMessage.includes('invalid') ||
    errorMessage.includes('incorrect') ||
    errorMessage.includes('认证失败') ||
    errorMessage.includes('authentication failed') ||
    errorMessage.includes('Unauthorized')
  ) {
    return {
      message: provider ? `${getProviderName(provider)} API Key 无效` : 'API Key 无效',
      solution: '请检查 API Key 是否正确，确保没有多余的空格或字符',
      category: 'invalid_key',
    }
  }

  // 1.5. 权限不足（在配额检查之前，避免误判）
  if (
    status === 403 ||
    errorMessage.includes('permission') ||
    errorMessage.includes('Permission') ||
    errorMessage.includes('权限') ||
    errorMessage.includes('Forbidden') ||
    errorMessage.includes('forbidden') ||
    errorMessage.includes('scope') ||
    errorMessage.includes('credentials')
  ) {
    return {
      message: provider ? `${getProviderName(provider)} API Key 权限不足` : 'API Key 权限不足',
      solution: '请检查 API Key 的权限设置，确保已授予模型访问权限',
      category: 'invalid_key',
    }
  }

  // 2. API Key 已过期
  if (
    errorMessage.includes('过期') ||
    errorMessage.includes('expired') ||
    errorMessage.includes('token') ||
    errorMessage.includes('令牌')
  ) {
    return {
      message: provider ? `${getProviderName(provider)} API Key 已过期` : 'API Key 已过期',
      solution: `请登录 ${getProviderUrl(provider)} 获取新的 API Key`,
      category: 'expired',
    }
  }

  // 3. 配额耗尽（使用精确关键词组合，避免误判权限问题）
  if (
    errorMessage.includes('额度') ||
    errorMessage.includes('quota') ||
    errorMessage.includes('余额') ||
    errorMessage.includes('balance') ||
    errorMessage.includes('credits') ||
    errorMessage.includes('no quota') ||
    // 精确匹配 "Insufficient quota/balance/credits/funds"，避免误判 "Insufficient permissions"
    /insufficient\s+(quota|balance|credits?|funds)/i.test(errorMessage)
  ) {
    return {
      message: provider ? `${getProviderName(provider)} 账户余额不足` : 'API 调用配额不足',
      solution: '请充值或升级账户套餐',
      category: 'quota_exceeded',
    }
  }

  // 4. 频率限制
  if (
    status === 429 ||
    errorMessage.includes('rate limit') ||
    errorMessage.includes('频率') ||
    errorMessage.includes('太快') ||
    errorMessage.includes('Rate Limit') ||
    errorMessage.includes('too many')
  ) {
    return {
      message: 'API 调用频率超限',
      solution: '请稍后重试，或升级账户提高频率限制',
      category: 'rate_limit',
    }
  }

  // 5. 网络错误
  if (
    status === 0 ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('network') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('连接') ||
    errorMessage.includes('ECONNREFUSED')
  ) {
    return {
      message: '网络连接失败',
      solution: '请检查网络连接，或尝试更换网络环境',
      category: 'network',
    }
  }

  // 6. 未知错误
  return {
    message: errorMessage || `API 请求失败 (状态码: ${status})`,
    solution: '请稍后重试，如果问题持续，请查看控制台详细信息',
    category: 'unknown',
  }
}

/**
 * 获取厂商名称
 */
function getProviderName(provider: string): string {
  const names: Record<string, string> = {
    openai: 'OpenAI',
    claude: 'Claude',
    anthropic: 'Claude',
    qwen: '通义千问',
    glm: '智谱 GLM',
    wenxin: '文心一言',
    kimi: 'Kimi',
    deepseek: 'DeepSeek',
    doubao: '豆包',
    custom: '自定义 API',
  }
  return names[provider] || provider
}

/**
 * 获取厂商后台地址
 */
function getProviderUrl(provider: string): string {
  const urls: Record<string, string> = {
    openai: 'https://platform.openai.com/api-keys',
    claude: 'https://console.anthropic.com/',
    anthropic: 'https://console.anthropic.com/',
    qwen: 'https://dashscope.console.aliyun.com/apiKey',
    glm: 'https://open.bigmodel.cn/usercenter/apikeys',
    wenxin: 'https://console.bce.baidu.com/qianfan',
    kimi: 'https://platform.moonshot.cn/console/api-keys',
    deepseek: 'https://platform.deepseek.com/api_keys',
    doubao: 'https://console.volcengine.com/ark',
  }
  return urls[provider] || ''
}

/**
 * 预验证 API Key（发送轻量级请求）
 * 注意：文心一言不进行预验证
 */
export async function prevalidateApiKey(
  apiKey: string,
  provider: string,
  apiUrl?: string
): Promise<ApiKeyValidation> {
  // 先进行格式验证
  const formatValidation = validateApiKeyFormat(apiKey, provider)
  if (!formatValidation.valid) {
    return formatValidation
  }

  // 文心一言不进行预验证（需要特殊的 token 获取逻辑）
  if (provider === 'wenxin') {
    return { valid: true }
  }

  // 根据厂商发送预验证请求
  try {
    let testUrl = apiUrl
    let testHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    }

    // 不同厂商使用不同的测试端点
    const testUrls: Record<string, string> = {
      openai: 'https://api.openai.com/v1/models',
      claude: 'https://api.anthropic.com/v1/models',
      anthropic: 'https://api.anthropic.com/v1/models',
      qwen: 'https://dashscope.aliyuncs.com/v1/models',
      glm: 'https://open.bigmodel.cn/api/paas/v4/models',
      kimi: 'https://api.moonshot.cn/v1/models',
      deepseek: 'https://api.deepseek.com/v1/models',
      doubao: 'https://ark.cn-beijing.volces.com/api/v3/models',
    }

    if (!testUrl) {
      testUrl = testUrls[provider]
    }

    if (!testUrl) {
      // 无法确定测试端点，跳过预验证
      return { valid: true }
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5秒超时

    const response = await fetch(testUrl, {
      method: 'GET',
      headers: testHeaders,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (response.ok) {
      return { valid: true }
    } else {
      const errorData = await response.json().catch(() => ({}))
      const errorInfo = parseApiError(errorData, response.status, provider)
      return {
        valid: false,
        error: errorInfo.message,
        solution: errorInfo.solution,
        provider,
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      // 超时不一定意味着key无效，可能是网络问题
      return { valid: true }
    }
    // 网络错误不阻止保存
    return { valid: true }
  }
}