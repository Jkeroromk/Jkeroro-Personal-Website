import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { moderate } from '@/lib/moderation'

/**
 * GET /api/guestbook
 * 返回有名字的留言（即留言墙提交的条目）
 */
export async function GET() {
  try {
    const entries = await prisma.comment.findMany({
      where: { name: { not: null }, hidden: false },
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
      take: 50,
      select: { id: true, name: true, text: true, emoji: true, createdAt: true },
    })
    return NextResponse.json(
      entries.map((e) => ({ ...e, message: e.text }))
    )
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}

const ALLOWED_EMOJIS = ['👋', '❤️', '🔥', '✨', '😊', '🎵', '🌟', '💬', '🚀', '🎉']
const MAX_NAME_LEN = 20
const MAX_MESSAGE_LEN = 150

/**
 * POST /api/guestbook
 * 新增留言 → 写入 comments 表（带 name/emoji）
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

    // 自动过滤：可疑的先隐藏，后台放行后才显示
    const check = await moderate([name, message])

    const entry = await prisma.comment.create({
      data: {
        text: message.trim(),
        name: name.trim(),
        emoji: safeEmoji,
        hidden: check.hidden,
        flagReason: check.reason,
        likes: 0,
        fires: 0,
        hearts: 0,
        laughs: 0,
        wows: 0,
      },
      select: { id: true, name: true, text: true, emoji: true, createdAt: true },
    })

    if (check.hidden) {
      // 不把命中的原因告诉提交的人，只说要等审核
      return NextResponse.json({ id: entry.id, pending: true }, { status: 202 })
    }

    return NextResponse.json(
      { ...entry, message: entry.text },
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
