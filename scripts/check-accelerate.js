#!/usr/bin/env node

/**
 * 检查是否使用 Prisma Accelerate，并相应地生成 Prisma Client
 * - 如果使用 prisma:// 协议，使用 --no-engine
 * - 否则，生成完整的引擎文件
 */

const { execSync } = require('child_process')

// 加载 .env.local 文件（使用 dotenv）
try {
  require('dotenv').config({ path: '.env.local' })
} catch (error) {
  // 如果 dotenv 不可用，尝试手动加载
  try {
    const fs = require('fs')
    const path = require('path')
    const envPath = path.join(process.cwd(), '.env.local')
    if (fs.existsSync(envPath)) {
      const envFile = fs.readFileSync(envPath, 'utf8')
      envFile.split('\n').forEach(line => {
        const trimmedLine = line.trim()
        if (trimmedLine.startsWith('#') || !trimmedLine) return
        const match = trimmedLine.match(/^([^#=]+?)\s*=\s*(.+)$/)
        if (match) {
          const key = match[1].trim()
          let value = match[2].trim()
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1)
          }
          if (!process.env[key]) {
            process.env[key] = value
          }
        }
      })
    }
  } catch (err) {
    console.warn('⚠️  无法加载 .env.local:', err.message)
  }
}

try {
  // 获取数据库 URL（优先使用 DATABASE_URL，因为它可能包含 Accelerate URL）
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

