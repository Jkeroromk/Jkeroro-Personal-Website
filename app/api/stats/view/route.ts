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
    // 检查是否是数据库连接错误
    const isConnectionError = error instanceof Error && 
      (error.message.includes("Can't reach database server") || 
       error.message.includes('PrismaClientInitializationError') ||
       error.message.includes('P1001') ||
       error.message.includes('query timeout'))
    
    // 如果是连接错误，返回降级响应（不阻塞用户）
    if (isConnectionError) {
      console.error('Database connection error (increment view count):', error instanceof Error ? error.message : error)
      // 返回成功但跳过计数，不阻塞用户
      return NextResponse.json({
        count: 0,
        lastUpdated: new Date().toISOString(),
        skipped: true,
      })
    }
    
    // 其他错误才返回 500
    console.error('Increment view count error:', error)
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
    // 检查是否是数据库连接错误
    const isConnectionError = error instanceof Error && 
      (error.message.includes("Can't reach database server") || 
       error.message.includes('PrismaClientInitializationError') ||
       error.message.includes('P1001') ||
       error.message.includes('query timeout'))
    
    // 如果是连接错误，返回默认值（不阻塞用户）
    if (isConnectionError) {
      console.error('Database connection error (get view count):', error instanceof Error ? error.message : error)
      return NextResponse.json({
        count: 0,
        lastUpdated: null,
      })
    }
    
    // 其他错误才返回 500
    console.error('Get view count error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

