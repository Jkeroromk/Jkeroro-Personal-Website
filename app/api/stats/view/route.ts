import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withTimeout, getDbErrorInfo } from '@/lib/db-error-handler'

// 增加访问计数
export async function POST() {
  try {
    // 获取或创建单条访问计数记录（8秒超时）
    const viewCount = await withTimeout(
      prisma.viewCount.upsert({
      where: { id: 'main' },
      update: {
        count: { increment: 1 },
      },
      create: {
        id: 'main',
        count: 1,
      },
      }),
      8000
    )

    return NextResponse.json({
      count: viewCount.count,
      lastUpdated: viewCount.lastUpdated,
    })
  } catch (error) {
    const errorInfo = getDbErrorInfo(error)
    
    // 如果是连接错误或超时，返回降级响应（不阻塞用户）
    if (errorInfo.shouldReturnEmpty) {
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
    // 使用 upsert 确保记录存在（如果不存在则创建）
    // 使用 Accelerate 缓存策略：访问计数可以缓存 30 秒
    const viewCount = await withTimeout(
      prisma.viewCount.upsert({
      where: { id: 'main' },
        update: {}, // 如果存在，不更新
        create: { id: 'main', count: 0 }, // 如果不存在，创建初始记录
        // @ts-expect-error - cacheStrategy 是 Accelerate 扩展的类型，TypeScript 可能无法识别
        cacheStrategy: { ttl: 30 },
      }),
      8000
    )

    const response = {
      count: viewCount?.count || 0,
      lastUpdated: viewCount?.lastUpdated || null,
    }
    
    return NextResponse.json(response)
  } catch (error) {
    const errorInfo = getDbErrorInfo(error)
    
    // 如果是连接错误或超时，返回默认值（不阻塞用户）
    if (errorInfo.shouldReturnEmpty) {
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

