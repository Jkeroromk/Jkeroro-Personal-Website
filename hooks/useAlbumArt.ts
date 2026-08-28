/**
 * useAlbumArt Hook
 * 曲目没有手动上传封面时，按歌名 + 歌手自动搜索专辑封面，结果按曲目缓存
 */

import { useState, useEffect } from 'react'
import { Track } from '@/types/api'

// 模块级缓存，key = "title|||artist"，value = 封面 URL 或 null（查无结果）
const artCache = new Map<string, string | null>()

function cacheKey(track: Pick<Track, 'title' | 'subtitle'>) {
  return `${track.title}|||${track.subtitle}`
}

export function useAlbumArt(track: Pick<Track, 'id' | 'title' | 'subtitle' | 'cover'> | null): string | null {
  const [art, setArt] = useState<string | null>(track?.cover ?? null)

  useEffect(() => {
    if (!track) {
      setArt(null)
      return
    }
    if (track.cover) {
      setArt(track.cover)
      return
    }

    const key = cacheKey(track)
    const cached = artCache.get(key)
    if (cached !== undefined) {
      setArt(cached)
      return
    }

    setArt(null)
    let cancelled = false
    const params = new URLSearchParams({ title: track.title, artist: track.subtitle || '' })
    fetch(`/api/media/cover-art/search?${params}`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        const url = data?.artwork ?? null
        artCache.set(key, url)
        if (!cancelled) setArt(url)
      })
      .catch(() => {
        artCache.set(key, null)
      })
    return () => {
      cancelled = true
    }
  }, [track?.id, track?.cover])

  return art
}
