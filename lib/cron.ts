/**
 * Vercel Cron 定时任务的公用部分。
 * Vercel 调用定时任务时会带上 Authorization: Bearer <CRON_SECRET>（需要在 Vercel 环境变量里设置 CRON_SECRET），
 * 这样别人直接访问这些接口不会触发任务。
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export function verifyCron(request: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('CRON_SECRET is not set; refusing to run cron job')
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 500 })
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

export async function recordRun(job: string, ok: boolean, result: Record<string, unknown>) {
  try {
    // 经过一次 JSON 序列化，保证存进去的是纯 JSON
    await prisma.cronRun.create({ data: { job, ok, result: JSON.parse(JSON.stringify(result)) } })
  } catch (error) {
    console.error(`Failed to record cron run (${job}):`, error)
  }
}
