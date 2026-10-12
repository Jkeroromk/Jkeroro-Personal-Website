import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withTimeout, getDbErrorInfo } from '@/lib/db-error-handler'
import { requireAuth } from '@/lib/requireAuth'
import { isKnownTechIcon, MAX_TECH_ITEMS } from '@/lib/tech-icons'
import { cleanCategory, MAX_CATEGORY_LENGTH } from '@/lib/link-groups'

// 首页 Tech Stack
// GET：公开，按顺序返回全部（含隐藏的，前台自己过滤 visible），每项带分类
// PUT：后台保存，整份替换（增、删、改、分类、排序一次提交）

type TechRow = { id: string; icon: string; name: string; category: string; visible: boolean }
const toJson = (rows: TechRow[]) =>
  rows.map(({ id, icon, name, category, visible }) => ({ id, icon, name, category, visible }))

export async function GET() {
  try {
    const items = await withTimeout(
      prisma.techStackItem.findMany({ orderBy: { order: 'asc' } }),
      8000
    )
    return NextResponse.json(toJson(items))
  } catch (error) {
    const info = getDbErrorInfo(error)
    console.error('Get tech stack error:', error)
    return NextResponse.json(
      { error: 'Failed to load tech stack', message: process.env.NODE_ENV === 'development' ? info.errorMessage : undefined },
      { status: 500 }
    )
  }
}

interface IncomingItem {
  icon?: unknown
  name?: unknown
  category?: unknown
  visible?: unknown
}

function validate(body: unknown): { items: { icon: string; name: string; category: string; visible: boolean }[] } | { error: string } {
  const list = (body as { items?: unknown })?.items
  if (!Array.isArray(list)) return { error: 'items must be an array' }
  if (list.length > MAX_TECH_ITEMS) return { error: `At most ${MAX_TECH_ITEMS} items` }

  const items = []
  for (let i = 0; i < list.length; i++) {
    const item = list[i] as IncomingItem
    const n = i + 1
    const icon = typeof item.icon === 'string' ? item.icon.trim() : ''
    const name = typeof item.name === 'string' ? item.name.trim() : ''
    if (!isKnownTechIcon(icon)) return { error: `Item ${n}: unknown icon "${icon}"` }
    if (!name || name.length > 40) return { error: `Item ${n}: name must be 1–40 characters` }
    const category = cleanCategory(item.category)
    if (category === null) return { error: `Item ${n} (${name}): category must be at most ${MAX_CATEGORY_LENGTH} characters` }
    items.push({ icon, name, category, visible: item.visible !== false })
  }
  return { items }
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
        prisma.techStackItem.deleteMany({}),
        prisma.techStackItem.createMany({
          data: result.items.map((item, order) => ({ ...item, order })),
        }),
      ]),
      10000
    )
    const items = await prisma.techStackItem.findMany({ orderBy: { order: 'asc' } })
    return NextResponse.json(toJson(items))
  } catch (error) {
    const info = getDbErrorInfo(error)
    console.error('Save tech stack error:', error)
    return NextResponse.json(
      { error: 'Failed to save tech stack', message: process.env.NODE_ENV === 'development' ? info.errorMessage : undefined },
      { status: 500 }
    )
  }
}
