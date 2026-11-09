import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/requireAuth'
import { fetchAlbum, parseShareToken } from '@/lib/icloud-album'
import { isAlbumTarget, syncAlbum, detachSlot } from '@/lib/album-sync'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// 后台用：查看各个位置（纪念日轮播、首页每一格）接了哪个 iCloud 共享相簿、上次同步情况
export async function GET(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError
  const rows = await prisma.albumSource.findMany()
  const out = Object.fromEntries(
    rows.map((r) => [r.id, {
      shareUrl: r.shareUrl,
      albumName: r.albumName,
      enabled: r.enabled,
      lastSyncedAt: r.lastSyncedAt,
      lastResult: r.lastResult,
      lastError: r.lastError,
    }])
  )
  return NextResponse.json(out)
}

// 接一个相簿（或换成另一个）：先读一遍确认链接能用，存下来，然后马上同步第一批
export async function PUT(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError
  const { id, shareUrl } = await request.json().catch(() => ({}))
  if (!isAlbumTarget(id)) return NextResponse.json({ error: 'Invalid target' }, { status: 400 })
  const token = parseShareToken(shareUrl)
  if (!token) {
    return NextResponse.json({ error: '链接不对，应该是 https://www.icloud.com/sharedalbum/#B0... 这样的' }, { status: 400 })
  }

  if (id.startsWith('slot:')) {
    const exists = await prisma.image.findUnique({ where: { id: id.slice(5) }, select: { id: true } })
    if (!exists) return NextResponse.json({ error: '这张照片不存在了' }, { status: 400 })
  }

  let album
  try {
    album = await fetchAlbum(token)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : '读不到这个相簿' }, { status: 400 })
  }

  const existing = await prisma.albumSource.findUnique({ where: { id } })
  const sameAlbum = existing && parseShareToken(existing.shareUrl) === token
  await prisma.albumSource.upsert({
    where: { id },
    // 换了相簿就清空记录（excluded / 映射）；同一个相簿只是重新打开
    update: { shareUrl: shareUrl.trim(), albumName: album.name, enabled: true, lastError: null, ...(sameAlbum ? {} : { items: {} }) },
    create: { id, shareUrl: shareUrl.trim(), albumName: album.name },
  })

  try {
    const result = await syncAlbum(id)
    return NextResponse.json({ ok: true, result })
  } catch (err) {
    // 链接存好了，只是第一次同步没成功，之后每天还会自动重试
    return NextResponse.json({ ok: true, albumName: album.name, syncError: err instanceof Error ? err.message : String(err) })
  }
}

// 断开：之后不再同步。已经在网站上的照片保留，想删可以在后台删
export async function DELETE(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError
  const { id } = await request.json().catch(() => ({}))
  if (!isAlbumTarget(id)) return NextResponse.json({ error: 'Invalid target' }, { status: 400 })
  if (id.startsWith('slot:')) await detachSlot(id.slice(5))
  else await prisma.albumSource.deleteMany({ where: { id } })
  return NextResponse.json({ ok: true })
}
