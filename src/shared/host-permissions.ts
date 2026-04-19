/**
 * 动态请求 optional_host_permissions
 * 仅在用户配置对应 AI 服务时按需授权
 */

const PROVIDER_HOST_MAP: Record<string, string> = {
  openai: 'https://api.openai.com/*',
  claude: 'https://api.anthropic.com/*',
  qwen: 'https://dashscope.aliyuncs.com/*',
  glm: 'https://open.bigmodel.cn/*',
  wenxin: 'https://aip.baidubce.com/*',
  kimi: 'https://api.moonshot.cn/*',
  deepseek: 'https://api.deepseek.com/*',
  doubao: 'https://ark.cn-beijing.volces.com/*',
}

export async function ensureHostPermission(provider: string): Promise<boolean> {
  const origin = PROVIDER_HOST_MAP[provider]
  if (!origin) return true // custom 等无需权限

  try {
    const granted = await chrome.permissions.contains({
      origins: [origin],
    })
    if (granted) return true

    const result = await chrome.permissions.request({
      origins: [origin],
    })
    return result
  } catch {
    return false
  }
}
