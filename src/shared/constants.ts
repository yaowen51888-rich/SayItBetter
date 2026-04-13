// AI 提供商配置
export const AI_PROVIDERS = {
  openai: {
    name: 'OpenAI',
    displayName: 'OpenAI (GPT-5.4)',
    model: 'gpt-5.4-mini',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    apiKeyUrl: 'https://platform.openai.com/api-keys',
    format: 'openai',
  },
  claude: {
    name: 'Claude',
    displayName: 'Anthropic (Claude 4.6)',
    model: 'claude-sonnet-4-6',
    apiUrl: 'https://api.anthropic.com/v1/messages',
    apiKeyUrl: 'https://console.anthropic.com/',
    format: 'claude',
  },
  qwen: {
    name: 'Qwen',
    displayName: '通义千问 (阿里云)',
    model: 'qwen3-plus',
    apiUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    apiKeyUrl: 'https://dashscope.console.aliyun.com/apiKey',
    format: 'openai',
  },
  glm: {
    name: 'GLM',
    displayName: '智谱 GLM',
    model: 'glm-4.7',
    apiUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    apiKeyUrl: 'https://open.bigmodel.cn/usercenter/apikeys',
    format: 'openai',
  },
  wenxin: {
    name: 'Wenxin',
    displayName: '文心一言 (百度千帆)',
    model: 'ernie-4.0-8k',
    apiUrl: 'https://qianfan.baidubce.com/v2/chat/completions',
    apiKeyUrl: 'https://console.bce.baidu.com/qianfan/#/qianfan/instance/create',
    format: 'openai',
  },
  kimi: {
    name: 'Kimi',
    displayName: 'Kimi (月之暗面)',
    model: 'kimi-k2-turbo-preview',
    apiUrl: 'https://api.moonshot.cn/v1/chat/completions',
    apiKeyUrl: 'https://platform.moonshot.cn/console/api-keys',
    format: 'openai',
  },
  deepseek: {
    name: 'DeepSeek',
    displayName: 'DeepSeek',
    model: 'deepseek-chat',
    apiUrl: 'https://api.deepseek.com/v1/chat/completions',
    apiKeyUrl: 'https://platform.deepseek.com/api_keys',
    format: 'openai',
  },
  doubao: {
    name: 'Doubao',
    displayName: '豆包 (火山云)',
    model: 'doubao-lite',
    apiUrl: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    apiKeyUrl: 'https://console.volcengine.com/ark',
    format: 'openai',
  },
  custom: {
    name: 'Custom',
    displayName: '自定义 API',
    model: 'custom-model',
    apiUrl: '',
    apiKeyUrl: '',
    format: 'openai',
  },
} as const

export type AIProviderKey = keyof typeof AI_PROVIDERS

// 平台配置
export const PLATFORMS = {
  twitter: {
    name: 'Twitter/X',
    maxLength: 280,
    emoji: '🐦',
    promptTemplate: '将以下内容改写为 Twitter 文案，要求：{style}，添加相关标签和emoji。\n\n原文：{content}\n\n改写后的 Twitter 文案：',
    features: {
      autoSplit: true, // 自动分割长推文
      hashtagSuggestion: true, // 标签建议
      emojiOptimization: true, // emoji优化
      toneOptimization: true, // 语气优化
    },
  },
  xiaohongshu: {
    name: '小红书',
    maxLength: 1000,
    emoji: '📕',
    promptTemplate: '将以下内容改写为小红书文案，要求：{style}，添加emoji和吸引人的标题，使用吸睛的词汇。\n\n原文：{content}\n\n改写后的小红书文案：',
    features: {
      attractiveTitle: true, // 吸引人的标题
      hashtagSuggestion: true, // 标签建议
      emojiOptimization: true, // emoji优化
      structureOptimization: true, // 结构优化
    },
  },
  linkedin: {
    name: 'LinkedIn',
    maxLength: 3000,
    emoji: '💼',
    promptTemplate: '将以下内容改写为 LinkedIn 专业文案，要求：{style}，段落清晰，专业语气。\n\n原文：{content}\n\n改写后的 LinkedIn 文案：',
    features: {
      professionalTone: true, // 专业语气
      structureOptimization: true, // 结构优化
      callToAction: true, // 行动呼吁
    },
  },
  moments: {
    name: '朋友圈',
    maxLength: Infinity,
    emoji: '👥',
    promptTemplate: '将以下内容改写为朋友圈文案，要求：{style}，简洁有力，引发共鸣。\n\n原文：{content}\n\n改写后朋友圈文案：',
    features: {
      engagementOptimization: true, // 互动优化
      emojiOptimization: true, // emoji优化
      lengthOptimization: true, // 长度优化
    },
  },
  weibo: {
    name: '微博',
    maxLength: 140,
    emoji: '📱',
    promptTemplate: '将以下内容改写为微博文案，要求：{style}，简洁有力，添加热门话题标签。\n\n原文：{content}\n\n改写后的微博文案：',
    features: {
      hashtagSuggestion: true, // 话题标签
      emojiOptimization: true, // emoji优化
      trendingTopics: true, // 热门话题
    },
  },
  zhihu: {
    name: '知乎',
    maxLength: 10000,
    emoji: '🧠',
    promptTemplate: '将以下内容改写为知乎回答/文章，要求：{style}，逻辑清晰，有深度。\n\n原文：{content}\n\n改写后的知乎内容：',
    features: {
      logicalStructure: true, // 逻辑结构
      professionalTone: true, // 专业语气
      depthOptimization: true, // 深度优化
    },
  },
  toutiao: {
    name: '今日头条',
    maxLength: 2000,
    emoji: '📰',
    promptTemplate: '将以下内容改写为今日头条文章，要求：{style}，标题吸引人，内容有价值。\n\n原文：{content}\n\n改写后的今日头条内容：',
    features: {
      attractiveTitle: true, // 吸引人的标题
      valueContent: true, // 有价值的内容
      seoOptimization: true, // SEO优化
    },
  },
  wechat: {
    name: '微信公众号',
    maxLength: 20000,
    emoji: '💬',
    promptTemplate: '将以下内容改写为微信公众号文章，要求：{style}，排版精美，内容丰富。\n\n原文：{content}\n\n改写后的公众号内容：',
    features: {
      richFormatting: true, // 丰富的排版
      visualOptimization: true, // 视觉优化
      engagementOptimization: true, // 互动优化
    },
  },
} as const

