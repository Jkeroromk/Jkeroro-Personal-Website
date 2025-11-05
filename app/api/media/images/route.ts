import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 获取所有图片
export async function GET() {
  try {
    // 添加连接超时保护
    const images = await Promise.race([
      prisma.image.findMany({
        orderBy: [
          { order: 'asc' },
          { createdAt: 'asc' },
        ],
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 10000)
      )
    ]) as Awaited<ReturnType<typeof prisma.image.findMany>>

    return NextResponse.json(images)
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
      console.error('Get images error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Get images error details:', {
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

// 创建新图片
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { src, alt, width, height, order, priority, imageOffsetX, imageOffsetY } = body

    if (!src || !alt) {
      return NextResponse.json(
        { error: 'src and alt are required' },
        { status: 400 }
      )
    }

    // 如果没有提供 order，自动设置为最大值 + 1
    let finalOrder = order
    if (finalOrder === undefined) {
      const maxOrder = await prisma.image.findFirst({
        orderBy: { order: 'desc' },
        select: { order: true },
      })
      finalOrder = (maxOrder?.order ?? -1) + 1
    }

    const image = await prisma.image.create({
      data: {
        src,
        alt,
        width: width || 550,
        height: height || 384,
        order: finalOrder,
        priority: priority || false,
        imageOffsetX: imageOffsetX || 50,
        imageOffsetY: imageOffsetY || 50,
      },
    })

    return NextResponse.json(image)
  } catch (error) {
    console.error('Create image error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

