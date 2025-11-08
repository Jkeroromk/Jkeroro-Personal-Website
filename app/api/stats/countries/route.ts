import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import axios from 'axios'
import { withTimeout, getDbErrorInfo } from '@/lib/db-error-handler'

// 记录访客位置
export async function POST(request: NextRequest) {
  try {
    // 尝试从请求中获取国家信息，如果没有则从 IP 获取
    let country: string | null = null

    const body = await request.json().catch(() => ({}))
    if (body.country) {
      country = body.country
    } else {
      // 从 IP 获取国家信息
      try {
        const response = await axios.get('https://ipapi.co/json/')
        const countryCode = response.data.country
        const countryName = response.data.country_name

        // 标准化国家名称
        const codeToNameMap: Record<string, string> = {
          US: 'United States',
          PH: 'Philippines',
          UK: 'United Kingdom',
          AU: 'Australia',
          BR: 'Brazil',
          CA: 'Canada',
          CL: 'Chile',
          FR: 'France',
          DE: 'Germany',
          IN: 'India',
          KW: 'Kuwait',
          LB: 'Lebanon',
          KR: 'South Korea',
          SE: 'Sweden',
          CH: 'Switzerland',
          TH: 'Thailand',
          NL: 'The Netherlands',
        }

        country = countryName && countryName.trim() !== ''
          ? countryName
          : codeToNameMap[countryCode.toUpperCase()] || 'Unknown'
      } catch (ipError) {
        console.error('Error fetching country from IP:', ipError)
        return NextResponse.json(
          { error: 'Failed to get country information' },
          { status: 500 }
        )
      }
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
    // 使用 Accelerate 缓存策略：国家统计数据可以缓存 60 秒
    const countries = await withTimeout(
      prisma.countryVisit.findMany({
        orderBy: {
          count: 'desc',
        },
        // @ts-expect-error - cacheStrategy 是 Accelerate 扩展的类型，TypeScript 可能无法识别
        cacheStrategy: { ttl: 60 },
      }),
      8000
    )

    return NextResponse.json(countries)
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