export type PlatformKey = keyof typeof PLATFORMS

// 默认风格（已优化去除 AI 写作痕迹）
export const DEFAULT_STYLES = [
  {
    id: 'professional',
    name: '专业正式',
    prompt: '直接、简洁。避免"此外"、"然而"等连接词。用具体事实代替模糊描述。删除"关键"、"重要"等空洞词汇。',
  },
  {
    id: 'casual',
    name: '轻松随意',
    prompt: '像和朋友聊天。用"我"表达观点。句子长短变化。避免"此外"、"另外"等过渡词。具体细节比概括描述更好。',
  },
  {
    id: 'humorous',
    name: '幽默风趣',
    prompt: '带点锋芒。不刻意搞笑。自嘲比调侃他人更有效。具体场景比抽象说法更有趣。避免"众所周知"、"显然"等词汇。',
  },
  {
    id: 'storytelling',
    name: '故事叙述',
    prompt: '用具体场景开头。有时间地点人物。细节能让故事真实。避免总结性陈述，让读者自己得出结论。',
  },
  {
    id: 'minimalist',
    name: '极简主义',
    prompt: '删除所有不必要的内容。每个字都要有目的。短句为主。不要铺垫、不要过渡、不要总结。',
  },
]

// 快捷键配置
export const DEFAULT_SHORTCUT = 'Ctrl+Shift+Q'

// CSP 策略 - 支持所有 AI 提供商
export const CSP_POLICY = "script-src 'self'; object-src 'self'; connect-src 'self' " +
  "https://api.openai.com " +
  "https://api.anthropic.com " +
  "https://dashscope.aliyuncs.com " +
  "https://open.bigmodel.cn " +
  "https://qianfan.baidubce.com " +
  "https://api.moonshot.cn " +
  "https://api.deepseek.com " +
  "https://ark.cn-beijing.volces.com"

// 存储键名
export const STORAGE_KEYS = {
  USER_SETTINGS: 'userSettings',
  USER_STYLES: 'userStyles',
  HISTORY: 'history',
  USAGE_STATS: 'usageStats',
} as const

// 扩展存储键名（用于人性化处理功能）
export const EXTENDED_STORAGE_KEYS = {
  HUMANIZE_CONFIG: 'humanizeConfig',
  HUMANIZE_CACHE: 'humanizeCache',
} as const

// 默认设置
export const DEFAULT_SETTINGS = {
  defaultProvider: '',
  apiKey: '',
  defaultStyle: 'professional',
  defaultPlatform: 'twitter',
  enableHumanize: true,
}

// 用户等级配置
export const TIER_CONFIGS = {
  free: {
    name: '免费版',
    dailyTokens: 5000,
    monthlyTokens: 0, // 免费版没有月度配额
    maxStyles: 3,
    canCreateCustomStyle: false,
    hasCloudSync: false,
    hasBatchProcessing: false,
    hasPriorityModel: false,
  },
  premium: {
    name: '专业版',
    dailyTokens: 0, // 专业版没有日限制
    monthlyTokens: 100000,
    maxStyles: Infinity,
    canCreateCustomStyle: true,
    hasCloudSync: true,
    hasBatchProcessing: true,
    hasPriorityModel: true,
  },
  enterprise: {
    name: '企业版',
    dailyTokens: 0,
    monthlyTokens: 500000,
    maxStyles: Infinity,
    canCreateCustomStyle: true,
    hasCloudSync: true,
    hasBatchProcessing: true,
    hasPriorityModel: true,
  },
} as const

// 免费版可用风格ID
export const FREE_STYLE_IDS = ['professional', 'casual', 'humorous']
