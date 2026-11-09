import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireNasToken, storeNasPhoto, nasErrorResponse, NasError } from '@/lib/nas-sync'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// NAS 每天推一张照片，换掉首页的某一格（target = 那张照片的 id）
// 取景位置回到居中，caption 和顺序不变
export async function POST(request: NextRequest) {
  const authError = requireNasToken(request)
  if (authError) return authError
  try {
    const form = await request.formData()
    const target = String(form.get('target') || '')
    const slot = await prisma.image.findUnique({ where: { id: target }, select: { id: true } }).catch(() => null)
    if (!slot) throw new NasError('target image not found')

    const { url, width, height } = await storeNasPhoto(form)
    const image = await prisma.image.update({
      where: { id: slot.id },
      data: { src: url, width, height, imageOffsetX: 50, imageOffsetY: 50, source: 'nas', rotateRequestedAt: null, rotateBlock: false },
    })
    return NextResponse.json({ ok: true, id: image.id, src: image.src })
  } catch (err) {
    return nasErrorResponse(err)
  }
}
