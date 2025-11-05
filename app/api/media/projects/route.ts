import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 获取所有项目
export async function GET() {
  try {
    // 添加连接超时保护
    const projects = await Promise.race([
      prisma.project.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 10000)
      )
    ]) as Awaited<ReturnType<typeof prisma.project.findMany>>

    return NextResponse.json(projects)
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
      console.error('Get projects error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Get projects error details:', {
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

