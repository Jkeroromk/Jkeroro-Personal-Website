/**
 * LyricsDisplay Component
 * 歌词同步显示组件（支持手动 offset 校准）
 */

'use client'

import { useEffect, useRef, useMemo, useState } from 'react'
import { LyricLine } from '@/types/api'

interface LyricsDisplayProps {
  lyrics: LyricLine[]
  currentTime: number
  loading?: boolean
  trackId?: string
}

const CONTAINER_HEIGHT = 96
const STORAGE_KEY = 'lyrics_offset'

function loadOffset(trackId: string): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return 0
    const map = JSON.parse(raw)
    return typeof map[trackId] === 'number' ? map[trackId] : 0
  } catch {
    return 0
  }
}

export default function LyricsDisplay({ lyrics, currentTime, loading, trackId }: LyricsDisplayProps) {
  const lineRefs       = useRef<(HTMLParagraphElement | null)[]>([])
  const currentTimeRef = useRef(currentTime)
  const blockUntilRef  = useRef<number>(0)
  const [offset, setOffset]       = useState(0)
  const [translateY, setTranslateY] = useState(CONTAINER_HEIGHT / 2)

  // 实时更新 currentTimeRef（不触发 effect）
  useEffect(() => { currentTimeRef.current = currentTime }, [currentTime])

  // 从 localStorage 读取 offset
  useEffect(() => {
    if (!trackId) { setOffset(0); return }
    setOffset(loadOffset(trackId))
  }, [trackId])

  // admin 面板更新时同步
  useEffect(() => {
    const handler = () => { if (trackId) setOffset(loadOffset(trackId)) }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [trackId])

  // 当前高亮行（用 offset 调整）
  const activeIndex = useMemo(() => {
    if (!lyrics || lyrics.length === 0) return -1
    const t = currentTime - offset
    let idx = -1
    for (let i = 0; i < lyrics.length; i++) {
      if (lyrics[i].time <= t) idx = i
      else break
    }
    return idx
  }, [lyrics, currentTime, offset])

  // 歌词加载/切换：若从头开始，锁定 2 秒不滚动
  useEffect(() => {
    setTranslateY(CONTAINER_HEIGHT / 2) // 重置到顶部
    if (currentTimeRef.current < 5) {
      blockUntilRef.current = Date.now() + 2000
    } else {
      blockUntilRef.current = 0
    }
  }, [lyrics])

  // 用 transform 滚到当前行居中（用户无法手动干预）
  useEffect(() => {
    if (blockUntilRef.current > 0) {
      if (Date.now() < blockUntilRef.current) return
      blockUntilRef.current = 0
    }
    if (activeIndex < 0) {
      setTranslateY(CONTAINER_HEIGHT / 2)
      return
    }
    const el = lineRefs.current[activeIndex]
    if (!el) return
    const lineCenter = el.offsetTop + el.offsetHeight / 2
    setTranslateY(CONTAINER_HEIGHT / 2 - lineCenter)
  }, [activeIndex])

  if (loading && (!lyrics || lyrics.length === 0)) {
    return (
      <div className="w-full flex flex-col items-center gap-2 py-3" style={{ height: `${CONTAINER_HEIGHT}px` }}>
        {[40, 60, 45].map((w, i) => (
          <div key={i} className="h-3 rounded-full bg-white/10 animate-pulse" style={{ width: `${w}%` }} />
        ))}
      </div>
    )
  }

  if (!lyrics || lyrics.length === 0) return null

  return (
    <div
      className="w-full overflow-hidden relative"
      style={{ height: `${CONTAINER_HEIGHT}px` }}
    >
      <div
        className="text-center px-2"
        style={{
          transform: `translateY(${translateY}px)`,
          transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          paddingBottom: `${CONTAINER_HEIGHT / 2}px`,
          willChange: 'transform',
        }}
      >
        {lyrics.map((line, i) => {
          const isActive = i === activeIndex
          const isPast   = i < activeIndex
          return (
            <p
              key={i}
              ref={el => { lineRefs.current[i] = el }}
              className="transition-all duration-300 leading-6 py-1 text-sm select-none"
              style={{
                color:           isActive ? '#ffffff' : isPast ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.25)',
                fontWeight:      isActive ? 600 : 400,
                transform:       isActive ? 'scale(1.05)' : 'scale(1)',
                transformOrigin: 'center',
              }}
            >
              {line.text}
            </p>
          )
        })}
      </div>
    </div>
  )
}
