/**
 * useAlbumArt Hook
 * 曲目没有手动上传封面时，按歌名 + 歌手自动搜索专辑封面，结果按曲目缓存
 */

import { useState, useEffect, useRef } from 'react'
import { Track } from '@/types/api'

// 模块级缓存，key = "title|||artist"，value = 封面 URL 或 null（查无结果）
const artCache = new Map<string, string | null>()
const LS_PREFIX = 'albumart_v1:'

function cacheKey(track: Pick<Track, 'title' | 'subtitle'>) {
  return `${track.title}|||${track.subtitle}`
}

// 从 localStorage 读取持久化缓存（返回 undefined 表示未命中）
function readPersisted(key: string): string | null | undefined {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key)
    if (raw === null) return undefined
    return raw === '' ? null : raw
  } catch {
    return undefined
  }
}

// 只持久化成功结果，失败不缓存（允许刷新后重试）
function writePersisted(key: string, url: string) {
  try {
    localStorage.setItem(LS_PREFIX + key, url)
  } catch {}
}

export function useAlbumArt(track: Pick<Track, 'id' | 'title' | 'subtitle' | 'cover'> | null): string | null {
  const [art, setArt] = useState<string | null>(track?.cover ?? null)
  const prevIdRef = useRef<Track['id'] | null | undefined>(null)

  useEffect(() => {
    if (!track) {
      setArt(null)
      prevIdRef.current = null
      return
    }
    if (track.cover) {
      setArt(track.cover)
      prevIdRef.current = track.id
      return
    }

    const key = cacheKey(track)

    // 模块内存缓存命中
    if (artCache.has(key)) {
      setArt(artCache.get(key) ?? null)
      prevIdRef.current = track.id
      return
    }

    // localStorage 持久化缓存命中（跨刷新）
    const persisted = readPersisted(key)
    if (persisted !== undefined) {
      artCache.set(key, persisted)
      setArt(persisted)
      prevIdRef.current = track.id
      return
    }

    // 只有真正切换到不同曲目时才清空封面，避免同曲重渲染时出现闪烁
    if (prevIdRef.current !== track.id) {
      setArt(null)
    }
    prevIdRef.current = track.id

    let cancelled = false
    const params = new URLSearchParams({ title: track.title, artist: track.subtitle || '' })
    fetch(`/api/media/cover-art/search?${params}`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        const url = data?.artwork ?? null
        if (url) {
          artCache.set(key, url)
          writePersisted(key, url)
        }
        // 失败不写缓存，下次页面加载时允许重试
        if (!cancelled) setArt(url)
      })
      .catch(() => {
        // 网络错误同样不缓存，允许重试
      })
    return () => {
      cancelled = true
    }
  }, [track?.id, track?.cover])

  return art
}
