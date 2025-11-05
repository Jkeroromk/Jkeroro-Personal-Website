import { PrismaClient } from './generated/prisma/client'
import { join } from 'path'
import { existsSync, copyFileSync } from 'fs'

// 全局 Prisma 客户端实例（单例模式）
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// 在 Vercel 上，需要指定 engine 路径
const getPrismaEnginePath = () => {
  // 只在生产环境或 Vercel 上运行（避免在 Windows 本地开发时出错）
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    // 根据错误信息，Vercel 在以下位置查找：
    // - /var/task/.next/server/chunks
    // - /vercel/path0/lib/generated/prisma
    // - /vercel/path0/.prisma/client
    // - /tmp/prisma-engines
    
    const engineFile = 'libquery_engine-rhel-openssl-3.0.x.so.node'
    const cwd = process.cwd()
    
    // 可能的路径（根据 Vercel 错误信息）
    const possiblePaths = [
      // Vercel 绝对路径
      '/var/task/.next/server/chunks/' + engineFile,
      '/var/task/lib/generated/prisma/' + engineFile,
      '/var/task/.prisma/client/' + engineFile,
      // 相对路径（可能的工作目录）
      join(cwd, '.next/server/chunks', engineFile),
      join(cwd, 'lib/generated/prisma', engineFile),
      join(cwd, '.prisma/client', engineFile),
      join(cwd, 'node_modules/.prisma/client', engineFile),
      // /tmp 路径（Vercel 允许写入）
      '/tmp/' + engineFile,
      '/tmp/prisma-engines/' + engineFile,
    ]
    
    // 查找 engine 文件
    let foundPath: string | null = null
    for (const enginePath of possiblePaths) {
      try {
        if (existsSync(enginePath)) {
          foundPath = enginePath
          process.env.PRISMA_QUERY_ENGINE_LIBRARY = enginePath
          process.env.PRISMA_QUERY_ENGINE_BINARY = enginePath
          console.log(`[Prisma] Found engine at: ${enginePath}`)
          break
        }
      } catch {
        // 忽略错误，继续查找
      }
    }
    
    // 如果没找到，尝试从已知源位置复制到 /tmp
    if (!foundPath) {
      const sourcePaths = [
        join(cwd, 'lib/generated/prisma', engineFile),
        join(cwd, '.next/server/chunks', engineFile),
        '/var/task/lib/generated/prisma/' + engineFile,
      ]
      
      const tmpPath = '/tmp/' + engineFile
      for (const sourcePath of sourcePaths) {
        try {
          if (existsSync(sourcePath)) {
            copyFileSync(sourcePath, tmpPath)
            process.env.PRISMA_QUERY_ENGINE_LIBRARY = tmpPath
            process.env.PRISMA_QUERY_ENGINE_BINARY = tmpPath
            console.log(`[Prisma] Copied engine to /tmp from: ${sourcePath}`)
            foundPath = tmpPath
            break
          }
        } catch {
          // 忽略错误，继续尝试
        }
      }
    }
    
    if (!foundPath) {
      console.warn('[Prisma] Warning: Engine file not found. Prisma may fail to initialize.')
    }
  }
}

// 在创建客户端之前设置路径（只在服务器端）
if (typeof window === 'undefined') {
  getPrismaEnginePath()
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
  })

// 在开发环境中，将实例保存到全局变量
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// 导出 Prisma 客户端
export default prisma

