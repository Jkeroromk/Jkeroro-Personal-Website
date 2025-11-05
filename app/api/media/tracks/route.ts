import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 获取所有音乐轨道
export async function GET() {
  try {
    // 添加连接超时保护
    const tracks = await Promise.race([
      prisma.track.findMany({
        orderBy: {
          order: 'asc',
        },
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 10000)
      )
    ]) as Awaited<ReturnType<typeof prisma.track.findMany>>

    return NextResponse.json(tracks)
  } catch (error) {
    // 在开发环境中，如果是数据库连接错误，静默处理
    const isConnectionError = error instanceof Error && 
      (error.message.includes("Can't reach database server") || 
       error.message.includes('PrismaClientInitializationError'))
    
    if (process.env.NODE_ENV === 'development' && isConnectionError) {
      // 开发环境返回空数组
      return NextResponse.json([])
    }
    
    // 只在非连接错误或生产环境记录错误
    if (!isConnectionError || process.env.NODE_ENV === 'production') {
      console.error('Get tracks error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Get tracks error details:', {
        message: errorMessage,
        timestamp: new Date().toISOString(),
        nodeEnv: process.env.NODE_ENV,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
      })
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : undefined) : undefined,
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

