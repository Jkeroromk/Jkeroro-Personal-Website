import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withTimeout, getDbErrorInfo } from '@/lib/db-error-handler'
import { requireAuth } from '@/lib/requireAuth'

// 获取所有项目
export async function GET() {
  try {
    // 添加连接超时保护（8秒超时）
    // 先获取所有项目，然后手动排序（处理 null order 值）
    const allProjects = await withTimeout(
      prisma.project.findMany({
        orderBy: { createdAt: 'desc' },
      }),
      8000
    )

    // 排序：置顶的在前；同一组里按后台拖拽的 order；order 一样再按创建时间（新的在前）
    const sortedProjects = [...allProjects].sort((a, b) => {
      const pin = Number(Boolean(b.pinned)) - Number(Boolean(a.pinned))
      if (pin !== 0) return pin
      const aOrder = a.order ?? Number.MAX_SAFE_INTEGER
      const bOrder = b.order ?? Number.MAX_SAFE_INTEGER
      if (aOrder !== bOrder) return aOrder - bOrder
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return NextResponse.json(sortedProjects)
  } catch (error) {
    const errorInfo = getDbErrorInfo(error)
    
    // 如果是连接错误或超时，返回空数组（不阻塞用户）
    if (errorInfo.shouldReturnEmpty) {
      console.error('Database connection/timeout error (get projects):', errorInfo.errorMessage)
      return NextResponse.json([])
    }
    
    // 其他错误才返回 500
      console.error('Get projects error:', error)
      console.error('Get projects error details:', {
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

// 创建新项目
export async function POST(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError
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
      pinned,
    } = body

    if (!title || !description) {
      return NextResponse.json(
        { error: 'title and description are required' },
        { status: 400 }
      )
    }

    // 如果没有提供 order，自动设置为最大值 + 1
    let finalOrder = order
    if (finalOrder === undefined) {
      try {
        // 尝试获取最大 order 值（如果 order 列存在）
        const maxOrder = await prisma.project.findFirst({
          orderBy: { createdAt: 'desc' },
          select: { order: true },
        })
        finalOrder = (maxOrder?.order ?? -1) + 1
      } catch (error) {
        // 如果 order 列不存在，使用默认值 0
        console.warn('Order column may not exist, using default order 0:', error)
        finalOrder = 0
      }
    }

    const project = await prisma.project.create({
      data: {
        title,
        description,
        image: image || null,
        link: link || null,
        category: category || 'personal',
        order: finalOrder,
        cropX: cropX || 50,
        cropY: cropY || 50,
        cropSize: cropSize || 100,
        imageOffsetX: imageOffsetX || 0,
        imageOffsetY: imageOffsetY || 0,
        scale: scale || 1,
        pinned: Boolean(pinned),
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

