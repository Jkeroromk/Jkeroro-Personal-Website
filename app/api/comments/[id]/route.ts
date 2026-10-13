import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/requireAuth'

// 更新评论
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth(request)
  if (authError) return authError
  try {
    const { id } = await params
    const { text, pinned, hidden } = await request.json()

    interface UpdateCommentData {
      text?: string
      pinned?: boolean
      hidden?: boolean
      flagReason?: string | null
    }

    const data: UpdateCommentData = {}
    if (typeof text === 'string' && text.trim()) {
      data.text = text.trim()
    }
    if (typeof pinned === 'boolean') {
      data.pinned = pinned
    }
    // 后台放行被自动过滤隐藏的留言（或手动隐藏）
    if (typeof hidden === 'boolean') {
      data.hidden = hidden
      if (!hidden) data.flagReason = null
      else data.flagReason = 'Hidden by admin'
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    const comment = await prisma.comment.update({
      where: { id },
      data,
    })

    return NextResponse.json(comment)
  } catch (error) {
    console.error('Update comment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 删除评论
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth(request)
  if (authError) return authError
  try {
    const { id } = await params
    await prisma.comment.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete comment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

