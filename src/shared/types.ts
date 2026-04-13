// 用户设置（重构版）
export interface UserSettings {
  apiProfiles: ApiProfile[]    // API配置列表
  activeProfileId: string      // 当前激活的配置ID
  defaultStyle: string
  defaultPlatform: string
  // 保留旧字段用于迁移
  defaultProvider?: AIProvider  // @deprecated
  apiKey?: string              // @deprecated
  customApiUrl?: string        // @deprecated
  enableHumanize?: boolean     // @deprecated
}

// ========== 人性化处理相关类型 ==========

/**
 * 人性化配置（简化版）
 * provider 和 defaultModel 已移至 ApiProfile
 */
export interface HumanizeConfig {
  enabled: boolean                    // 是否启用人性化处理
  humanizeModel: string              // 人性化处理模型
  advancedOptions?: AdvancedOptions  // 高级选项
  providerModelMemory?: Record<string, string>  // provider → humanizeModel 记忆
}

/**
 * @deprecated 旧的模型配置，仅用于数据迁移
 */
export interface LegacyModelConfig {
  provider: AIProvider
  defaultModel: string
  humanizeModel: string
  useCustom?: boolean
}

/**
 * @deprecated 旧的人性化配置，仅用于数据迁移
 */
export interface LegacyHumanizeConfig {
  enabled: boolean
  modelConfig: LegacyModelConfig
  advancedOptions?: AdvancedOptions
  providerModelMemory?: Record<string, { defaultModel: string; humanizeModel: string }>
}

/**
 * 高级选项
 */
export interface AdvancedOptions {
  doublePass?: boolean               // 是否进行二次迭代
  temperature?: number               // 采样温度 (0.7-1.0)
  maxTokens?: number                 // 最大token数
  enableCache?: boolean              // 是否启用缓存
}

/**
 * 人性化处理结果
 */
export interface HumanizeResult {
  content: string                    // 生成内容
  tokensUsed: number                 // 使用的token数
  model: string                      // 使用的模型
  humanized?: boolean                // 是否进行了人性化处理
  cached?: boolean                   // 是否来自缓存
  processingTime?: number            // 处理耗时(ms)
  stage: 'initial' | 'humanized' | 'post-processed'
  stages?: {
    initial: { content: string; model: string; tokens: number }
    humanized?: { content: string; model: string; tokens: number }
    final: string
  }
}

/**
 * 缓存键数据
 */
export interface CacheKeyData {
  contentHash: string
  style: string
  platform: string
  provider: string
  humanizeEnabled: boolean
  humanizeModel: string
}

/**
 * 人性化缓存条目
 */
export interface HumanizeCacheEntry {
  key: string
  input: CacheKeyData & {
    originalContent: string
  }
  output: {
    content: string
    model: string
    tokensUsed: number
    processedAt: number
  }
  metadata: {
    hitCount: number
    lastHitAt: number
    similarity?: number
  }
}


// AI 提供商类型
export type AIProvider =
  | 'openai'        // OpenAI (GPT-4)
  | 'claude'        // Anthropic (Claude)
  | 'qwen'          // 阿里通义千问
  | 'glm'           // 智谱 GLM
  | 'wenxin'        // 百度文心一言
  | 'kimi'          // 月之暗面 Kimi
  | 'deepseek'      // DeepSeek
  | 'doubao'        // 火山云豆包
  | 'custom'        // 自定义 API

// ========== API配置档案 ==========

/**
 * API配置档案
 */
export interface ApiProfile {
  id: string                    // 唯一ID
  provider: AIProvider          // 提供商类型
  apiKey: string               // API密钥
  model: string                // 默认生成模型
  customApiUrl?: string        // 自定义端点
  createdAt: number            // 创建时间
  isDefault?: boolean          // 是否为默认配置
}

/**
 * 推荐模型配置
 */
export interface RecommendedModels {
  default: string              // 初始改写模型
  humanize: string            // 人性化处理模型
}

/**
 * 自定义提供商配置
 */
export interface CustomProviderConfig {
  defaultModel: string         // 用户手动输入的模型
  humanizeModel: string       // 用户手动输入的人性化模型
}

