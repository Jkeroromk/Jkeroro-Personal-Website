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

// 根据环境自动切换数据库连接（运行时）
// - 本地开发：使用 direct 连接（5432端口）
// - Vercel 部署：使用 pooler 连接（6543端口 + pgbouncer=true）
// 注意：prisma.config.ts 已处理 Prisma CLI 的切换，这里是运行时切换
if (typeof window === 'undefined') {
  const isProd = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production'
  
  // 根据环境选择数据库 URL（与 prisma.config.ts 逻辑一致）
  let databaseUrl = isProd
    ? process.env.SUPABASE_POOLER_URL || process.env.DATABASE_URL
    : process.env.DATABASE_URL
  
  if (databaseUrl) {
    // 确保包含 SSL 配置
    if (!databaseUrl.includes('sslmode=')) {
      const separator = databaseUrl.includes('?') ? '&' : '?'
      databaseUrl = `${databaseUrl}${separator}sslmode=require`
    }
    
    process.env.DATABASE_URL = databaseUrl
    
    if (isProd) {
      console.log('🔄 [Vercel] 使用 Pooler 连接 (6543端口)')
    } else {
      console.log('🔄 [Local] 使用直连数据库连接 (5432端口)')
    }
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

