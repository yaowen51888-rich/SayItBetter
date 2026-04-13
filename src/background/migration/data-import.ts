import type { MigrationImportPlan, MigrationExportData } from './types'
import { STORAGE_KEYS } from '../../shared/constants'
import type { HistoryItem } from '../../shared/types'

/**
 * 导入用户数据
 *
 * 从导出的 JSON 文件中导入数据到本地存储。
 */
export async function importUserData(
  exportData: MigrationExportData,
  plan: MigrationImportPlan
): Promise<{ success: boolean; errors: string[]; imported: number }> {
  const errors: string[] = []
  let importedCount = 0

  try {
    // 验证数据完整性
    if (plan.validation.checkIntegrity) {
      if (!exportData.userId || !exportData.data) {
        errors.push('数据格式无效')
        return { success: false, errors, imported: 0 }
      }
    }

    // 导入自定义风格
    if (exportData.data.customStyles && exportData.data.customStyles.length > 0) {
      const maxStyles = plan.validation.maxCustomStyles
      const stylesToImport = exportData.data.customStyles.slice(0, maxStyles)

      await chrome.storage.local.set({
        [STORAGE_KEYS.USER_STYLES]: stylesToImport
      })

      importedCount += stylesToImport.length
    }

    // 导入历史记录
    if (exportData.data.history && exportData.data.history.length > 0) {
      const maxItems = plan.validation.maxHistoryItems
      const historyToImport = exportData.data.history.slice(0, maxItems)

      // 获取现有历史记录
      const result = await chrome.storage.local.get(STORAGE_KEYS.HISTORY)
      const existingHistory: HistoryItem[] = result[STORAGE_KEYS.HISTORY] || []

      // 合并历史记录（去重，基于 timestamp + originalText 内容）
      const existingMap = new Map(
        existingHistory.map(item => [`${item.timestamp}-${item.originalText.substring(0, 50)}`, item])
      )

      let newItems = 0
      for (const item of historyToImport) {
        const key = `${item.timestamp}-${item.originalText.substring(0, 50)}`
        if (!existingMap.has(key)) {
          existingMap.set(key, item)
          newItems++
        }
      }

      // 转换回数组并按时间排序
      const mergedHistory = Array.from(existingMap.values())
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, plan.validation.maxHistoryItems)

      // 存储合并后的历史记录
      await chrome.storage.local.set({ [STORAGE_KEYS.HISTORY]: mergedHistory })

      importedCount += newItems
    }

    // 导入用户设置（可选）
    if (exportData.data.settings && Object.keys(exportData.data.settings).length > 0) {
      const currentSettings = await chrome.storage.local.get(STORAGE_KEYS.USER_SETTINGS)
      const mergedSettings = {
        ...currentSettings[STORAGE_KEYS.USER_SETTINGS] || {},
        ...exportData.data.settings,
      }
      await chrome.storage.local.set({
        [STORAGE_KEYS.USER_SETTINGS]: mergedSettings
      })
    }

    return { success: errors.length === 0, errors, imported: importedCount }
  } catch (error) {
    errors.push(`导入失败: ${String(error)}`)
    return { success: false, errors, imported: importedCount }
  }
}

/**
 * 从 JSON 文件解析导出数据
 */
export async function parseExportFile(file: File): Promise<MigrationExportData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        resolve(data as MigrationExportData)
      } catch (error) {
        reject(new Error('文件格式错误：无法解析 JSON'))
      }
    }

    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsText(file)
  })
}