// 风格模板
export interface UserStyle {
  id: string
  name: string
  prompt: string
}

// 平台模板
export interface PlatformTemplate {
  maxLength: number
  promptTemplate: string
}

// 历史记录
export interface HistoryItem {
  id: string
  timestamp: string
  originalText: string
  generatedText: string
  platform: string
  style: string
  provider: string
  tokensUsed: number
}

// 使用统计
export interface UsageStats {
  totalGenerations: number
  totalTokens: number
  lastUsed: string | null
}

/**
 * @deprecated 买断制模式下无配额限制，此接口仅用于向后兼容
 * 用户自备 API Key，使用量不受限制
 */
export interface TokenQuota {
  dailyLimit: number // 0 表示无限制
  dailyUsed: number
  dailyResetAt: string // ISO时间戳
  monthlyLimit: number // 0 表示无限制
  monthlyUsed: number
  monthlyResetAt: string
}

/**
 * @deprecated 免费版无配额限制
 */
export const UNLIMITED_QUOTA: TokenQuota = {
  dailyLimit: 0,
  dailyUsed: 0,
  dailyResetAt: '',
  monthlyLimit: 0,
  monthlyUsed: 0,
  monthlyResetAt: '',
}

/**
 * 用户等级 - 统一为免费版
 *
 * @deprecated 免费版所有功能开放，无需区分用户等级
 */
export type UserTier = 'free'

/**
 * 功能权限（免费版 - 所有功能开放）
 *
 * 用户自备 API Key，所有功能无限制使用
 */
export interface FeaturePermissions {
  // === 基础功能 ===
  maxStyles: number
  canCreateCustomStyle: boolean
  hasBatchProcessing: boolean

  // === 买断版高级功能 ===
  hasSmartCache: boolean        // 智能缓存：重复内容秒级响应
  hasModelRouting: boolean      // 智能路由：自动选择最优模型
  hasABGeneration: boolean      // AB测试（暂未实现）
  maxBatchSize: number          // 批量处理最大条数
  humanizeLevel: 'basic' | 'enhanced'  // 人性化处理级别
  historyRetentionDays: number  // 历史记录保留天数（-1 表示无限）
  hasCloudBackup: boolean       // 云端备份（暂未实现）
  hasPrioritySupport: boolean   // 优先支持

  // === 已废弃字段（保留用于向后兼容）===
  /** @deprecated 已废弃 */
  hasCloudSync: boolean
  /** @deprecated 已废弃 */
  hasPriorityModel: boolean
}

/**
 * 默认功能权限（所有功能开放）
 */
export const DEFAULT_FEATURES: FeaturePermissions = {
  maxStyles: -1,
  canCreateCustomStyle: true,
  hasBatchProcessing: true,
  hasSmartCache: true,
  hasModelRouting: true,
  hasABGeneration: true,
  maxBatchSize: 50,
  humanizeLevel: 'enhanced',
  historyRetentionDays: -1,
  hasCloudBackup: false,
  hasPrioritySupport: false,
  hasCloudSync: false,
  hasPriorityModel: false,
}

// 流式处理状态枚举
export enum StreamState {
  THINKING = 'thinking',      // 正在深度思考（接收 reasoning_content）
  GENERATING = 'generating',  // 正在生成答案（接收 content）
  COMPLETED = 'completed'     // 完成
}

