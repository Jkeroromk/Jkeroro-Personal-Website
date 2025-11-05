#!/usr/bin/env node

// 包装脚本：确保 DATABASE_URL 包含 SSL 配置后运行命令
const { spawn } = require('child_process')

// 确保 DATABASE_URL 包含 SSL 配置
const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('❌ DATABASE_URL environment variable is not set')
  process.exit(1)
}

let modifiedUrl = databaseUrl
if (!databaseUrl.includes('sslmode=')) {
  const separator = databaseUrl.includes('?') ? '&' : '?'
  modifiedUrl = `${databaseUrl}${separator}sslmode=require`
  console.log('✅ Added sslmode=require to DATABASE_URL')
  console.log('   Original URL:', databaseUrl.replace(/:[^:@]+@/, ':****@'))
} else {
  console.log('✅ DATABASE_URL already contains sslmode parameter')
}

// 更新环境变量
process.env.DATABASE_URL = modifiedUrl

// 获取要运行的命令（第一个参数后的所有参数）
const command = process.argv[2]
const args = process.argv.slice(3)

if (!command) {
  console.error('Usage: node run-with-ssl.js <command> [args...]')
  process.exit(1)
}

// 构建完整命令
const fullCommand = args.length > 0 ? `${command} ${args.join(' ')}` : command
console.log(`🚀 Running: ${fullCommand}`)
console.log(`🔐 Using DATABASE_URL with sslmode=require`)

// 创建新的环境变量对象，确保 DATABASE_URL 被正确设置
const env = {
  ...process.env,
  DATABASE_URL: modifiedUrl, // 确保环境变量被传递
}

// 运行命令（使用 shell 来支持 npx 和直接命令）
const child = spawn(fullCommand, {
  stdio: 'inherit',
  shell: true,
  env: env,
})

child.on('close', (code) => {
  process.exit(code || 0)
})

child.on('error', (error) => {
  console.error('Error running command:', error)
  process.exit(1)
})

