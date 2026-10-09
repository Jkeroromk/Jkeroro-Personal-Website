import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withTimeout, getDbErrorInfo } from '@/lib/db-error-handler'
import { requireAuth } from '@/lib/requireAuth'
import { isKnownPlatform, MAX_SOCIAL_LINKS } from '@/lib/social-platforms'

// 首页社交媒体链接
// GET：公开，按顺序返回全部（含隐藏的，前台自己过滤 visible）
// PUT：后台保存，整份替换（增、删、改、排序一次提交）

export async function GET() {
  try {
    const links = await withTimeout(
      prisma.socialLink.findMany({ orderBy: { order: 'asc' } }),
      8000
    )
    return NextResponse.json(
      links.map(({ id, platform, name, url, visible }) => ({ id, platform, name, url, visible }))
    )
  } catch (error) {
    const info = getDbErrorInfo(error)
    console.error('Get social links error:', error)
    return NextResponse.json(
      { error: 'Failed to load social links', message: process.env.NODE_ENV === 'development' ? info.errorMessage : undefined },
      { status: 500 }
    )
  }
}

interface IncomingLink {
  platform?: unknown
  name?: unknown
  url?: unknown
  visible?: unknown
}

function validate(body: unknown): { links: { platform: string; name: string; url: string; visible: boolean }[] } | { error: string } {
  const list = (body as { links?: unknown })?.links
  if (!Array.isArray(list)) return { error: 'links must be an array' }
  if (list.length > MAX_SOCIAL_LINKS) return { error: `At most ${MAX_SOCIAL_LINKS} links` }

  const links = []
  for (let i = 0; i < list.length; i++) {
    const item = list[i] as IncomingLink
    const n = i + 1
    const platform = typeof item.platform === 'string' ? item.platform.trim() : ''
    const name = typeof item.name === 'string' ? item.name.trim() : ''
    const url = typeof item.url === 'string' ? item.url.trim() : ''
    if (!isKnownPlatform(platform)) return { error: `Link ${n}: unknown platform "${platform}"` }
    if (!name || name.length > 40) return { error: `Link ${n}: name must be 1–40 characters` }
    if (url.length > 500) return { error: `Link ${n}: URL is too long` }
    try {
      const parsed = new URL(url)
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') throw new Error()
    } catch {
      return { error: `Link ${n} (${name}): URL must start with https://` }
    }
    links.push({ platform, name, url, visible: item.visible !== false })
  }
  return { links }
}

export async function PUT(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const result = validate(body)
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: 400 })

  try {
    await withTimeout(
      prisma.$transaction([
        prisma.socialLink.deleteMany({}),
        prisma.socialLink.createMany({
          data: result.links.map((l, order) => ({ ...l, order })),
        }),
      ]),
      10000
    )
    const links = await prisma.socialLink.findMany({ orderBy: { order: 'asc' } })
    return NextResponse.json(
      links.map(({ id, platform, name, url, visible }) => ({ id, platform, name, url, visible }))
    )
  } catch (error) {
    const info = getDbErrorInfo(error)
    console.error('Save social links error:', error)
    return NextResponse.json(
      { error: 'Failed to save social links', message: process.env.NODE_ENV === 'development' ? info.errorMessage : undefined },
      { status: 500 }
    )
  }
}
