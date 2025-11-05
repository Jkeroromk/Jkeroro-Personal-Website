import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 更新项目
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await request.json()
    const {
      title,
      description,
      image,
      link,
      category,
      order,
      cropX,
      cropY,
      cropSize,
      imageOffsetX,
      imageOffsetY,
      scale,
    } = body

    const updateData: {
      title?: string
      description?: string
      image?: string | null
      link?: string | null
      category?: string
      order?: number
      cropX?: number
      cropY?: number
      cropSize?: number
      imageOffsetX?: number
      imageOffsetY?: number
      scale?: number
    } = {}
    if (title) updateData.title = title
    if (description) updateData.description = description
    if (image !== undefined) updateData.image = image
    if (link !== undefined) updateData.link = link
    if (category) updateData.category = category
    if (order !== undefined) updateData.order = order
    if (cropX !== undefined) updateData.cropX = cropX
    if (cropY !== undefined) updateData.cropY = cropY
    if (cropSize !== undefined) updateData.cropSize = cropSize
    if (imageOffsetX !== undefined) updateData.imageOffsetX = imageOffsetX
    if (imageOffsetY !== undefined) updateData.imageOffsetY = imageOffsetY
    if (scale !== undefined) updateData.scale = scale

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error('Update project error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 删除项目
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.project.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete project error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

