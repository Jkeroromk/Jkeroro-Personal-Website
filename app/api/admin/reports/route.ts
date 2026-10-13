import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/requireAuth'
import { prisma } from '@/lib/prisma'
import { buildReport, monthKey } from '@/lib/monthly-report'

export const dynamic = 'force-dynamic'

// 后台 Monthly Report：本月至今（实时算）+ 历史月报（每月 1 号存的）+ 最近的定时任务记录
export async function GET(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError
  try {
    const [current, reports, runs] = await Promise.all([
      buildReport(monthKey(new Date()), true),
      prisma.monthlyReport.findMany({ orderBy: { month: 'desc' }, take: 24 }),
      prisma.cronRun.findMany({ orderBy: { ranAt: 'desc' }, take: 10 }),
    ])
    return NextResponse.json({
      current,
      reports: reports.map((r) => r.data),
      runs: runs.map(({ job, ok, result, ranAt }) => ({ job, ok, result, ranAt })),
    })
  } catch (error) {
    console.error('Load reports error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load reports' },
      { status: 500 }
    )
  }
}
