import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withTimeout, getDbErrorInfo } from '@/lib/db-error-handler'

// ISO 3166-1 alpha-2 国家代码 → ECharts 世界地图国家名称映射
const CODE_TO_NAME: Record<string, string> = {
  AF: 'Afghanistan', AL: 'Albania', DZ: 'Algeria', AO: 'Angola', AR: 'Argentina',
  AM: 'Armenia', AU: 'Australia', AT: 'Austria', AZ: 'Azerbaijan', BD: 'Bangladesh',
  BY: 'Belarus', BE: 'Belgium', BJ: 'Benin', BO: 'Bolivia', BA: 'Bosnia and Herzegovina',
  BW: 'Botswana', BR: 'Brazil', BN: 'Brunei', BG: 'Bulgaria', KH: 'Cambodia',
  CM: 'Cameroon', CA: 'Canada', CF: 'Central African Republic', TD: 'Chad', CL: 'Chile',
  CN: 'China', CO: 'Colombia', CG: 'Congo', CR: 'Costa Rica', HR: 'Croatia',
  CU: 'Cuba', CZ: 'Czech Republic', DK: 'Denmark', DO: 'Dominican Republic', EC: 'Ecuador',
  EG: 'Egypt', SV: 'El Salvador', ET: 'Ethiopia', FI: 'Finland', FR: 'France',
  GA: 'Gabon', GE: 'Georgia', DE: 'Germany', GH: 'Ghana', GR: 'Greece',
  GT: 'Guatemala', GN: 'Guinea', HT: 'Haiti', HN: 'Honduras', HK: 'Hong Kong',
  HU: 'Hungary', IS: 'Iceland', IN: 'India', ID: 'Indonesia', IR: 'Iran',
  IQ: 'Iraq', IE: 'Ireland', IL: 'Israel', IT: 'Italy', JM: 'Jamaica',
  JP: 'Japan', JO: 'Jordan', KZ: 'Kazakhstan', KE: 'Kenya', KW: 'Kuwait',
  KG: 'Kyrgyzstan', LA: 'Laos', LB: 'Lebanon', LY: 'Libya', LT: 'Lithuania',
  LU: 'Luxembourg', MK: 'Macedonia', MG: 'Madagascar', MW: 'Malawi', MY: 'Malaysia',
  ML: 'Mali', MR: 'Mauritania', MX: 'Mexico', MD: 'Moldova', MN: 'Mongolia',
  MA: 'Morocco', MZ: 'Mozambique', MM: 'Myanmar', NA: 'Namibia', NP: 'Nepal',
  NL: 'Netherlands', NZ: 'New Zealand', NI: 'Nicaragua', NE: 'Niger', NG: 'Nigeria',
  NO: 'Norway', OM: 'Oman', PK: 'Pakistan', PA: 'Panama', PY: 'Paraguay',
  PE: 'Peru', PH: 'Philippines', PL: 'Poland', PT: 'Portugal', PR: 'Puerto Rico',
  QA: 'Qatar', RO: 'Romania', RU: 'Russia', RW: 'Rwanda', SA: 'Saudi Arabia',
  SN: 'Senegal', RS: 'Serbia', SL: 'Sierra Leone', SK: 'Slovakia', SO: 'Somalia',
  ZA: 'South Africa', KR: 'South Korea', SS: 'South Sudan', ES: 'Spain', LK: 'Sri Lanka',
  SD: 'Sudan', SE: 'Sweden', CH: 'Switzerland', SY: 'Syria', TW: 'Taiwan',
  TJ: 'Tajikistan', TZ: 'Tanzania', TH: 'Thailand', TG: 'Togo', TN: 'Tunisia',
  TR: 'Turkey', TM: 'Turkmenistan', UG: 'Uganda', UA: 'Ukraine', AE: 'United Arab Emirates',
  GB: 'United Kingdom', US: 'United States', UY: 'Uruguay', UZ: 'Uzbekistan',
  VE: 'Venezuela', VN: 'Vietnam', YE: 'Yemen', ZM: 'Zambia', ZW: 'Zimbabwe',
}

// 记录访客位置
export async function POST(request: NextRequest) {
  try {
    let country: string | null = null

    const body = await request.json().catch(() => ({}))
    if (body.country) {
      country = body.country
    } else {
      // 直接从 Vercel 注入的请求头读取国家代码，零延迟
      const countryCode = request.headers.get('x-vercel-ip-country')
      if (countryCode) {
        country = CODE_TO_NAME[countryCode.toUpperCase()] ?? null
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

