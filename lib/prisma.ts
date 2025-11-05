import { PrismaClient } from './generated/prisma/client'

// 全局 Prisma 客户端实例（单例模式）
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// 确保 DATABASE_URL 包含 SSL 配置（针对 Supabase）
// 这需要在创建 Prisma 客户端之前执行
if (typeof window === 'undefined') {
  const databaseUrl = process.env.DATABASE_URL
  if (databaseUrl && !databaseUrl.includes('sslmode=')) {
    const separator = databaseUrl.includes('?') ? '&' : '?'
    process.env.DATABASE_URL = `${databaseUrl}${separator}sslmode=require`
  }
}

// 创建 Prisma 客户端实例
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error'] : ['error'],
  })

// 在开发环境中，将实例保存到全局变量
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// 导出 Prisma 客户端
export default prisma

