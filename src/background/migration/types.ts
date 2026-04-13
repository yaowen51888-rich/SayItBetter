import type { HistoryItem, UserStyle, UserSettings } from '../../shared/types'

/**
 * 迁移导出数据
 */
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

/**
 * 迁移导入计划
 */
export interface MigrationImportPlan {
  targetStorage: {
    history: 'IndexedDB' | 'chrome.storage.local'
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
  includeUsageStats?: boolean
}
