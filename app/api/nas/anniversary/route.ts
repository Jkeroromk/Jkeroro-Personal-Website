import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireNasToken, storeNasPhoto, nasErrorResponse, isNasUrl } from '@/lib/nas-sync'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

type Positions = Record<string, { x: number; y: number }>

async function readSettings() {
  const s = await prisma.anniversarySettings.findUnique({ where: { id: 'main' } })
  const images: string[] = Array.isArray(s?.backgroundImages) ? (s!.backgroundImages as string[]) : []
  const positions: Positions = s?.imagePositions && typeof s.imagePositions === 'object'
    ? { ...(s.imagePositions as Positions) }
    : {}
  return { images, positions }
}

async function writeSettings(images: string[], positions: Positions) {
  await prisma.anniversarySettings.upsert({
    where: { id: 'main' },
    update: { backgroundImages: images, imagePositions: positions },
    create: { id: 'main', backgroundImages: images, imagePositions: positions },
  })
}

// 纪念日轮播里由 NAS 管的那些照片（后台手动传的不在里面，NAS 也不会动它们）
export async function GET(request: NextRequest) {
  const authError = requireNasToken(request)
  if (authError) return authError
  const { images } = await readSettings()
  return NextResponse.json({ urls: images.filter(isNasUrl) })
}

// NAS 文件夹里新加的照片 → 加进轮播（同一张已经在里面就不重复加）
export async function POST(request: NextRequest) {
  const authError = requireNasToken(request)
  if (authError) return authError
  try {
    const { url } = await storeNasPhoto(await request.formData())
    const { images, positions } = await readSettings()
    if (!images.includes(url)) {
      images.push(url)
      positions[url] = positions[url] || { x: 50, y: 50 }
      await writeSettings(images, positions)
    }
    return NextResponse.json({ ok: true, url })
  } catch (err) {
    return nasErrorResponse(err)
  }
}

// NAS 文件夹里删掉的照片 → 从轮播里移除（只会移除 NAS 推上来的那些）
export async function DELETE(request: NextRequest) {
  const authError = requireNasToken(request)
  if (authError) return authError
  const { urls } = await request.json().catch(() => ({ urls: [] }))
  const remove = new Set((Array.isArray(urls) ? urls : []).filter((u: unknown): u is string => typeof u === 'string' && isNasUrl(u)))
  if (!remove.size) return NextResponse.json({ ok: true, removed: 0 })
  const { images, positions } = await readSettings()
  const next = images.filter((u) => !remove.has(u))
  for (const u of remove) delete positions[u]
  await writeSettings(next, positions)
  return NextResponse.json({ ok: true, removed: images.length - next.length })
}
