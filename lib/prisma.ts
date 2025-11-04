import { PrismaClient } from './generated/prisma/client'

// 全局 Prisma 客户端实例（单例模式）
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
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
  })

// 在开发环境中，将实例保存到全局变量
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// 导出 Prisma 客户端
export default prisma