// 消息类型
export type MessageType =
  | 'GET_SELECTED_TEXT'
  | 'SHOW_POPUP'
  | 'HIDE_POPUP'
  | 'GENERATE_CONTENT'
  | 'CONTENT_RESULT'
  | 'CONTENT_ERROR'
  | 'GET_USER_SETTINGS'
  | 'SAVE_USER_SETTINGS'
  | 'GET_USER_STYLES'
  | 'SAVE_USER_STYLES'
  | 'GET_HISTORY'
  | 'CLEAR_HISTORY'
  | 'CACHE_GET'
  | 'CACHE_SET'
  | 'CACHE_CLEAR'
  | 'CACHE_GET_STATS'
  | 'ROUTE_SELECT_MODEL'
  | 'ROUTE_GET_STATS'
  | 'ROUTE_RESET_STATS'
  | 'MIGRATION_EXPORT_DATA'
  | 'MIGRATION_IMPORT_DATA'
  | 'GET_HUMANIZE_CONFIG'      // 新增
  | 'SAVE_HUMANIZE_CONFIG'     // 新增
  | 'GET_CACHE_STATS'          // 新增
  | 'CLEAR_HUMANIZE_CACHE'     // 新增
  | 'GET_API_PROFILES'         // API配置管理
  | 'ADD_API_PROFILE'          // API配置管理
  | 'UPDATE_API_PROFILE'       // API配置管理
  | 'DELETE_API_PROFILE'       // API配置管理
  | 'SET_DEFAULT_API_PROFILE'  // API配置管理
  | 'SET_ACTIVE_API_PROFILE'   // API配置管理
  | 'STREAM_CHUNK'             // 新增：流式输出块
  | 'STREAM_COMPLETE'           // 新增：流式输出完成

export interface MessagePayload {
  type: MessageType
  data?: any
}

// 流式输出数据
export interface StreamChunkData {
  chunk: string
  streamState?: StreamState
  thinkingDuration?: number
}

// AI 调用选项
export interface AIOptions {
  timeout?: number
  maxRetries?: number
  stream?: boolean
  enableHumanize?: boolean // 是否启用人性化处理（去除 AI 写作痕迹），默认 true
  model?: string // 指定模型
  customApiUrl?: string // 自定义 API 端点（仅当 provider 为 custom 时使用）
  onChunk?: (chunk: string, state?: StreamState) => void // 流式输出回调，用于实时传递生成的内容
}


// ========== 缓存相关（新增）==========
export interface CacheInput {
  input: string
  style: string
  platform: string
  humanize: boolean
}

export interface CacheResult {
  output: string
  model: string
  tokens: number
}

export interface CacheEntry {
  key: string
  inputHash: string
  result: string
  metadata: {
    style: string
    platform: string
    model: string
    tokens: number
    cachedAt: number
    hitCount: number
    lastHitAt: number
  }
}

export interface CacheStats {
  totalEntries: number
  hitCount: number
  missCount: number
  hitRate: number
  tokensSaved: number
}

// ========== 路由相关（新增）==========
export interface ComplexityScore {
  total: number
  factors: {
    length: number
    structure: number
    vocabulary: number
    domain: number
  }
  recommendation: 'haiku' | 'sonnet' | 'opus' | 'default'
}

export interface RoutingDecision {
  input: {
    text: string
    style: string
    provider: string
    complexity: ComplexityScore
  }
  output: {
    provider: string
    model: string
    confidence: number
    reason: string[]
  }
}

export interface RouterStats {
  totalRequests: number
  modelDistribution: Record<string, number>
  averageConfidence: number
}

// ========== 迁移相关（新增）==========
export interface MigrationExportData {
  userId: string
  email: string
  exportDate: string
  data: {
    history: HistoryItem[]
    customStyles: UserStyle[]
    settings: UserSettings
  }
  format: 'json'
  downloadUrl: string
}

export interface MigrationImportPlan {
  targetStorage: {
    history: 'IndexedDB'
    customStyles: 'chrome.storage.local'
    settings: 'chrome.storage.local'
  }
  importMethod: {
    autoImport: boolean
    manualImport: boolean
    importUrl: string
  }
  validation: {
    checkIntegrity: boolean
    maxHistoryItems: number
    maxCustomStyles: number
  }
}

// ========== 功能开关（新增）==========
export interface FeatureFlags {
  useNewLicenseSystem: boolean
  showMigrationNotice: boolean
  oldSystemDisabled: boolean
  enableSmartCache: boolean
  enableModelRouting: boolean
  enableABGeneration: boolean
  enableBatchProcessing: boolean
  enableEnhancedHumanize: boolean
  enableUnlimitedHistory: boolean
  enableCloudBackup: boolean
  enableAdvancedPanel: boolean
  enableRouterStats: boolean
  enableCacheStats: boolean
}
