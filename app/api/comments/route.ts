import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 获取所有评论
export async function GET() {
  try {
    // 添加连接超时保护
    const comments = await Promise.race([
      prisma.comment.findMany({
        include: {
          reactions: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 10000)
      )
    ]) as Awaited<ReturnType<typeof prisma.comment.findMany>>

    return NextResponse.json(comments)
  } catch (error) {
    console.error('Get comments error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    // 详细错误日志
    console.error('Get comments error details:', {
      message: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      isPrismaError: errorMessage.includes('Prisma') || errorMessage.includes('Query Engine'),
    })
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
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

