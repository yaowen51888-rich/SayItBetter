/**
 * 构建脚本
 *
 * 执行构建和构建后修复
 */

const { execSync } = require('child_process')

// 主函数
function build() {
  console.log('开始构建...\n')

  try {
    // 执行构建
    execSync('npm run build:raw', {
      stdio: 'inherit',
    })

    console.log('\n✅ 构建成功！')

    // 构建后修复 preload-helper 问题
    console.log('\n正在修复 preload-helper 问题...')
    execSync('node scripts/fix-preload-helper.cjs', {
      stdio: 'inherit',
    })

    console.log('\n✅ 全部完成！')
  } catch (error) {
    console.error('\n❌ 构建失败')
    process.exit(1)
  }
}

build()
