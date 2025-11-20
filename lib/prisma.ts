import { PrismaClient } from './generated/prisma/client'
import { join } from 'path'
import { existsSync } from 'fs'

// 导入 Prisma Accelerate 扩展
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let withAccelerate: ((client: any) => any) | null = null
try {
  // 使用 ES6 import 方式导入（符合文档建议）
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { withAccelerate: accelerateExtension } = require('@prisma/extension-accelerate')
  withAccelerate = accelerateExtension
} catch {
  // Accelerate 扩展未安装，将使用标准连接
}

// 全局 Prisma 客户端实例（单例模式）
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// 在 Vercel 上设置 Prisma Engine 路径（仅在非 Accelerate 模式下）
// 如果使用 Prisma Accelerate (prisma:// 协议)，不需要引擎文件
if (typeof window === 'undefined' && (process.env.NODE_ENV === 'production' || process.env.VERCEL)) {
  // 检查是否使用 Accelerate（优先检查 DATABASE_URL，因为它可能包含 Accelerate URL）
  const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_POOLER_URL
  const isAccelerate = databaseUrl?.startsWith('prisma://')
  
  // 只有在非 Accelerate 模式下才查找引擎文件
  if (!isAccelerate) {
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
}

// 根据环境自动切换数据库连接（运行时）
// - 本地开发：使用 direct 连接（5432端口）
// - Vercel 部署：使用 pooler 连接（6543端口 + pgbouncer=true）
// - Prisma Accelerate：使用 prisma:// 协议（不需要 SSL 配置）
// 注意：prisma.config.ts 已处理 Prisma CLI 的切换，这里是运行时切换
if (typeof window === 'undefined') {
  const isProd = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production'
  
  // 根据环境选择数据库 URL（与 prisma.config.ts 逻辑一致）
  // 优先使用 DATABASE_URL（如果它是 Accelerate URL），否则根据环境选择
  let databaseUrl: string | undefined
  if (process.env.DATABASE_URL?.startsWith('prisma://')) {
    // 如果 DATABASE_URL 是 Accelerate URL，优先使用它
    databaseUrl = process.env.DATABASE_URL
  } else if (isProd) {
    // 生产环境：优先使用 SUPABASE_POOLER_URL，否则使用 DATABASE_URL
    databaseUrl = process.env.SUPABASE_POOLER_URL || process.env.DATABASE_URL
  } else {
    // 开发环境：只使用 DATABASE_URL
    databaseUrl = process.env.DATABASE_URL
  }
  
  if (databaseUrl) {
    // Prisma Accelerate 连接（prisma:// 协议）不需要添加 sslmode
    const isAccelerate = databaseUrl.startsWith('prisma://')
    
    if (!isAccelerate) {
      // 对于普通 Supabase 连接，确保包含 SSL 配置
      if (!databaseUrl.includes('sslmode=')) {
        const separator = databaseUrl.includes('?') ? '&' : '?'
        databaseUrl = `${databaseUrl}${separator}sslmode=require`
      }
    }
    
    process.env.DATABASE_URL = databaseUrl
    
    // 连接类型已确定（Accelerate、Pooler 或 Direct）
  }
}

// 创建 Prisma 客户端实例
let prismaClient = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

// 如果安装了 Accelerate 扩展且 DATABASE_URL 使用 prisma:// 协议，则启用 Accelerate
if (withAccelerate && process.env.DATABASE_URL?.startsWith('prisma://')) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prismaClient = prismaClient.$extends(withAccelerate({})) as any
}

export const prisma = globalForPrisma.prisma ?? prismaClient

// 在开发环境中，将实例保存到全局变量
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// 导出 Prisma 客户端
export default prisma

