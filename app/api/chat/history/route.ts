import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const MAX_HISTORY = 50 // 每个用户/会话最多保留50条消息

/**
 * GET /api/chat/history?userId=xxx&conversationId=yyy
 * 获取指定用户、指定会话的对话历史（最近50条）
 */
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')
  const conversationId = req.nextUrl.searchParams.get('conversationId') || 'default'
  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
  }

  try {
    const messages = await prisma.chatMessage.findMany({
      where: { userId, conversationId },
      orderBy: { createdAt: 'asc' },
      take: MAX_HISTORY,
      select: { role: true, content: true, createdAt: true },
    })
    return NextResponse.json(messages)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}

/**
 * POST /api/chat/history
 * 保存一条对话消息
 * Body: { userId, role, content, conversationId }
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, role, content, conversationId = 'default' } = await req.json()

    if (!userId || !role || !content) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    if (!['user', 'assistant'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    await prisma.chatMessage.create({
      data: { userId, role, content, conversationId },
    })

    // 超出上限时，删除最旧的消息（保留最近 MAX_HISTORY 条）
    const count = await prisma.chatMessage.count({ where: { userId, conversationId } })
    if (count > MAX_HISTORY) {
      const oldest = await prisma.chatMessage.findMany({
        where: { userId, conversationId },
        orderBy: { createdAt: 'asc' },
        take: count - MAX_HISTORY,
        select: { id: true },
      })
      await prisma.chatMessage.deleteMany({
        where: { id: { in: oldest.map((m) => m.id) } },
      })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
