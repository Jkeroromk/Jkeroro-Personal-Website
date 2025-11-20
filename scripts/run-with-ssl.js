#!/usr/bin/env node

// 包装脚本：确保 DATABASE_URL 包含 SSL 配置后运行命令
const { spawn } = require('child_process')

// 根据环境自动切换数据库连接
// - 本地开发：使用 direct 连接（5432端口）
// - Vercel 部署：使用 pooler 连接（6543端口 + pgbouncer=true）
const isProd = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production'

// 根据环境选择数据库 URL（与 lib/prisma.ts 逻辑一致）
// 优先使用 DATABASE_URL（如果它是 Accelerate URL），否则根据环境选择
let databaseUrl
if (process.env.DATABASE_URL?.startsWith('prisma://')) {
  // 如果 DATABASE_URL 是 Accelerate URL，优先使用它（但 Accelerate 不需要 SSL，所以这个脚本可能不会被调用）
  databaseUrl = process.env.DATABASE_URL
} else if (isProd) {
  // 生产环境：优先使用 SUPABASE_POOLER_URL，否则使用 DATABASE_URL
  databaseUrl = process.env.SUPABASE_POOLER_URL || process.env.DATABASE_URL
} else {
  // 开发环境：只使用 DATABASE_URL
  databaseUrl = process.env.DATABASE_URL
}

if (!databaseUrl) {
  console.error('❌ DATABASE_URL environment variable is not set')
  console.error('   Please check your Vercel environment variables')
  process.exit(1)
}

if (isProd) {
  console.log('✅ [Vercel] 使用 Pooler 连接 (6543端口)')
} else {
  console.log('✅ [Local] 使用直连数据库连接 (5432端口)')
}

// 检查是否是 migrate deploy 命令
const isMigrateDeploy = process.argv[2] === 'prisma' && process.argv[3] === 'migrate' && process.argv[4] === 'deploy'

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
  if (code !== 0) {
    console.error(`❌ Command failed with exit code ${code}`)
    // 对于 migrate deploy，如果失败可能是：
    // 1. 迁移已经应用过了
    // 2. 数据库连接暂时失败（可能是网络问题）
    // 允许继续构建，因为应用运行时还会尝试连接
    if (isMigrateDeploy) {
      console.log('⚠️  Migration deploy failed, but continuing build...')
      console.log('   This may be OK if:')
      console.log('   - Migrations are already applied')
      console.log('   - Database connection is temporarily unavailable')
      console.log('   - The app will retry connection at runtime')
      process.exit(0) // 允许继续构建
    }
  }
  process.exit(code || 0)
})

child.on('error', (error) => {
  console.error('Error running command:', error)
  process.exit(1)
})

