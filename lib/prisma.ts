// @ts-expect-error - Prisma client will be generated during build
import { PrismaClient } from './generated/prisma/client'
import { join } from 'path'
import { existsSync } from 'fs'

// 全局 Prisma 客户端实例（单例模式）
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// 在 Vercel 上设置 Prisma Engine 路径
if (typeof window === 'undefined' && (process.env.NODE_ENV === 'production' || process.env.VERCEL)) {
  const engineFile = 'libquery_engine-rhel-openssl-3.0.x.so.node'
  const cwd = process.cwd()
  
  // Vercel 查找的路径
  const possiblePaths = [
    join(cwd, '.next/server/chunks', engineFile),
    join(cwd, 'lib/generated/prisma', engineFile),
    join(cwd, '.prisma/client', engineFile),
    '/var/task/.next/server/chunks/' + engineFile,
    '/var/task/lib/generated/prisma/' + engineFile,
  ]
  
  for (const enginePath of possiblePaths) {
    if (existsSync(enginePath)) {
      process.env.PRISMA_QUERY_ENGINE_LIBRARY = enginePath
      process.env.PRISMA_QUERY_ENGINE_BINARY = enginePath
      break
    }
  }
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

