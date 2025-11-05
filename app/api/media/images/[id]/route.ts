import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 更新图片
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await request.json()
    const { src, alt, width, height, order, priority, imageOffsetX, imageOffsetY } = body

    const image = await prisma.image.update({
      where: { id },
      data: {
        ...(src && { src }),
        ...(alt && { alt }),
        ...(width !== undefined && { width }),
        ...(height !== undefined && { height }),
        ...(order !== undefined && { order }),
        ...(priority !== undefined && { priority }),
        ...(imageOffsetX !== undefined && { imageOffsetX }),
        ...(imageOffsetY !== undefined && { imageOffsetY }),
      },
    })

    return NextResponse.json(image)
  } catch (error) {
    console.error('Update image error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 删除图片
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // 添加连接超时保护
    await Promise.race([
      prisma.image.delete({
        where: { id },
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 10000)
      )
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete image error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    // 详细错误日志
    console.error('Delete image error details:', {
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

