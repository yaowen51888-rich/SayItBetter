/**
 * 构建后处理脚本：修复 preload-helper 在 service worker 中的问题
 */

const fs = require('fs')
const path = require('path')

function fixPreloadHelperInDist() {
  const distPath = path.resolve(process.cwd(), 'dist/assets')
  const bgScriptPattern = /index\.ts-[a-zA-Z0-9_-]+\.js/

  const files = fs.readdirSync(distPath)

  // 找到所有匹配的文件，选择最大的（background script 通常最大）
  const bgScriptFiles = files.filter(f => bgScriptPattern.test(f) && f.includes('index.ts-') && !f.includes('loader'))

  if (bgScriptFiles.length === 0) {
    console.log('未找到 background script 文件')
    return
  }

  // 选择文件大小最大的作为 background script（排除 loader 文件）
  const bgScriptFile = bgScriptFiles.reduce((largest, current) => {
    const currentPath = path.join(distPath, current)
    const largestPath = path.join(distPath, largest)
    const currentSize = fs.statSync(currentPath).size
    const largestSize = fs.statSync(largestPath).size
    return currentSize > largestSize ? current : largest
  })

  const bgScriptPath = path.join(distPath, bgScriptFile)
  console.log(`🔧 处理文件: ${bgScriptFile} (${(fs.statSync(bgScriptPath).size / 1024).toFixed(2)} KB)`)

  let content = fs.readFileSync(bgScriptPath, 'utf-8')

  // 移除 preload-helper 导入
  const importRegex = /import\{_\s*as\s*\w+\}\s*from\s*"\.\/preload-helper[^"]*";?\s*/g
  const before = content.length
  content = content.replace(importRegex, '')
  const after = content.length

  if (before !== after) {
    console.log('✅ 已移除 preload-helper 导入')
  } else {
    console.log('ℹ️  未找到 preload-helper 导入（可能已移除）')
  }

  fs.writeFileSync(bgScriptPath, content, 'utf-8')
}

fixPreloadHelperInDist()
