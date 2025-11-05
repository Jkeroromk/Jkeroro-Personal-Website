import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 获取所有项目
export async function GET() {
  try {
    // 添加连接超时保护
    // 先获取所有项目，然后手动排序（处理 null order 值）
    const allProjects = await Promise.race([
      prisma.project.findMany({
        orderBy: { createdAt: 'desc' },
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 10000)
      )
    ]) as Awaited<ReturnType<typeof prisma.project.findMany>>

    // 分离有 order 和没有 order 的项目
    const projectsWithOrder = allProjects.filter(p => p.order !== null && p.order !== undefined)
    const projectsWithoutOrder = allProjects.filter(p => p.order === null || p.order === undefined)

    // 按 order 排序有 order 的项目
    projectsWithOrder.sort((a, b) => a.order! - b.order!)

    // 为没有 order 的项目设置默认值（向后兼容）
    const maxOrder = projectsWithOrder.length > 0 
      ? Math.max(...projectsWithOrder.map(p => p.order!)) 
      : -1
    
    // 更新没有 order 的项目（异步，不阻塞响应）
    const updatePromises = projectsWithoutOrder.map((project, index) => {
      const newOrder = maxOrder + 1 + index
      // 临时设置 order 值用于返回，同时异步更新数据库
      project.order = newOrder
      return prisma.project.update({
        where: { id: project.id },
        data: { order: newOrder },
      }).catch(err => {
        console.error(`Failed to update project ${project.id} order:`, err)
        return null
      })
    })
    
    // 不等待更新完成，直接返回
    Promise.all(updatePromises).catch(err => {
      console.error('Some project order updates failed:', err)
    })

    // 合并并排序
    const sortedProjects = [...projectsWithOrder, ...projectsWithoutOrder]
      .sort((a, b) => {
        const aOrder = a.order ?? Number.MAX_SAFE_INTEGER
        const bOrder = b.order ?? Number.MAX_SAFE_INTEGER
        if (aOrder !== bOrder) {
          return aOrder - bOrder
        }
        // 如果 order 相同，按创建时间排序
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })

    return NextResponse.json(sortedProjects)
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
      const maxOrder = await prisma.project.findFirst({
        orderBy: { order: 'desc' },
        select: { order: true },
      })
      finalOrder = (maxOrder?.order ?? -1) + 1
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

