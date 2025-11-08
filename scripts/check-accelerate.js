#!/usr/bin/env node

/**
 * 检查是否使用 Prisma Accelerate，并相应地生成 Prisma Client
 * - 如果使用 prisma:// 协议，使用 --no-engine
 * - 否则，生成完整的引擎文件
 */

const { execSync } = require('child_process')

// 获取数据库 URL
const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_POOLER_URL

// 检查是否使用 Accelerate
const isAccelerate = databaseUrl?.startsWith('prisma://')

if (isAccelerate) {
  console.log('✅ 检测到 Prisma Accelerate 连接，使用 --no-engine 生成')
  console.log('   DATABASE_URL:', databaseUrl.replace(/:[^:@]+@/, ':****@'))
  try {
    execSync('prisma generate --no-engine', { stdio: 'inherit' })
  } catch (error) {
    console.error('❌ Prisma generate 失败:', error.message)
    process.exit(1)
  }
} else {
  console.log('✅ 使用标准数据库连接，生成完整引擎文件')
  if (databaseUrl) {
    console.log('   DATABASE_URL:', databaseUrl.replace(/:[^:@]+@/, ':****@'))
  }
  try {
    execSync('prisma generate', { stdio: 'inherit' })
  } catch (error) {
    console.error('❌ Prisma generate 失败:', error.message)
    process.exit(1)
  }
}

