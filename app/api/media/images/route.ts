import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withTimeout, getDbErrorInfo } from '@/lib/db-error-handler'
import { requireAuth } from '@/lib/requireAuth'

// 首页每天显示几张：照片多于这个数时，每天随机换一批（同一天所有人看到的一样）
const HOME_COUNT = 7

// 用日期当种子的简单伪随机（mulberry32），保证同一天结果固定
function seededShuffle<T>(arr: T[], seedText: string): T[] {
  let seed = 0
  for (const c of seedText) seed = (Math.imul(seed, 31) + c.charCodeAt(0)) | 0
  const rand = () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function todayInNewYork() {
  // en-CA 的格式正好是 YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date())
}

// 获取所有图片；?home=1 时只返回今天首页要显示的那几张
export async function GET(request: NextRequest) {
  const home = request.nextUrl.searchParams.get('home') === '1'
  try {
    // 添加连接超时保护（8秒超时）
    // 使用 Accelerate 缓存策略：SWR 策略，图片数据不经常变化，缓存 300 秒（5分钟）
    const images = await withTimeout(
      prisma.image.findMany({
        orderBy: [
          { order: 'asc' },
          { createdAt: 'asc' },
        ],
      }),
      8000
      )

    if (home && images.length > HOME_COUNT) {
      const picked = seededShuffle(images, todayInNewYork()).slice(0, HOME_COUNT)
      return NextResponse.json(picked, {
        headers: { 'X-Total-Count': String(images.length), 'Cache-Control': 'no-store' },
      })
    }

    return NextResponse.json(images, home ? { headers: { 'X-Total-Count': String(images.length) } } : undefined)
  } catch (error) {
    const errorInfo = getDbErrorInfo(error)
    
    // 如果是连接错误或超时，返回空数组（不阻塞用户）
    if (errorInfo.shouldReturnEmpty) {
      console.error('Database connection/timeout error (get images):', errorInfo.errorMessage)
      return NextResponse.json([])
    }
    
    // 其他错误才返回 500
      console.error('Get images error:', error)
      console.error('Get images error details:', {
      message: errorInfo.errorMessage,
        timestamp: new Date().toISOString(),
        nodeEnv: process.env.NODE_ENV,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
      })
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? errorInfo.errorMessage : undefined,
      },
      { status: 500 }
    )
  }
}

// 创建新图片
export async function POST(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError
  try {
    const body = await request.json()
    const { src, alt, width, height, order, priority, imageOffsetX, imageOffsetY } = body

    // alt 就是首页照片下面那行 caption，可以留空
    if (!src) {
      return NextResponse.json(
        { error: 'src is required' },
        { status: 400 }
      )
    }

    // 如果没有提供 order，自动设置为最大值 + 1
    let finalOrder = order
    if (finalOrder === undefined) {
      const maxOrder = await prisma.image.findFirst({
        orderBy: { order: 'desc' },
        select: { order: true },
      })
      finalOrder = (maxOrder?.order ?? -1) + 1
    }

    const image = await prisma.image.create({
      data: {
        src,
        alt: typeof alt === 'string' ? alt : '',
        width: width || 550,
        height: height || 384,
        order: finalOrder,
        priority: priority || false,
        imageOffsetX: imageOffsetX || 50,
        imageOffsetY: imageOffsetY || 50,
      },
    })

    return NextResponse.json(image)
  } catch (error) {
    console.error('Create image error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

