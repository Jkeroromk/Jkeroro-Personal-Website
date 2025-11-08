import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withTimeout, getDbErrorInfo } from '@/lib/db-error-handler'

// 获取所有项目
export async function GET() {
  try {
    // 添加连接超时保护（8秒超时）
    // 先获取所有项目，然后手动排序（处理 null order 值）
    // 使用 Accelerate 缓存策略：项目数据不经常变化，缓存 120 秒
    const allProjects = await withTimeout(
      prisma.project.findMany({
        orderBy: { createdAt: 'desc' },
        // @ts-expect-error - cacheStrategy 是 Accelerate 扩展的类型，TypeScript 可能无法识别
        cacheStrategy: { ttl: 120 },
      }),
      8000
    )

    // 尝试按 order 排序，如果 order 字段不存在则按创建时间排序
    let sortedProjects = allProjects
    try {
      // 检查是否有 order 字段
      const hasOrderField = allProjects.length === 0 || 'order' in allProjects[0]
      
      if (hasOrderField) {
        // 分离有 order 和没有 order 的项目
        const projectsWithOrder = allProjects.filter(p => p.order !== null && p.order !== undefined)
        const projectsWithoutOrder = allProjects.filter(p => p.order === null || p.order === undefined)

        // 按 order 排序有 order 的项目
        projectsWithOrder.sort((a, b) => a.order! - b.order!)

        // 合并并排序
        sortedProjects = [...projectsWithOrder, ...projectsWithoutOrder]
          .sort((a, b) => {
            const aOrder = a.order ?? Number.MAX_SAFE_INTEGER
            const bOrder = b.order ?? Number.MAX_SAFE_INTEGER
            if (aOrder !== bOrder) {
              return aOrder - bOrder
            }
            // 如果 order 相同，按创建时间排序
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          })
      } else {
        // 如果没有 order 字段，只按创建时间排序
        sortedProjects = allProjects.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      }
    } catch (error) {
      // 如果访问 order 字段出错，只按创建时间排序
      console.warn('Error accessing order field, sorting by createdAt only:', error)
      sortedProjects = allProjects.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    }

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

