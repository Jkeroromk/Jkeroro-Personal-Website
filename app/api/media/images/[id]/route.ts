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
    await prisma.image.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete image error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

