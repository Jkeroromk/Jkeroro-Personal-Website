#!/usr/bin/env node

/**
 * 跨平台构建脚本
 * 替代 package.json 中的复杂命令链
 */

const { execSync } = require('child_process')
const path = require('path')

function runCommand(command, description) {
  console.log(`\n📦 ${description}`)
  try {
    execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd(),
      env: process.env
    })
    console.log(`✅ ${description} 完成`)
    return true
  } catch (error) {
    console.error(`❌ ${description} 失败:`, error.message)
    return false
  }
}

async function main() {
  console.log('🚀 开始构建...\n')

  // 1. 检查并生成 Prisma Client
  const checkAccelerateSuccess = runCommand(
    'node scripts/check-accelerate.js',
    '检查 Prisma Accelerate 并生成 Prisma Client'
  )

  if (!checkAccelerateSuccess) {
    console.error('❌ Prisma Client 生成失败，构建中止')
    process.exit(1)
  }

  // 2. 运行数据库迁移（可选，失败时继续）
  console.log('\n📦 运行数据库迁移...')
  try {
    runCommand(
      'node scripts/run-with-ssl.js prisma migrate deploy',
      '数据库迁移'
    )
  } catch (error) {
    console.log('⚠️  迁移跳过（可能已经应用或数据库暂时不可用）')
    console.log('   构建将继续...')
  }

  // 3. 构建 Next.js 应用
  const buildSuccess = runCommand(
    'next build',
    '构建 Next.js 应用'
  )

  if (!buildSuccess) {
    console.error('❌ Next.js 构建失败')
    process.exit(1)
  }

  console.log('\n✅ 构建完成！')
}

main().catch((error) => {
  console.error('❌ 构建脚本执行失败:', error)
  process.exit(1)
})

