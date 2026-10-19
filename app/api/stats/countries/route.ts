import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withTimeout, getDbErrorInfo } from '@/lib/db-error-handler'
import { countryNameFromCode, resolveCountry } from '@/lib/countries'

// 记录访客位置
export async function POST(request: NextRequest) {
  try {
    let country: string | null = null

    const body = await request.json().catch(() => ({}))
    if (typeof body.country === 'string') {
      // 只接受认得出来的国家名，免得有人往表里塞任意字符串
      country = resolveCountry(body.country)?.name ?? null
    } else {
      // 直接从 Vercel 注入的请求头读取国家代码，零延迟
      country = countryNameFromCode(request.headers.get('x-vercel-ip-country'))
    }

    if (!country || country === 'Unknown') {
      return NextResponse.json({ success: true, skipped: true })
    }

    // 更新或创建国家访问记录（8秒超时）
    const countryVisit = await withTimeout(
      prisma.countryVisit.upsert({
        where: { country },
        update: {
          count: { increment: 1 },
          lastVisit: new Date(),
        },
        create: {
          country,
          count: 1,
          lastVisit: new Date(),
        },
      }),
      8000
    )

    return NextResponse.json({
      success: true,
      country: countryVisit.country,
      count: countryVisit.count,
    })
  } catch (error) {
    const errorInfo = getDbErrorInfo(error)
    
    // 如果是连接错误或超时，返回成功但跳过记录（不阻塞用户）
    if (errorInfo.shouldReturnEmpty) {
      console.error('Database connection/timeout error (track visitor location):', errorInfo.errorMessage)
      return NextResponse.json({ success: true, skipped: true })
    }
    
    // 其他错误才返回 500
    console.error('Track visitor location error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 获取所有国家访问统计
export async function GET() {
  try {
    // 使用 Accelerate 缓存策略：SWR 策略，国家统计数据可以缓存 180 秒（3分钟）
    const countries = await withTimeout(
      prisma.countryVisit.findMany({
        orderBy: {
          count: 'desc',
        },
        // @ts-expect-error - cacheStrategy 是 Accelerate 扩展的类型，TypeScript 可能无法识别
        cacheStrategy: { swr: 180, ttl: 180 },
      }),
      8000
    )

    // 同一个国家在库里可能有几种旧写法（比如 The Netherlands / Netherlands），这里合并成一行，
    // 并带上国家代码和坐标，前端地图直接用，不用再自己带一张国家表
    const merged = new Map<string, {
      country: string
      code: string | null
      lat: number | null
      lng: number | null
      count: number
      lastVisit: Date
    }>()
    for (const row of countries) {
      const info = resolveCountry(row.country)
      const key = info?.code ?? row.country
      const prev = merged.get(key)
      if (prev) {
        prev.count += row.count
        if (row.lastVisit > prev.lastVisit) prev.lastVisit = row.lastVisit
      } else {
        merged.set(key, {
          country: info?.name ?? row.country,
          code: info?.code ?? null,
          lat: info?.lat ?? null,
          lng: info?.lng ?? null,
          count: row.count,
          lastVisit: row.lastVisit,
        })
      }
    }

    return NextResponse.json([...merged.values()].sort((a, b) => b.count - a.count))
  } catch (error) {
    const errorInfo = getDbErrorInfo(error)
    
    // 如果是连接错误或超时，返回空数组（不阻塞用户）
    if (errorInfo.shouldReturnEmpty) {
      console.error('Database connection/timeout error (get countries stats):', errorInfo.errorMessage)
      return NextResponse.json([])
    }
    
    // 其他错误才返回 500
    console.error('Get countries stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

