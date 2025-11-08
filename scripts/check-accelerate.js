#!/usr/bin/env node

/**
 * 检查是否使用 Prisma Accelerate，并相应地生成 Prisma Client
 * - 如果使用 prisma:// 协议，使用 --no-engine
 * - 否则，生成完整的引擎文件
 */

const { execSync } = require('child_process')

try {
  // 获取数据库 URL
  const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_POOLER_URL

  // 检查是否使用 Accelerate
  const isAccelerate = databaseUrl?.startsWith('prisma://')

  if (isAccelerate) {
    console.log('✅ 检测到 Prisma Accelerate 连接，使用 --no-engine 生成')
    if (databaseUrl) {
      console.log('   DATABASE_URL:', databaseUrl.replace(/:[^:@]+@/, ':****@'))
    }
    try {
      execSync('npx prisma generate --no-engine', { 
        stdio: 'inherit',
        cwd: process.cwd()
      })
      console.log('✅ Prisma Client 生成成功 (--no-engine)')
    } catch (error) {
      console.error('❌ Prisma generate 失败:', error.message)
      if (error.stdout) console.error('stdout:', error.stdout.toString())
      if (error.stderr) console.error('stderr:', error.stderr.toString())
      process.exit(1)
    }
  } else {
    console.log('✅ 使用标准数据库连接，生成完整引擎文件')
    if (databaseUrl) {
      console.log('   DATABASE_URL:', databaseUrl.replace(/:[^:@]+@/, ':****@'))
    } else {
      console.log('   ⚠️  DATABASE_URL 未设置，使用默认配置')
    }
    try {
      execSync('npx prisma generate', { 
        stdio: 'inherit',
        cwd: process.cwd()
      })
      console.log('✅ Prisma Client 生成成功 (完整引擎)')
    } catch (error) {
      console.error('❌ Prisma generate 失败:', error.message)
      if (error.stdout) console.error('stdout:', error.stdout.toString())
      if (error.stderr) console.error('stderr:', error.stderr.toString())
      process.exit(1)
    }
  }
} catch (error) {
  console.error('❌ 脚本执行失败:', error.message)
  console.error(error.stack)
  process.exit(1)
}

