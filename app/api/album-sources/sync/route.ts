import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/requireAuth'
import { isAlbumTarget, syncAlbum } from '@/lib/album-sync'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// 后台「立即同步」
export async function POST(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError
  const { id } = await request.json().catch(() => ({}))
  if (!isAlbumTarget(id)) return NextResponse.json({ error: 'Invalid target' }, { status: 400 })
  try {
    const result = await syncAlbum(id)
    return NextResponse.json({ ok: true, result })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : '同步失败' }, { status: 500 })
  }
}
