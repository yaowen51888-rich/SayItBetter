/**
 * 配置管理入口
 *
 * 导出所有配置相关的功能
 */

export { getHumanizeConfig, saveHumanizeConfig, resetHumanizeConfig, DEFAULT_HUMANIZE_CONFIG } from './humanize-config'
export { HUMANIZE_MODEL_CONFIG, getHumanizeModel, getDefaultModel, getModelConfig, getRecommendedProfileModel } from './humanize-models'
export { PLATFORM_HUMANIZE_INSTRUCTIONS } from './humanize-defaults'
export { RECOMMENDED_MODELS, getRecommendedModels, isCustomProvider } from './recommended-models'
