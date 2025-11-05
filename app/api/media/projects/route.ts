import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 获取所有项目
export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error('Get projects error:', error)
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

// 创建新项目
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      image,
      link,
      category,
      cropX,
      cropY,
      cropSize,
      imageOffsetX,
      imageOffsetY,
      scale,
    } = body

    if (!title || !description) {
      return NextResponse.json(
        { error: 'title and description are required' },
        { status: 400 }
      )
    }

    const project = await prisma.project.create({
      data: {
        title,
        description,
        image: image || null,
        link: link || null,
        category: category || 'personal',
        cropX: cropX || 50,
        cropY: cropY || 50,
        cropSize: cropSize || 100,
        imageOffsetX: imageOffsetX || 0,
        imageOffsetY: imageOffsetY || 0,
        scale: scale || 1,
      },
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error('Create project error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

