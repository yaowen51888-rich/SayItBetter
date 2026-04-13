import type { MigrationExportData } from './types'
import type { HistoryItem, UserStyle, UserSettings } from '../../shared/types'

/**
 * 导出用户数据（用于迁移）
 *
 * 从本地存储中获取所有用户数据，生成可导出的 JSON 格式。
 */
export async function exportUserData(): Promise<MigrationExportData> {
  // 从本地存储获取数据
  const [historyResult, stylesResult, settingsResult] = await Promise.all([
    chrome.storage.local.get('HISTORY'),
    chrome.storage.local.get('USER_STYLES'),
    chrome.storage.local.get('USER_SETTINGS'),
  ])

  // 获取用户信息
  const userResult = await chrome.storage.local.get('current_user_id')
  const userId = userResult.current_user_id || 'current-user'

  const history: HistoryItem[] = historyResult.HISTORY || []
  const customStyles: UserStyle[] = stylesResult.USER_STYLES || []
  const settings: UserSettings = settingsResult.USER_SETTINGS || {} as any

  // 生成导出数据
  const exportData: MigrationExportData = {
    userId,
    email: 'user@example.com', // 如果有邮箱系统可以获取
    exportDate: new Date().toISOString(),
    data: {
      history,
      customStyles,
      settings,
    },
    format: 'json',
    downloadUrl: '', // 将由调用方生成
  }

  return exportData
}

/**
 * 生成导出文件的 Blob URL
 */
export function generateDownloadUrl(data: MigrationExportData): string {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  return URL.createObjectURL(blob)
}

/**
 * 触发下载
 */
export function triggerDownload(url: string, filename?: string): void {
  const a = document.createElement('a')
  a.href = url
  a.download = filename || `contentcraft-export-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

/**
 * 迁移到免费版
 *
 * 清理所有许可证相关的存储数据，保留用户数据。
 * 在扩展启动时调用，确保从旧版本平滑过渡到免费版。
 */
export async function migrateToFreeVersion(): Promise<void> {
  try {
    // 获取当前迁移状态
    const migrationResult = await chrome.storage.local.get('free_version_migrated')
    if (migrationResult.free_version_migrated) {
      console.log('[Migration] 已迁移到免费版，跳过')
      return
    }

    console.log('[Migration] 开始迁移到免费版...')

    // 要删除的许可证相关键
    const licenseKeysToRemove = [
      'user_tier',
      'license_key',
      'license_verified',
      'license_expires_at',
      'activation_code',
      'device_fingerprint',
      'quota_daily',
      'quota_monthly',
      'quota_reset_daily',
      'quota_reset_monthly',
      'proxyApiKeys',
      'current_user_id',
      'auth_token',
      'refresh_token',
      'subscription_id',
      'subscription_status',
      'premium_enabled',
    ]

    // 删除许可证相关的存储数据
    await chrome.storage.local.remove(licenseKeysToRemove)

    // 标记为已迁移
    await chrome.storage.local.set({ free_version_migrated: true })

    console.log('[Migration] 迁移完成，已清理许可证数据')
  } catch (error) {
    console.error('[Migration] 迁移失败:', error)
  }
}
