/**
 * iCloud 共享相簿 → 网站。两个位置用法不一样：
 *
 * slot:<imageId>（首页照片区的某一格，比如豆豆那张；每一格可以各接一个相簿）：
 *   每天从相簿里随机挑一张，下载下来替换那一格。只存当天那一张，
 *   换下来的旧图由每周的存储清理回收。最近用过的会尽量避开，不会连着重复。
 *
 * anniversary（纪念日轮播）：整本同步
 *   - 相簿里新加的照片 → 下载存到 Supabase Storage，加进轮播
 *   - 相簿里删掉的照片 → 轮播里也删掉
 *   - 在后台手动删掉的同步照片会记进 excluded，不会再被同步回来
 *   一次最多新加 MAX_NEW_PER_RUN 张、最多跑 TIME_BUDGET_MS，剩下的下次接着同步。
 *
 * 每天由 /api/cron/album-sync 跑一次，后台也可以手动触发。
 */

import { prisma } from '@/lib/prisma'
import { fetchAlbum, fetchAssetUrls, parseShareToken, type AlbumPhoto } from '@/lib/icloud-album'
import { uploadToSupabase, generateFileName } from '@/lib/upload-to-supabase'

// 'anniversary' = 纪念日轮播；'slot:<images.id>' = 首页照片区的某一格
export type AlbumTarget = 'anniversary' | `slot:${string}`

const SLOT_RE = /^slot:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

export const slotTarget = (imageId: string): AlbumTarget => `slot:${imageId}`
const slotImageId = (target: AlbumTarget) => (target.startsWith('slot:') ? target.slice(5) : null)

const MAX_NEW_PER_RUN = 24
const TIME_BUDGET_MS = 40_000
const CONCURRENCY = 4

interface Items {
  map?: Record<string, string> // anniversary: guid → 网站上的图片地址
  excluded?: string[] // anniversary: 后台手动删掉、不要再同步回来的
  recent?: string[] // slot: 最近用过的 guid，挑新照片时避开
}

export interface SyncResult {
  album: string
  total: number
  added: number
  removed: number
  remaining: number
  failed: number
  skippedRemoval?: boolean
  picked?: string // slot: 今天换上的照片地址
}

export function isAlbumTarget(id: unknown): id is AlbumTarget {
  return typeof id === 'string' && (id === 'anniversary' || SLOT_RE.test(id))
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

/** 某一格：从相簿随机挑一张（避开最近用过的），替换这一格 */
async function rotateSlot(imageId: string, photos: AlbumPhoto[], items: Items, ctx: { host: string; token: string }) {
  const slot = await prisma.image.findUnique({ where: { id: imageId }, select: { id: true, externalId: true } })
  if (!slot) throw new Error('要替换的那张照片已经被删了，请重新选一格')
  if (!photos.length) throw new Error('相簿里没有照片（或者 iCloud 这次返回了空列表）')

  // 最多记住最近 30 张，但至少留一张可选
  const keep = Math.min(30, photos.length - 1)
  const recent = new Set([slot.externalId, ...(items.recent || [])].filter(Boolean).slice(0, Math.max(keep, 1)) as string[])
  const pool = photos.filter((p) => !recent.has(p.guid))
  const candidates = pool.length ? pool : photos

  // 挑一张下载；失败就换一张再试，最多试 3 次
  const tried = new Set<string>()
  for (let attempt = 0; attempt < 3; attempt++) {
    const left = candidates.filter((p) => !tried.has(p.guid))
    if (!left.length) break
    const p = left[Math.floor(Math.random() * left.length)]
    tried.add(p.guid)
    try {
      const urls = await fetchAssetUrls(ctx.host, ctx.token, [p.guid])
      const url = urls[p.checksum]
      if (!url) continue
      const src = await downloadAndStore(url, p.guid)
      await prisma.image.update({
        where: { id: slot.id },
        data: {
          src,
          width: p.width,
          height: p.height,
          imageOffsetX: 50,
          imageOffsetY: 50,
          source: 'icloud',
          externalId: p.guid,
        },
      })
      const nextRecent = [p.guid, ...(items.recent || []).filter((g) => g !== p.guid)].slice(0, 30)
      return { picked: src, items: { ...items, recent: nextRecent }, failed: attempt }
    } catch (err) {
      console.error('[album-sync] rotate failed for', p.guid, err)
    }
  }
  throw new Error('下载照片失败，稍后再试')
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

    let result: SyncResult
    let nextItems: Items = items
    const imageId = slotImageId(target)
    if (imageId) {
      const r = await rotateSlot(imageId, album.photos, items, { host: album.host, token })
      nextItems = r.items
      result = { album: album.name, total: album.photos.length, added: 1, removed: 0, remaining: 0, failed: r.failed, picked: r.picked }
    } else {
      // iCloud 偶尔会返回空列表；相簿突然变空时先不删网站上的照片，免得一次误判全删光
      const safeToRemove = album.photos.length > 0 || Object.keys(items.map || {}).length === 0
      const { items: updated, ...counts } = await syncAnniversary(albumGuids, album.photos, items, {
        host: album.host, token, started, safeToRemove,
      })
      nextItems = updated
      result = {
        album: album.name,
        total: album.photos.length,
        ...counts,
        ...(safeToRemove ? {} : { skippedRemoval: true }),
      }
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

/** 断开某一格的相簿：照片留着当普通照片（去掉 iCloud 标记） */
export async function detachSlot(imageId: string, { keepImage = true } = {}) {
  await prisma.albumSource.deleteMany({ where: { id: slotTarget(imageId) } })
  if (keepImage) {
    await prisma.image.updateMany({ where: { id: imageId }, data: { source: 'manual', externalId: null } })
  }
}

/** 纪念日轮播里手动删掉了一张同步来的照片：记下来，下次不再同步回来 */
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
