/**
 * 把 iCloud 共享相簿同步到网站：
 * - 相簿里新加的照片 → 下载存到 Supabase Storage，加进 Snapshots / Anniversary
 * - 相簿里删掉的照片 → 网站上也删掉（文件由每周的存储清理回收）
 * - 在后台手动删掉的同步照片会记进 excluded，不会再被同步回来
 *
 * 每天由 /api/cron/album-sync 跑一次，后台也可以点「立即同步」。
 * 一次最多新加 MAX_NEW_PER_RUN 张、最多跑 TIME_BUDGET_MS，剩下的下次接着同步。
 */

import { prisma } from '@/lib/prisma'
import { fetchAlbum, fetchAssetUrls, parseShareToken, type AlbumPhoto } from '@/lib/icloud-album'
import { uploadToSupabase, generateFileName } from '@/lib/upload-to-supabase'

export const ALBUM_TARGETS = ['snapshots', 'anniversary'] as const
export type AlbumTarget = (typeof ALBUM_TARGETS)[number]

const MAX_NEW_PER_RUN = 24
const TIME_BUDGET_MS = 40_000
const CONCURRENCY = 4

interface Items {
  map?: Record<string, string> // anniversary: guid → 网站上的图片地址
  excluded?: string[]
}

export interface SyncResult {
  album: string
  total: number
  added: number
  removed: number
  remaining: number
  failed: number
  skippedRemoval?: boolean
}

export function isAlbumTarget(id: unknown): id is AlbumTarget {
  return typeof id === 'string' && (ALBUM_TARGETS as readonly string[]).includes(id)
}

function asItems(v: unknown): Items {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Items) : {}
}

async function downloadAndStore(url: string, guid: string): Promise<string> {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`下载失败 (${res.status})`)
  const type = (res.headers.get('content-type') || 'image/jpeg').split(';')[0]
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(type)) throw new Error(`不支持的格式 ${type}`)
  const ext = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg'
  const buffer = Buffer.from(await res.arrayBuffer())
  const { publicUrl } = await uploadToSupabase(buffer, generateFileName(`icloud-${guid.slice(0, 12)}.${ext}`), type, 'images')
  return publicUrl
}

