/**
 * useLyrics Hook
 * 播放时自动从 LRCLIB 拉取歌词，结果缓存在内存中避免重复请求
 */

import { useState, useEffect, useRef } from 'react'
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

export function useLyrics(track: Track | null, duration?: number) {
  const [lyrics, setLyrics] = useState<LyricLine[] | null>(null)
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const refinedKeysRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!track) {
      setLyrics(null)
      return
    }

    setLyrics(null)

    const key = cacheKey(track)

    const doFetch = (controller: AbortController) => {
      lyricsCache.set(key, false)
      setLoading(true)
      const params = new URLSearchParams({ title: track.title, artist: track.subtitle })
      if (duration && duration > 0) params.set('duration', String(duration))
      fetch(`/api/lyrics/search?${params}`, { signal: controller.signal })
        .then(res => { if (!res.ok) throw new Error('fetch_error'); return res.json() })
        .then(data => {
          const parsed = data.syncedLyrics ? parseLrc(data.syncedLyrics) : null
          lyricsCache.set(key, parsed)
          setLyrics(parsed)
        })
        .catch(err => {
          lyricsCache.delete(key)
          if (err.name !== 'AbortError') setLyrics(null)
        })
        .finally(() => setLoading(false))
    }

    const cached = lyricsCache.get(key)

    // 命中缓存
    if (cached !== undefined && cached !== false) {
      setLyrics(cached)
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    // 预取进行中，轮询等待；若预取失败（key 被删除）则自己重新请求
    if (cached === false) {
      let cancelled = false
      const poll = setInterval(() => {
        if (cancelled) return
        const v = lyricsCache.get(key)
        if (v === false) return
        clearInterval(poll)
        if (v !== undefined) {
          // 预取成功
          setLyrics(v)
          setLoading(false)
        } else {
          // 预取失败，自己重新请求
          if (!cancelled) doFetch(controller)
        }
      }, 100)
      setLoading(true)
      return () => { cancelled = true; clearInterval(poll); controller.abort() }
    }

    // 未缓存，直接请求
    doFetch(controller)
    return () => controller.abort()
  }, [track?.id])

  // 音频元数据加载完、真实时长可用后，用时长重新校准一次匹配结果
  // （预取阶段不知道时长，可能选错版本导致歌词不对轨；这里纠正一次）
  useEffect(() => {
    if (!track || !duration || duration <= 0) return
    const key = cacheKey(track)
    if (refinedKeysRef.current.has(key)) return
    refinedKeysRef.current.add(key)

    let cancelled = false
    fetchLyrics(track.title, track.subtitle, duration)
      .then(parsed => {
        if (cancelled) return
        lyricsCache.set(key, parsed)
        setLyrics(parsed)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [track?.id, duration])

  return { lyrics, loading }
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
