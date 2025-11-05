import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import axios from 'axios'

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

    // 更新或创建国家访问记录
    const countryVisit = await prisma.countryVisit.upsert({
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
    })

    return NextResponse.json({
      success: true,
      country: countryVisit.country,
      count: countryVisit.count,
    })
  } catch (error) {
    // 在开发环境中，如果是数据库连接错误，静默处理
    const isConnectionError = error instanceof Error && 
      (error.message.includes("Can't reach database server") || 
       error.message.includes('PrismaClientInitializationError'))
    
    if (process.env.NODE_ENV === 'development' && isConnectionError) {
      // 开发环境返回成功但跳过记录
      return NextResponse.json({ success: true, skipped: true })
    }
    
    if (!isConnectionError || process.env.NODE_ENV === 'production') {
      console.error('Track visitor location error:', error)
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 获取所有国家访问统计
export async function GET() {
  try {
    const countries = await prisma.countryVisit.findMany({
      orderBy: {
        count: 'desc',
      },
    })

    return NextResponse.json(countries)
  } catch (error) {
    // 在开发环境中，如果是数据库连接错误，静默处理
    const isConnectionError = error instanceof Error && 
      (error.message.includes("Can't reach database server") || 
       error.message.includes('PrismaClientInitializationError'))
    
    if (process.env.NODE_ENV === 'development' && isConnectionError) {
      // 开发环境返回空数组
      return NextResponse.json([])
    }
    
    if (!isConnectionError || process.env.NODE_ENV === 'production') {
      console.error('Get countries stats error:', error)
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

