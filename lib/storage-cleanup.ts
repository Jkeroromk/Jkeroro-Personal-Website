import { createServerClient } from '@/supabase'
import { prisma } from '@/lib/prisma'

/**
 * Supabase Storage 清理
 *
 * 数据库里只存文件的 URL，删记录时文件还留在 Storage 里。这里负责：
 * - 删歌 / 换音频或封面时，把不再被任何记录用到的旧文件删掉（removeUnusedFiles）
 * - 后台「清理文件」：列出两个桶里没被任何记录引用的文件，确认后删除（findOrphanFiles）
 *
 * 安全规则：
 * - 只处理本项目 Supabase 的 images / audio 两个桶，外链（iTunes、网易云封面等）不碰
 * - 删除前检查全部表：同一个文件被别的歌、图片、项目或纪念日背景用着，就不删
 */

export const MANAGED_BUCKETS = ['audio', 'images'] as const
export type ManagedBucket = (typeof MANAGED_BUCKETS)[number]

export interface StorageRef {
  bucket: ManagedBucket
  path: string
}

export interface OrphanFile extends StorageRef {
  size: number
  createdAt: string | null
  url: string
}

// 上传后要过一会儿才会写进数据库（例如封面先上传、再点保存），太新的文件不算孤儿
const ORPHAN_MIN_AGE_MS = 24 * 60 * 60 * 1000

/** 把本项目 Supabase 的公开 URL 解析成 { bucket, path }；不是本项目桶里的文件返回 null */
export function parseStorageUrl(url: string | null | undefined): StorageRef | null {
  if (!url) return null
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) return null
  let parsed: URL
  let origin: string
  try {
    parsed = new URL(url)
    origin = new URL(base).origin
  } catch {
    return null
  }
  if (parsed.origin !== origin) return null

  const m = parsed.pathname.match(/^\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+)$/)
  if (!m) return null
  const bucket = m[1] as ManagedBucket
  if (!MANAGED_BUCKETS.includes(bucket)) return null
  let path: string
  try {
    path = decodeURIComponent(m[2])
  } catch {
    path = m[2]
  }
  return { bucket, path }
}

/** 把所有可能存文件 URL 的记录拼成一段文本，用来判断某个文件还有没有被用到 */
async function loadReferenceCorpus(): Promise<string> {
  const [tracks, images, projects, anniversary] = await Promise.all([
    prisma.track.findMany({ select: { src: true, cover: true } }),
    prisma.image.findMany({ select: { src: true } }),
    prisma.project.findMany({ select: { image: true } }),
    prisma.anniversarySettings.findMany(),
  ])
  const raw = JSON.stringify([tracks, images, projects, anniversary])
  // JSON 里的 URL 可能被转义或编码，统一解码一份一起比较
  let decoded = raw
  try {
    decoded = decodeURIComponent(raw)
  } catch {
    /* 含非法 % 序列时只用原文 */
  }
  return raw + '\n' + decoded
}

function isReferenced(ref: StorageRef, corpus: string): boolean {
  const key = `/${ref.bucket}/${ref.path}`
  return corpus.includes(key) || corpus.includes(`/${ref.bucket}/${encodeURI(ref.path)}`)
}

function publicUrl(ref: StorageRef): string {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '')
  return `${base}/storage/v1/object/public/${ref.bucket}/${encodeURI(ref.path)}`
}

async function removeRefs(refs: StorageRef[]): Promise<StorageRef[]> {
  if (refs.length === 0) return []
  const supabase = createServerClient()
  const removed: StorageRef[] = []
  for (const bucket of MANAGED_BUCKETS) {
    const paths = refs.filter((r) => r.bucket === bucket).map((r) => r.path)
    if (paths.length === 0) continue
    const { data, error } = await supabase.storage.from(bucket).remove(paths)
    if (error) {
      console.error(`Storage remove failed (${bucket}):`, error.message)
      continue
    }
    for (const obj of data ?? []) removed.push({ bucket, path: obj.name })
  }
  return removed
}

/**
 * 删掉这些 URL 对应的、已经没有记录在用的 Storage 文件。
 * 在数据库记录删除/更新之后调用。失败只记日志，不影响主操作。
 */
export async function removeUnusedFiles(urls: (string | null | undefined)[]): Promise<StorageRef[]> {
  try {
    const seen = new Set<string>()
    const refs: StorageRef[] = []
    for (const url of urls) {
      const ref = parseStorageUrl(url)
      if (!ref) continue
      const k = `${ref.bucket}/${ref.path}`
      if (seen.has(k)) continue
      seen.add(k)
      refs.push(ref)
    }
    if (refs.length === 0) return []

    const corpus = await loadReferenceCorpus()
    const unused = refs.filter((r) => !isReferenced(r, corpus))
    return await removeRefs(unused)
  } catch (error) {
    console.error('Storage cleanup failed:', error)
    return []
  }
}

/** 递归列出一个桶里的全部文件 */
async function listBucket(bucket: ManagedBucket) {
  const supabase = createServerClient()
  const files: { path: string; size: number; createdAt: string | null }[] = []
  const queue = ['']
  while (queue.length > 0) {
    const prefix = queue.shift()!
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(prefix, { limit: 1000, offset, sortBy: { column: 'name', order: 'asc' } })
      if (error) throw new Error(`列出 ${bucket} 失败：${error.message}`)
      for (const item of data ?? []) {
        const path = prefix ? `${prefix}/${item.name}` : item.name
        if (item.id === null) {
          queue.push(path) // 文件夹
        } else if (item.name !== '.emptyFolderPlaceholder') {
          files.push({
            path,
            size: Number(item.metadata?.size ?? 0),
            createdAt: item.created_at ?? null,
          })
        }
      }
      if (!data || data.length < 1000) break
    }
  }
  return files
}

/** 找出两个桶里没有任何记录在用、且上传超过 24 小时的文件 */
export async function findOrphanFiles(): Promise<OrphanFile[]> {
  const corpus = await loadReferenceCorpus()
  const now = Date.now()
  const orphans: OrphanFile[] = []
  for (const bucket of MANAGED_BUCKETS) {
    for (const f of await listBucket(bucket)) {
      const ref = { bucket, path: f.path }
      if (isReferenced(ref, corpus)) continue
      const created = f.createdAt ? Date.parse(f.createdAt) : NaN
      if (Number.isFinite(created) && now - created < ORPHAN_MIN_AGE_MS) continue
      orphans.push({ ...ref, size: f.size, createdAt: f.createdAt, url: publicUrl(ref) })
    }
  }
  return orphans
}

/** 删除后台确认过的孤儿文件；删之前再检查一遍，期间被用上的跳过 */
export async function removeOrphanFiles(refs: StorageRef[]): Promise<StorageRef[]> {
  const valid = refs.filter(
    (r) =>
      r &&
      MANAGED_BUCKETS.includes(r.bucket) &&
      typeof r.path === 'string' &&
      r.path.length > 0 &&
      !r.path.includes('..')
  )
  if (valid.length === 0) return []
  const corpus = await loadReferenceCorpus()
  return removeRefs(valid.filter((r) => !isReferenced(r, corpus)))
}
