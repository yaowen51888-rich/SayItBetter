/**
 * Vite 插件：修复 service worker 环境下的 preload-helper
 */

export function fixServiceWorkerPreloadHelper() {
  return {
    name: 'fix-service-worker-preload-helper',
    enforce: 'post',

    transform(code, id) {
      if (!id.includes('background/index')) {
        return null
      }

      if (code.includes('from"./preload-helper')) {
        console.log('Fixing preload-helper in:', id.split('/').pop())

        // 移除 preload-helper 导入
        let fixed = code.replace(/import\{_\s*as\s*\w+\}\s*from\s*"\.\/preload-helper[^"]*";\s*/g, '')

        // 移除对 _ 函数的使用，直接使用 import
        fixed = fixed.replace(/\$1\(/g, 'import(')

        return { code: fixed }
      }

      return null
    },
  }
}
