import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 获取所有评论
export async function GET() {
  try {
    const comments = await prisma.comment.findMany({
      include: {
        reactions: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error('Get comments error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 创建新评论
export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: 'Comment text is required' },
        { status: 400 }
      )
    }

    const comment = await prisma.comment.create({
      data: {
        text: text.trim(),
        likes: 0,
        fires: 0,
        hearts: 0,
        laughs: 0,
        wows: 0,
      },
    })

    return NextResponse.json(comment)
  } catch (error) {
    console.error('Create comment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

