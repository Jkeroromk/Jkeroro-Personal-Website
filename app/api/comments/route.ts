import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withTimeout, getDbErrorInfo } from '@/lib/db-error-handler'
import { requireAuth } from '@/lib/requireAuth'
import { moderate } from '@/lib/moderation'

// 获取评论：公开只返回没被隐藏的；后台带 ?all=1 并登录时返回全部（包括自动过滤隐藏的）
export async function GET(request: NextRequest) {
  let includeHidden = false
  if (request.nextUrl.searchParams.get('all') === '1') {
    const authError = await requireAuth(request)
    if (authError) return authError
    includeHidden = true
  }
  try {
    // 添加连接超时保护（8秒超时）
    // 使用 Accelerate 缓存策略：SWR 策略，评论可能更频繁变化，缓存 60 秒
    const comments = await withTimeout(
      prisma.comment.findMany({
        where: includeHidden ? undefined : { hidden: false },
        include: {
          reactions: true,
        },
        orderBy: [
          { pinned: 'desc' },
          { createdAt: 'desc' },
        ],
      }),
      8000
    )

    return NextResponse.json(comments)
  } catch (error) {
    const errorInfo = getDbErrorInfo(error)
    
    // 如果是连接错误或超时，返回空数组（不阻塞用户）
    if (errorInfo.shouldReturnEmpty) {
      return NextResponse.json([])
    }
    
    // 其他错误才返回 500
      console.error('Get comments error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? errorInfo.errorMessage : undefined,
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

    if (text.trim().length > 1000) {
      return NextResponse.json({ error: 'Comment is too long' }, { status: 400 })
    }

    // 自动过滤：可疑的先隐藏，后台放行后才显示
    const check = await moderate([text])

    const comment = await prisma.comment.create({
      data: {
        text: text.trim(),
        hidden: check.hidden,
        flagReason: check.reason,
        likes: 0,
        fires: 0,
        hearts: 0,
        laughs: 0,
        wows: 0,
      },
    })

    if (check.hidden) {
      // 不把命中的原因告诉提交的人，只说要等审核
      return NextResponse.json({ id: comment.id, pending: true }, { status: 202 })
    }
    return NextResponse.json(comment)
  } catch (error) {
    console.error('Create comment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

