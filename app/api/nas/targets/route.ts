import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireNasToken } from '@/lib/nas-sync'

export const dynamic = 'force-dynamic'

// NAS 启动时拿一次：首页有哪些格子（按 caption 对应到 NAS 上的文件夹）
export async function GET(request: NextRequest) {
  const authError = requireNasToken(request)
  if (authError) return authError
  const images = await prisma.image.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    select: { id: true, alt: true, source: true },
  })
  return NextResponse.json({ slots: images.map((i) => ({ id: i.id, caption: i.alt, source: i.source })) })
}
