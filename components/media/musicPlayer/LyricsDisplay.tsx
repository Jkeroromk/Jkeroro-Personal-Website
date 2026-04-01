/**
 * LyricsDisplay Component
 * 歌词同步显示组件（支持手动 offset 校准）
 * 无歌词时展示专辑封面占位
 */

'use client'

import { useEffect, useRef, useMemo, useState } from 'react'
import { LyricLine } from '@/types/api'

interface LyricsDisplayProps {
  lyrics: LyricLine[]
  currentTime: number
  loading?: boolean
  trackId?: string
  trackTitle?: string
  trackArtist?: string
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

export default function LyricsDisplay({
  lyrics,
  currentTime,
  loading,
  trackId,
  trackTitle = '',
  trackArtist = '',
}: LyricsDisplayProps) {
  const lineRefs       = useRef<(HTMLParagraphElement | null)[]>([])
  const currentTimeRef = useRef(currentTime)
  const blockUntilRef  = useRef<number>(0)
  const [offset, setOffset]         = useState(0)
  const [translateY, setTranslateY] = useState(CONTAINER_HEIGHT / 2)

  useEffect(() => { currentTimeRef.current = currentTime }, [currentTime])

  useEffect(() => {
    if (!trackId) { setOffset(0); return }
    setOffset(loadOffset(trackId))
  }, [trackId])

  useEffect(() => {
    const handler = () => { if (trackId) setOffset(loadOffset(trackId)) }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [trackId])

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

  useEffect(() => {
    setTranslateY(CONTAINER_HEIGHT / 2)
    if (currentTimeRef.current < 5) {
      blockUntilRef.current = Date.now() + 2000
    } else {
      blockUntilRef.current = 0
    }
  }, [lyrics])

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

  // ── 加载中 ──────────────────────────────────────────────
  if (loading && (!lyrics || lyrics.length === 0)) {
    return (
      <div className="w-full flex flex-col items-center gap-2 py-3" style={{ height: `${CONTAINER_HEIGHT}px` }}>
        {[40, 60, 45].map((w, i) => (
          <div key={i} className="h-3 rounded-full bg-white/10 animate-pulse" style={{ width: `${w}%` }} />
        ))}
      </div>
    )
  }

  // ── 无歌词：均衡器动画 ──────────────────────────────────
  if (!lyrics || lyrics.length === 0) {
    const bars = [
      { height: 32, duration: 0.85, delay: 0.00 },
      { height: 48, duration: 0.72, delay: 0.12 },
      { height: 24, duration: 0.95, delay: 0.07 },
      { height: 56, duration: 0.68, delay: 0.20 },
      { height: 36, duration: 0.80, delay: 0.04 },
      { height: 44, duration: 0.90, delay: 0.16 },
      { height: 28, duration: 0.75, delay: 0.09 },
    ]
    return (
      <div
        className="w-full flex items-center gap-5 px-2"
        style={{ height: `${CONTAINER_HEIGHT}px` }}
      >
        <style>{`
          @keyframes eq-bounce {
            0%, 100% { transform: scaleY(0.15); }
            50%       { transform: scaleY(1); }
          }
        `}</style>

        {/* 均衡器柱 */}
        <div className="flex items-end gap-[3px] flex-shrink-0" style={{ height: '56px' }}>
          {bars.map((bar, i) => (
            <div
              key={i}
              className="w-[5px] rounded-full bg-white/40"
              style={{
                height: `${bar.height}px`,
                transformOrigin: 'bottom',
                animation: `eq-bounce ${bar.duration}s ease-in-out ${bar.delay}s infinite`,
              }}
            />
          ))}
        </div>

        {/* 曲目信息 */}
        <div className="flex flex-col justify-center min-w-0">
          <p className="text-white/70 text-sm font-medium truncate leading-tight">
            {trackTitle || 'Unknown Title'}
          </p>
          {trackArtist && (
            <p className="text-white/35 text-xs truncate mt-0.5">{trackArtist}</p>
          )}
        </div>
      </div>
    )
  }

  // ── 歌词正文 ────────────────────────────────────────────
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
