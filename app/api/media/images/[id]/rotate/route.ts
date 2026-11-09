import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/requireAuth'

export const dynamic = 'force-dynamic'

// 后台「换一张」：只做标记，家里 NAS 一分钟内会推一张新的上来
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth(request)
  if (authError) return authError
  const { id } = await params
  const { block } = await request.json().catch(() => ({}))
  const image = await prisma.image.findUnique({ where: { id }, select: { source: true } })
  if (!image) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (image.source !== 'nas') {
    return NextResponse.json({ error: '这一格不是 NAS 管的，用「替换照片」手动换' }, { status: 400 })
  }
  const updated = await prisma.image.update({
    where: { id },
    data: { rotateRequestedAt: new Date(), rotateBlock: Boolean(block) },
    select: { id: true, rotateRequestedAt: true },
  })
  return NextResponse.json({ ok: true, ...updated })
}
