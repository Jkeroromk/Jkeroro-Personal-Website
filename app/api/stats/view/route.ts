import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withTimeout, getDbErrorInfo } from '@/lib/db-error-handler'
import { countryNameFromCode } from '@/lib/countries'

// 记一次访问：总数 +1，认得出国家的话该国家也 +1。
// 两条写在同一个事务里，要么都成功要么都不算，按钮上的 Viewers 和地图上的国家就不会再越差越多。
// 认不出国家的访问只加总数，地图那边显示成 "Unknown" 一行，所以列表加起来正好等于 Viewers。
export async function POST(request: NextRequest) {
  try {
    const country = countryNameFromCode(request.headers.get('x-vercel-ip-country'))
    const now = new Date()

    const known = !!country && country !== 'Unknown'

    const viewUpsert = prisma.viewCount.upsert({
      where: { id: 'main' },
      update: { count: { increment: 1 } },
      create: { id: 'main', count: 1 },
    })

    const result = known
      ? await withTimeout(
          prisma.$transaction([
            viewUpsert,
            prisma.countryVisit.upsert({
              where: { country: country as string },
              update: { count: { increment: 1 }, lastVisit: now },
              create: { country: country as string, count: 1, lastVisit: now },
            }),
          ]),
          8000
        )
      : await withTimeout(prisma.$transaction([viewUpsert]), 8000)
    const viewCount = result[0]

    return NextResponse.json({
      count: viewCount.count,
      lastUpdated: viewCount.lastUpdated,
      country: known ? country : null,
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
    // 使用 Accelerate 缓存策略：SWR 策略，访问计数可以缓存 60 秒
    const viewCount = await withTimeout(
      prisma.viewCount.upsert({
      where: { id: 'main' },
        update: {}, // 如果存在，不更新
        create: { id: 'main', count: 0 }, // 如果不存在，创建初始记录
        // @ts-expect-error - cacheStrategy 是 Accelerate 扩展的类型，TypeScript 可能无法识别
        cacheStrategy: { swr: 60, ttl: 60 },
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

