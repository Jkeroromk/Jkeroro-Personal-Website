import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withTimeout, getDbErrorInfo } from '@/lib/db-error-handler'

// 获取所有音乐轨道
export async function GET() {
  try {
    // 添加连接超时保护（8秒超时）
    const tracks = await withTimeout(
      prisma.track.findMany({
        orderBy: {
          order: 'asc',
        },
      }),
      8000
    )

    return NextResponse.json(tracks)
  } catch (error) {
    const errorInfo = getDbErrorInfo(error)
    
    // 如果是连接错误或超时，返回空数组（不阻塞用户）
    if (errorInfo.shouldReturnEmpty) {
      console.error('Database connection/timeout error (get tracks):', errorInfo.errorMessage)
      return NextResponse.json([])
    }
    
    // 其他错误才返回 500
    console.error('Get tracks error:', error)
    console.error('Get tracks error details:', {
      message: errorInfo.errorMessage,
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
    })
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? errorInfo.errorMessage : undefined,
      },
      { status: 500 }
    )
  }
}

// 创建新音乐轨道
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, subtitle, src, order } = body

    if (!title || !subtitle || !src) {
      return NextResponse.json(
        { error: 'title, subtitle, and src are required' },
        { status: 400 }
      )
    }

    // 如果没有提供 order，自动设置为最大值 + 1
    let finalOrder = order
    if (finalOrder === undefined) {
      const maxOrder = await prisma.track.findFirst({
        orderBy: { order: 'desc' },
        select: { order: true },
      })
      finalOrder = (maxOrder?.order ?? -1) + 1
    }

    const track = await prisma.track.create({
      data: {
        title,
        subtitle,
        src,
        order: finalOrder,
      },
    })

    return NextResponse.json(track)
  } catch (error) {
    console.error('Create track error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

