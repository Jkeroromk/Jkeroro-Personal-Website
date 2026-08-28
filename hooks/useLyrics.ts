/**
 * useLyrics Hook
 * 播放时自动从 LRCLIB 拉取歌词，结果缓存在内存中避免重复请求
 */

import { Track, LyricLine } from '@/types/api'

// 模块级缓存，key = "title|||artist"
// null  = 已查无歌词
// false = 查询中（防并发重复请求）
const lyricsCache = new Map<string, LyricLine[] | null | false>()

function cacheKey(track: Pick<Track, 'title' | 'subtitle'>) {
  return `${track.title}|||${track.subtitle}`
}

async function fetchLyrics(title: string, artist: string, duration?: number): Promise<LyricLine[] | null> {
  const params = new URLSearchParams({ title, artist })
  if (duration && duration > 0) params.set('duration', String(duration))
  const res = await fetch(`/api/lyrics/search?${params}`)
  if (!res.ok) throw new Error('fetch_error')
  const data = await res.json()
  if (!data.syncedLyrics) return null
  return parseLrc(data.syncedLyrics)
}

/** 预取一批歌词（在切歌前提前加载），fire-and-forget */
export function prefetchLyrics(tracks: Pick<Track, 'title' | 'subtitle'>[]) {
  for (const track of tracks) {
    const key = cacheKey(track)
    if (lyricsCache.has(key)) continue
    lyricsCache.set(key, false) // 标记加载中
    fetchLyrics(track.title, track.subtitle)
      .then(parsed => lyricsCache.set(key, parsed))
      .catch(() => lyricsCache.delete(key)) // 网络错误时删除，允许重试
  }
}

/** 预取所有歌词并等待完成（用于 loading 阶段，单首超时 6s）
 *  onProgress(loaded, total) 每首完成时回调，用于更新进度条
 */
export async function preloadAllLyrics(
  tracks: Pick<Track, 'title' | 'subtitle'>[],
  onProgress?: (loaded: number, total: number) => void
): Promise<void> {
  let loaded = 0
  await Promise.allSettled(
    tracks.map(async (track) => {
      const key = cacheKey(track)
      if (lyricsCache.has(key)) {
        loaded++
        onProgress?.(loaded, tracks.length)
        return
      }
      lyricsCache.set(key, false)
      try {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), 6000)
        const params = new URLSearchParams({ title: track.title, artist: track.subtitle })
        const res = await fetch(`/api/lyrics/search?${params}`, { signal: controller.signal })
        clearTimeout(timer)
        if (!res.ok) throw new Error('fetch_error')
        const data = await res.json()
        const parsed = data.syncedLyrics ? parseLrc(data.syncedLyrics) : null
        lyricsCache.set(key, parsed)
      } catch {
        lyricsCache.delete(key)
      } finally {
        loaded++
        onProgress?.(loaded, tracks.length)
      }
    })
  )
}

function parseLrc(lrcText: string): LyricLine[] | null {
  if (!lrcText?.trim()) return null
  const lines = lrcText.split('\n')
  const result: LyricLine[] = []
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const times: number[] = []
    let lastIndex = 0
    timeRegex.lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = timeRegex.exec(trimmed)) !== null) {
      const mins = parseInt(match[1])
      const secs = parseInt(match[2])
      const ms = parseInt(match[3].padEnd(3, '0'))
      times.push(mins * 60 + secs + ms / 1000)
      lastIndex = timeRegex.lastIndex
    }
    const text = trimmed.slice(lastIndex).trim()
    if (text && times.length > 0) {
      for (const time of times) result.push({ time, text })
    }
  }

  result.sort((a, b) => a.time - b.time)
  return result.length > 0 ? result : null
}
