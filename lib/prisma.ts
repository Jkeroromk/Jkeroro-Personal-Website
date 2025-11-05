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
// 如果使用 pooler，自动转换为直连（在 Vercel 等部署环境中更稳定）
// 这需要在创建 Prisma 客户端之前执行
if (typeof window === 'undefined') {
  let databaseUrl = process.env.DATABASE_URL
  
  if (databaseUrl) {
    // 如果使用 pooler，尝试转换为直连
    // Pooler: aws-1-us-east-1.pooler.supabase.com
    // Direct: db.{project-ref}.supabase.co
    if (databaseUrl.includes('.pooler.supabase.com')) {
      // 尝试从 pooler URL 提取 project-ref
      // 或者使用环境变量 DIRECT_DATABASE_URL（如果已设置）
      const directUrl = process.env.DIRECT_DATABASE_URL
      
      if (directUrl) {
        console.log('🔄 使用直连数据库 URL (DIRECT_DATABASE_URL)')
        databaseUrl = directUrl
      } else {
        // 尝试从 pooler URL 提取并转换
        // 例如: aws-1-us-east-1.pooler.supabase.com -> db.xxx.supabase.co
        // 注意：这需要知道 project-ref，如果无法提取，保持原样
        const poolerMatch = databaseUrl.match(/@([^.]+)\.pooler\.supabase\.com/)
        if (poolerMatch) {
          // 如果 pooler URL 格式是 aws-1-us-east-1，我们需要 project-ref
          // 但通常 pooler URL 不包含 project-ref，所以我们需要从其他地方获取
          // 暂时保持原样，建议使用 DIRECT_DATABASE_URL 环境变量
          console.warn('⚠️  检测到 pooler URL，建议使用 DIRECT_DATABASE_URL 环境变量设置直连 URL')
        }
      }
    }
    
    // 确保包含 SSL 配置
    if (!databaseUrl.includes('sslmode=')) {
      const separator = databaseUrl.includes('?') ? '&' : '?'
      databaseUrl = `${databaseUrl}${separator}sslmode=require`
    }
    
    process.env.DATABASE_URL = databaseUrl
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

