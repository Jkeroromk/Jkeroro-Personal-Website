import { NextRequest, NextResponse } from 'next/server'
import { verifyCron, recordRun } from '@/lib/cron'
import { previousMonthKey, saveReport } from '@/lib/monthly-report'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// 每月 1 号（vercel.json）生成上个月的月报，存进 monthly_reports，后台 Monthly Report 页面看
export async function GET(request: NextRequest) {
  const authError = verifyCron(request)
  if (authError) return authError

  const month = previousMonthKey(new Date())
  try {
    const report = await saveReport(month)
    await recordRun('monthly-report', true, { month, views: report.views, comments: report.comments.new })
    return NextResponse.json({ month, ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Cron monthly report error:', error)
    await recordRun('monthly-report', false, { month, error: message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
