import { NextRequest, NextResponse } from 'next/server'
import { verifyCron, recordRun } from '@/lib/cron'
import { prisma } from '@/lib/prisma'
import { isAlbumTarget, syncAlbum } from '@/lib/album-sync'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// 每天把接好的 iCloud 共享相簿同步一次（vercel.json 里配的时间）
export async function GET(request: NextRequest) {
  const authError = verifyCron(request)
  if (authError) return authError

  const sources = await prisma.albumSource.findMany({ where: { enabled: true }, select: { id: true } })
  const results: Record<string, unknown> = {}
  let ok = true
  for (const { id } of sources) {
    if (!isAlbumTarget(id)) continue
    try {
      results[id] = await syncAlbum(id)
    } catch (err) {
      ok = false
      results[id] = { error: err instanceof Error ? err.message : String(err) }
    }
  }
  await recordRun('album-sync', ok, results)
  return NextResponse.json(results, { status: ok ? 200 : 500 })
}
