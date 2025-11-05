import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 增加访问计数
export async function POST() {
  try {
    // 获取或创建单条访问计数记录
    const viewCount = await prisma.viewCount.upsert({
      where: { id: 'main' },
      update: {
        count: { increment: 1 },
      },
      create: {
        id: 'main',
        count: 1,
      },
    })

    return NextResponse.json({
      count: viewCount.count,
      lastUpdated: viewCount.lastUpdated,
    })
  } catch (error) {
    // 在开发环境中，如果是数据库连接错误，静默处理
    const isConnectionError = error instanceof Error && 
      (error.message.includes("Can't reach database server") || 
       error.message.includes('PrismaClientInitializationError'))
    
    if (process.env.NODE_ENV === 'development' && isConnectionError) {
      // 开发环境返回成功但跳过计数
      return NextResponse.json({
        count: 0,
        lastUpdated: new Date().toISOString(),
        skipped: true,
      })
    }
    
    if (!isConnectionError || process.env.NODE_ENV === 'production') {
      console.error('Increment view count error:', error)
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 获取访问计数
export async function GET() {
  try {
    const viewCount = await prisma.viewCount.findUnique({
      where: { id: 'main' },
    })

    return NextResponse.json({
      count: viewCount?.count || 0,
      lastUpdated: viewCount?.lastUpdated || null,
    })
  } catch (error) {
    // 在开发环境中，如果是数据库连接错误，静默处理
    const isConnectionError = error instanceof Error && 
      (error.message.includes("Can't reach database server") || 
       error.message.includes('PrismaClientInitializationError'))
    
    if (process.env.NODE_ENV === 'development' && isConnectionError) {
      // 开发环境返回默认值
      return NextResponse.json({
        count: 0,
        lastUpdated: null,
      })
    }
    
    if (!isConnectionError || process.env.NODE_ENV === 'production') {
      console.error('Get view count error:', error)
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

