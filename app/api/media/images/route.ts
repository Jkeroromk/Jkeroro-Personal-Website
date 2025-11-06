import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withTimeout, getDbErrorInfo } from '@/lib/db-error-handler'

// 获取所有图片
export async function GET() {
  try {
    // 添加连接超时保护（8秒超时）
    const images = await withTimeout(
      prisma.image.findMany({
        orderBy: [
          { order: 'asc' },
          { createdAt: 'asc' },
        ],
      }),
      8000
    )

    return NextResponse.json(images)
  } catch (error) {
    const errorInfo = getDbErrorInfo(error)
    
    // 如果是连接错误或超时，返回空数组（不阻塞用户）
    if (errorInfo.shouldReturnEmpty) {
      console.error('Database connection/timeout error (get images):', errorInfo.errorMessage)
      return NextResponse.json([])
    }
    
    // 其他错误才返回 500
    console.error('Get images error:', error)
    console.error('Get images error details:', {
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

