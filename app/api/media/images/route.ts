import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 获取所有图片
export async function GET() {
  try {
    const images = await prisma.image.findMany({
      orderBy: [
        { order: 'asc' },
        { createdAt: 'asc' },
      ],
    })

    return NextResponse.json(images)
  } catch (error) {
    console.error('Get images error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    // 在生产环境记录详细错误信息
    if (process.env.NODE_ENV === 'production') {
      console.error('Production error details:', {
        message: errorMessage,
        stack: errorStack,
        timestamp: new Date().toISOString(),
      })
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
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

