import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * 禁用 comments 表的行级安全（RLS）
 * 访问: POST /api/admin/disable-rls
 */
export async function POST() {
  try {
    // 使用原始 SQL 执行 ALTER TABLE 命令
    await prisma.$executeRaw`ALTER TABLE "comments" DISABLE ROW LEVEL SECURITY`
    
    return NextResponse.json({
      success: true,
      message: '✅ comments 表的行级安全（RLS）已禁用',
    })
  } catch (error) {
    console.error('禁用 RLS 失败:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: '❌ 禁用 RLS 失败',
      },
      { status: 500 }
    )
  }
}

/**
 * 检查 comments 表的 RLS 状态
 * 访问: GET /api/admin/disable-rls
 */
export async function GET() {
  try {
    // 查询 RLS 状态
    const result = await prisma.$queryRaw<Array<{ tablename: string; rowsecurity: boolean }>>`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' AND tablename = 'comments'
    `
    
    const rlsStatus = result[0]?.rowsecurity ?? null
    
    return NextResponse.json({
      success: true,
      table: 'comments',
      rlsEnabled: rlsStatus === true,
      rlsDisabled: rlsStatus === false,
      message: rlsStatus === false 
        ? '✅ RLS 已禁用'
        : rlsStatus === true
        ? '⚠️  RLS 已启用'
        : '❓ 无法确定 RLS 状态',
    })
  } catch (error) {
    console.error('查询 RLS 状态失败:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: '❌ 查询 RLS 状态失败',
      },
      { status: 500 }
    )
  }
}

