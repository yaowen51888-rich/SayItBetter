const fs = require('fs')
const path = require('path')

const sourceDir = path.resolve(__dirname, '../_locales')
const targetDir = path.resolve(__dirname, '../dist/_locales')

function copyDirectory(src, dest) {
  // 创建目标目录
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true })
  }

  // 读取源目录
  const entries = fs.readdirSync(src, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    if (entry.isDirectory()) {
      // 递归复制子目录
      copyDirectory(srcPath, destPath)
    } else {
      // 复制文件
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

// 执行复制
if (fs.existsSync(sourceDir)) {
  copyDirectory(sourceDir, targetDir)
  console.log('✅ _locales copied to dist/')
} else {
  console.log('⚠️  _locales directory not found')
}
