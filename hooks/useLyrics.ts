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

async function fetchLyrics(title: string, artist: string): Promise<LyricLine[] | null> {
  const params = new URLSearchParams({ title, artist })
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

export function useLyrics(track: Track | null) {
  const [lyrics, setLyrics] = useState<LyricLine[] | null>(null)
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!track) {
      setLyrics(null)
      return
    }

    const key = cacheKey(track)
    const cached = lyricsCache.get(key)

    // 命中缓存（已有结果或确认无歌词）
    if (cached !== undefined && cached !== false) {
      setLyrics(cached)
      return
    }

    // 如果预取已在进行中，轮询等待结果
    if (cached === false) {
      let cancelled = false
      const poll = setInterval(() => {
        if (cancelled) return
        const v = lyricsCache.get(key)
        if (v !== false && v !== undefined) {
          clearInterval(poll)
          setLyrics(v ?? null)
          setLoading(false)
        }
      }, 100)
      setLoading(true)
      return () => { cancelled = true; clearInterval(poll) }
    }

    // 未缓存，发起请求
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    lyricsCache.set(key, false) // 标记加载中

    setLyrics(null)
    setLoading(true)

    const params = new URLSearchParams({ title: track.title, artist: track.subtitle })
    fetch(`/api/lyrics/search?${params}`, { signal: controller.signal })
      .then(res => { if (!res.ok) throw new Error('fetch_error'); return res.json() })
      .then(data => {
        const parsed = data.syncedLyrics ? parseLrc(data.syncedLyrics) : null
        lyricsCache.set(key, parsed)
        setLyrics(parsed)
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          lyricsCache.delete(key) // 网络错误允许重试
          setLyrics(null)
        }
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [track?.id])

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
