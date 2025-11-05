import { PrismaClient } from './generated/prisma/client'

// 全局 Prisma 客户端实例（单例模式）
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// 确保 DATABASE_URL 包含 SSL 配置（针对 Supabase）
const ensureSSLConfig = () => {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) return

  // 如果 URL 中还没有 SSL 参数，添加它
  // Supabase 需要 SSL 连接
  // 对于 pooler 连接，使用 sslmode=require
  // 对于 direct 连接，可以使用 sslmode=require 或 sslmode=no-verify
  if (!databaseUrl.includes('sslmode=')) {
    const separator = databaseUrl.includes('?') ? '&' : '?'
    // 对于 pooler 和 direct 连接，都使用 sslmode=require
    process.env.DATABASE_URL = `${databaseUrl}${separator}sslmode=require`
  }
}

// 在服务器端确保 SSL 配置
if (typeof window === 'undefined') {
  ensureSSLConfig()
}

// 创建 Prisma 客户端实例
// 在开发环境中，每次重新加载时创建新实例
// 在生产环境中，重用全局实例以避免连接池耗尽
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // 开发模式下只记录错误和警告，不记录所有查询（减少日志噪音）
    log: process.env.NODE_ENV === 'development' 
      ? ['error', 'warn'] 
      : ['error'],
    // 添加连接池配置
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

// 测试 Prisma 连接（仅在服务器端）
if (typeof window === 'undefined') {
  // 异步测试连接，不阻塞启动
  prisma.$connect()
    .then(() => {
      console.log('[Prisma] Database connection established')
    })
    .catch((error) => {
      console.error('[Prisma] Failed to connect to database:', error)
      // 记录详细错误信息
      if (error instanceof Error) {
        console.error('[Prisma] Error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack,
          isPrismaError: error.message.includes('Prisma') || error.message.includes('Query Engine'),
        })
      }
    })
}

// 在开发环境中，将实例保存到全局变量
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// 导出 Prisma 客户端
export default prisma

