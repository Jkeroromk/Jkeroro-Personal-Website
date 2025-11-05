import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 诊断数据库连接状态
export async function GET() {
  try {
    // 检查环境变量（不暴露敏感信息）
    const databaseUrl = process.env.DATABASE_URL
    const hasDatabaseUrl = !!databaseUrl
    const databaseUrlPreview = hasDatabaseUrl && databaseUrl
      ? databaseUrl.replace(/:[^:@]+@/, ':****@') // 隐藏密码
      : null

    // 测试数据库连接
    let connectionTest = {
      success: false,
      error: null as string | null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      details: null as any,
    }

    try {
      // 尝试执行简单查询
      const result = await prisma.$queryRaw`SELECT 1 as test`
      connectionTest = {
        success: true,
        error: null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        details: result as any,
      }
    } catch (error) {
      connectionTest = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : null,
      }
    }

    // 检查表是否存在
    let tablesCheck = {
      success: false,
      tables: [] as string[],
      error: null as string | null,
    }

    try {
      const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY tablename
      `
      tablesCheck = {
        success: true,
        tables: tables.map(t => t.tablename),
        error: null,
      }
    } catch (error) {
      tablesCheck = {
        success: false,
        tables: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }

    // 检查数据数量
    let dataCounts = {
      images: 0,
      tracks: 0,
      projects: 0,
      comments: 0,
      error: null as string | null,
    }

    try {
      dataCounts = {
        images: await prisma.image.count(),
        tracks: await prisma.track.count(),
        projects: await prisma.project.count(),
        comments: await prisma.comment.count(),
        error: null,
      }
    } catch (error) {
      dataCounts = {
        images: 0,
        tracks: 0,
        projects: 0,
        comments: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }

    // 获取数据库信息
    let databaseInfo = null
    try {
      const dbInfo = await prisma.$queryRaw<Array<{ current_database: string }>>`
        SELECT current_database()
      `
      if (dbInfo.length > 0) {
        databaseInfo = {
          name: dbInfo[0].current_database,
        }
      }
    } catch {
      // 忽略错误
    }

    return NextResponse.json({
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasDatabaseUrl: hasDatabaseUrl,
        databaseUrlPreview: databaseUrlPreview,
        databaseUrlLength: hasDatabaseUrl && databaseUrl ? databaseUrl.length : 0,
      },
      connection: connectionTest,
      database: databaseInfo,
      tables: tablesCheck,
      dataCounts: dataCounts,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to check database status',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

