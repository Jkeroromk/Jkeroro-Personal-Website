import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/guestbook
 * 获取留言墙所有留言（最新50条）
 */
export async function GET() {
  try {
    const entries = await prisma.guestbook.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { id: true, name: true, message: true, emoji: true, createdAt: true },
    })
    return NextResponse.json(entries)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}

const ALLOWED_EMOJIS = ['👋', '❤️', '🔥', '✨', '😊', '🎵', '🌟', '💬', '🚀', '🎉']
const MAX_NAME_LEN = 20
const MAX_MESSAGE_LEN = 150

/**
 * POST /api/guestbook
 * 新增一条留言
 * Body: { name, message, emoji }
 */
export async function POST(req: NextRequest) {
  try {
    const { name, message, emoji } = await req.json()

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: '名字不能为空' }, { status: 400 })
    }
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: '留言不能为空' }, { status: 400 })
    }
    if (name.trim().length > MAX_NAME_LEN) {
      return NextResponse.json({ error: `名字最多 ${MAX_NAME_LEN} 字` }, { status: 400 })
    }
    if (message.trim().length > MAX_MESSAGE_LEN) {
      return NextResponse.json({ error: `留言最多 ${MAX_MESSAGE_LEN} 字` }, { status: 400 })
    }

    const safeEmoji = ALLOWED_EMOJIS.includes(emoji) ? emoji : '👋'

    const entry = await prisma.guestbook.create({
      data: {
        name: name.trim(),
        message: message.trim(),
        emoji: safeEmoji,
      },
      select: { id: true, name: true, message: true, emoji: true, createdAt: true },
    })

    return NextResponse.json(entry, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
