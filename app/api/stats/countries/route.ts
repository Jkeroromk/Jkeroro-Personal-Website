import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withTimeout, getDbErrorInfo } from '@/lib/db-error-handler'
import { resolveCountry } from '@/lib/countries'

// 记访问（总数 + 国家）统一走 POST /api/stats/view，在一个事务里同时写，这里只负责读。

// 获取所有国家访问统计
export async function GET() {
  try {
    // 缓存时间跟 /api/stats/view 一样（60 秒），两边的数字新旧程度一致
    const countries = await withTimeout(
      prisma.countryVisit.findMany({
        orderBy: {
          count: 'desc',
        },
        // @ts-expect-error - cacheStrategy 是 Accelerate 扩展的类型，TypeScript 可能无法识别
        cacheStrategy: { swr: 60, ttl: 60 },
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

