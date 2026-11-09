import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireNasToken } from '@/lib/nas-sync'

export const dynamic = 'force-dynamic'

// NAS 每分钟来问一次：后台有没有点「换一张」
export async function GET(request: NextRequest) {
  const authError = requireNasToken(request)
  if (authError) return authError
  const rows = await prisma.image.findMany({
    where: { source: 'nas', rotateRequestedAt: { not: null } },
    select: { id: true, alt: true, src: true, rotateBlock: true },
  })
  return NextResponse.json({
    pending: rows.map((r) => ({
      id: r.id,
      caption: r.alt,
      block: r.rotateBlock,
      // 当前这张的内容 hash（文件名就是 hash），NAS 要屏蔽它时用
      currentHash: r.src.match(/\/nas\/([a-f0-9]{16,64})\.\w+$/)?.[1] ?? null,
    })),
  })
}