/** 并发下载新照片，超时就停，返回成功的 guid → url */
async function storeNew(
  host: string,
  token: string,
  photos: AlbumPhoto[],
  started: number
): Promise<{ stored: Map<string, string>; failed: number }> {
  const stored = new Map<string, string>()
  let failed = 0
  if (!photos.length) return { stored, failed }

  const urls = await fetchAssetUrls(host, token, photos.map((p) => p.guid))
  let next = 0
  const worker = async () => {
    while (next < photos.length && Date.now() - started < TIME_BUDGET_MS) {
      const p = photos[next++]
      const url = urls[p.checksum]
      if (!url) { failed++; continue }
      try {
        stored.set(p.guid, await downloadAndStore(url, p.guid))
      } catch (err) {
        failed++
        console.error('[album-sync] photo failed', p.guid, err)
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker))
  return { stored, failed }
}

async function syncSnapshots(albumGuids: Set<string>, photos: AlbumPhoto[], excluded: Set<string>, ctx: { host: string; token: string; started: number; safeToRemove: boolean }) {
  const existing = await prisma.image.findMany({
    where: { source: 'icloud' },
    select: { id: true, externalId: true },
  })
  const have = new Set(existing.map((r) => r.externalId).filter(Boolean) as string[])

  let removed = 0
  if (ctx.safeToRemove) {
    const gone = existing.filter((r) => r.externalId && !albumGuids.has(r.externalId))
    if (gone.length) {
      const del = await prisma.image.deleteMany({ where: { id: { in: gone.map((r) => r.id) } } })
      removed = del.count
    }
  }

  const todo = photos.filter((p) => !have.has(p.guid) && !excluded.has(p.guid))
  const batch = todo.slice(0, MAX_NEW_PER_RUN)
  const { stored, failed } = await storeNew(ctx.host, ctx.token, batch, ctx.started)

  const maxOrder = await prisma.image.findFirst({ orderBy: { order: 'desc' }, select: { order: true } })
  let order = (maxOrder?.order ?? -1) + 1
  let added = 0
  for (const p of batch) {
    const src = stored.get(p.guid)
    if (!src) continue
    await prisma.image.create({
      data: {
        src,
        alt: p.caption,
        width: p.width,
        height: p.height,
        order: order++,
        source: 'icloud',
        externalId: p.guid,
      },
    })
    added++
  }
  return { added, removed, failed, remaining: todo.length - added }
}

async function syncAnniversary(albumGuids: Set<string>, photos: AlbumPhoto[], items: Items, ctx: { host: string; token: string; started: number; safeToRemove: boolean }) {
  const map = { ...(items.map || {}) }
  const excluded = new Set(items.excluded || [])

  const todo = photos.filter((p) => !map[p.guid] && !excluded.has(p.guid))
  const batch = todo.slice(0, MAX_NEW_PER_RUN)
  const { stored, failed } = await storeNew(ctx.host, ctx.token, batch, ctx.started)
  for (const [guid, url] of stored) map[guid] = url

  const removedUrls = new Set<string>()
  if (ctx.safeToRemove) {
    for (const [guid, url] of Object.entries(map)) {
      if (!albumGuids.has(guid)) { removedUrls.add(url); delete map[guid] }
    }
  }

  // 读一遍最新的设置再改，减少和后台同时操作时互相覆盖
  const settings = await prisma.anniversarySettings.findUnique({ where: { id: 'main' } })
  const current: string[] = Array.isArray(settings?.backgroundImages) ? (settings!.backgroundImages as string[]) : []
  const positions = (settings?.imagePositions && typeof settings.imagePositions === 'object'
    ? { ...(settings.imagePositions as Record<string, { x: number; y: number }>) }
    : {})

  const newUrls = [...stored.values()].filter((u) => !current.includes(u))
  const next = [...current.filter((u) => !removedUrls.has(u)), ...newUrls]
  for (const u of removedUrls) delete positions[u]
  for (const u of newUrls) positions[u] = positions[u] || { x: 50, y: 50 }

  if (newUrls.length || removedUrls.size) {
    await prisma.anniversarySettings.upsert({
      where: { id: 'main' },
      update: { backgroundImages: next, imagePositions: positions },
      create: { id: 'main', backgroundImages: next, imagePositions: positions },
    })
  }

  return {
    added: stored.size,
    removed: removedUrls.size,
    failed,
    remaining: todo.length - stored.size,
    items: { ...items, map },
  }
}

/** 同步一个相簿；结果和错误都记到 album_sources 里给后台显示 */
export async function syncAlbum(target: AlbumTarget): Promise<SyncResult> {
  const source = await prisma.albumSource.findUnique({ where: { id: target } })
  if (!source || !source.enabled) throw new Error('这个位置还没有接相簿')
  const token = parseShareToken(source.shareUrl)
  if (!token) throw new Error('相簿链接格式不对')

  const started = Date.now()
  try {
    const album = await fetchAlbum(token)
    const albumGuids = new Set(album.photos.map((p) => p.guid))
    const items = asItems(source.items)
    const excluded = new Set(items.excluded || [])

    // iCloud 偶尔会返回空列表；相簿突然变空时先不删网站上的照片，免得一次误判全删光
    const knownCount = target === 'anniversary'
      ? Object.keys(items.map || {}).length
      : await prisma.image.count({ where: { source: 'icloud' } })
    const safeToRemove = album.photos.length > 0 || knownCount === 0
    const ctx = { host: album.host, token, started, safeToRemove }

    let r: { added: number; removed: number; failed: number; remaining: number }
    let nextItems: Items = items
    if (target === 'snapshots') {
      r = await syncSnapshots(albumGuids, album.photos, excluded, ctx)
    } else {
      const { items: updated, ...counts } = await syncAnniversary(albumGuids, album.photos, items, ctx)
      r = counts
      nextItems = updated
    }

    const result: SyncResult = {
      album: album.name,
      total: album.photos.length,
      ...r,
      ...(safeToRemove ? {} : { skippedRemoval: true }),
    }
    await prisma.albumSource.update({
      where: { id: target },
      data: {
        albumName: album.name,
        items: JSON.parse(JSON.stringify(nextItems)),
        lastSyncedAt: new Date(),
        lastResult: JSON.parse(JSON.stringify(result)),
        lastError: null,
      },
    })
    return result
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await prisma.albumSource.update({ where: { id: target }, data: { lastError: message } }).catch(() => {})
    throw error
  }
}

/** 后台手动删掉了一张同步来的照片：记下来，下次不再同步回来 */
export async function excludeFromSync(target: AlbumTarget, guid: string) {
  const source = await prisma.albumSource.findUnique({ where: { id: target } })
  if (!source) return
  const items = asItems(source.items)
  const excluded = new Set(items.excluded || [])
  excluded.add(guid)
  const map = { ...(items.map || {}) }
  delete map[guid]
  await prisma.albumSource.update({
    where: { id: target },
    data: { items: JSON.parse(JSON.stringify({ ...items, map, excluded: [...excluded] })) },
  })
}

/** 纪念日轮播里删掉一张图时，按地址找到它对应的 iCloud guid（不是同步来的返回 null） */
export async function anniversaryGuidForUrl(url: string): Promise<string | null> {
  const source = await prisma.albumSource.findUnique({ where: { id: 'anniversary' } })
  const map = asItems(source?.items).map || {}
  return Object.entries(map).find(([, u]) => u === url)?.[0] ?? null
}
