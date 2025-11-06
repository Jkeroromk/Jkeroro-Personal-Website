import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * 测试 Prisma 和 Supabase 数据库连接
 * 访问: /api/test-connection
 */
interface TestResult {
  name: string
  status: 'passed' | 'failed'
  message: string
  error?: string
  data?: unknown
}

interface ConnectionResults {
  timestamp: string
  connection: {
    status: string
    databaseUrl: string
    isAccelerate: boolean
  }
  tests: TestResult[]
  summary: {
    passed: number
    failed: number
    total: number
  }
}

export async function GET() {
  const results: ConnectionResults = {
    timestamp: new Date().toISOString(),
    connection: {
      status: 'unknown',
      databaseUrl: process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@') || 'not set',
      isAccelerate: process.env.DATABASE_URL?.startsWith('prisma+') || false,
    },
    tests: [],
    summary: {
      passed: 0,
      failed: 0,
      total: 0,
    },
  }

  // 测试 1: 基本连接
  try {
    await prisma.$queryRaw`SELECT 1 as test`
    results.tests.push({
      name: '基本数据库连接',
      status: 'passed',
      message: '✅ 数据库连接成功',
    })
    results.summary.passed++
    results.connection.status = 'connected'
  } catch (error) {
    results.tests.push({
      name: '基本数据库连接',
      status: 'failed',
      message: `❌ 连接失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    results.summary.failed++
    results.connection.status = 'failed'
  }
  results.summary.total++

  // 测试 2: 查询数据库信息
  try {
    const dbInfo = await prisma.$queryRaw<Array<{ current_database: string; version: string }>>`
      SELECT current_database(), version()
    `
    results.tests.push({
      name: '查询数据库信息',
      status: 'passed',
      message: `✅ 数据库: ${dbInfo[0]?.current_database || 'N/A'}`,
      data: {
        database: dbInfo[0]?.current_database,
        version: dbInfo[0]?.version?.substring(0, 50),
      },
    })
    results.summary.passed++
  } catch (error) {
    results.tests.push({
      name: '查询数据库信息',
      status: 'failed',
      message: `❌ 查询失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    results.summary.failed++
  }
  results.summary.total++

  // 测试 3: 检查表
  try {
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `
    results.tests.push({
      name: '检查数据库表',
      status: 'passed',
      message: `✅ 找到 ${tables.length} 个表`,
      data: {
        tableCount: tables.length,
        tables: tables.map(t => t.tablename),
      },
    })
    results.summary.passed++
  } catch (error) {
    results.tests.push({
      name: '检查数据库表',
      status: 'failed',
      message: `❌ 查询失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    results.summary.failed++
  }
  results.summary.total++

  // 测试 4: 查询 view_count
  try {
    const viewCount = await prisma.viewCount.findUnique({
      where: { id: 'main' },
    })
    results.tests.push({
      name: '查询 view_count 表',
      status: 'passed',
      message: viewCount 
        ? `✅ 找到记录: count = ${viewCount.count}`
        : '⚠️  表存在但没有 id="main" 的记录',
      data: viewCount,
    })
    results.summary.passed++
  } catch (error) {
    results.tests.push({
      name: '查询 view_count 表',
      status: 'failed',
      message: `❌ 查询失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    results.summary.failed++
  }
  results.summary.total++

  // 测试 5: 查询 comments
  try {
    const commentCount = await prisma.comment.count()
    const comments = commentCount > 0 
      ? await prisma.comment.findMany({
          take: 3,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            text: true,
            likes: true,
            createdAt: true,
          },
        })
      : []
    
    results.tests.push({
      name: '查询 comments 表',
      status: 'passed',
      message: `✅ 找到 ${commentCount} 条评论`,
      data: {
        count: commentCount,
        sample: comments,
      },
    })
    results.summary.passed++
  } catch (error) {
    results.tests.push({
      name: '查询 comments 表',
      status: 'failed',
      message: `❌ 查询失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    results.summary.failed++
  }
  results.summary.total++

  // 测试 6: 原始 SQL 查询（对比）
  try {
    const rawComments = await prisma.$queryRaw<Array<{ id: string; text: string; likes: number }>>`
      SELECT id, text, likes 
      FROM comments 
      ORDER BY created_at DESC 
      LIMIT 3
    `
    results.tests.push({
      name: '原始 SQL 查询 comments',
      status: 'passed',
      message: `✅ 原始 SQL 查询成功，返回 ${rawComments.length} 条记录`,
      data: {
        count: rawComments.length,
        sample: rawComments,
      },
    })
    results.summary.passed++
  } catch (error) {
    results.tests.push({
      name: '原始 SQL 查询 comments',
      status: 'failed',
      message: `❌ 查询失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    results.summary.failed++
  }
  results.summary.total++

  // 返回结果
  const allPassed = results.summary.failed === 0
  return NextResponse.json(results, {
    status: allPassed ? 200 : 500,
  })
}

