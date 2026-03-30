/**
 * useLyrics Hook
 * 播放时自动从 LRCLIB 拉取歌词，结果缓存在内存中避免重复请求
 */

import { useState, useEffect, useRef } from 'react'
import { Track, LyricLine } from '@/types/api'

// 模块级缓存，key = "title|||artist"
const lyricsCache = new Map<string, LyricLine[] | null>()

function cacheKey(track: Track) {
  return `${track.title}|||${track.subtitle}`
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

    // 命中缓存直接用
    if (lyricsCache.has(key)) {
      setLyrics(lyricsCache.get(key) ?? null)
      return
    }

    // 取消上一次请求
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLyrics(null)
    setLoading(true)

    const params = new URLSearchParams({ title: track.title, artist: track.subtitle })

    fetch(`/api/lyrics/search?${params}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('fetch_error')
        return res.json()
      })
      .then((data) => {
        if (!data.syncedLyrics) {
          // 没有歌词（found: false 或只有 plainLyrics）—— 静默处理
          lyricsCache.set(key, null)
          setLyrics(null)
          return
        }
        const parsed = parseLrc(data.syncedLyrics)
        lyricsCache.set(key, parsed)
        setLyrics(parsed)
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          // 网络错误或其他异常，缓存 null 避免重复请求
          lyricsCache.set(key, null)
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
