/**
 * LyricsDisplay Component
 * 歌词同步显示组件
 */

'use client'

import { useEffect, useRef, useMemo } from 'react'
import { LyricLine } from '@/types/api'

interface LyricsDisplayProps {
  lyrics: LyricLine[]
  currentTime: number
  loading?: boolean
}

const CONTAINER_HEIGHT = 96

export default function LyricsDisplay({ lyrics, currentTime, loading }: LyricsDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLParagraphElement>(null)
  const justLoadedRef = useRef(false)

  const activeIndex = useMemo(() => {
    if (!lyrics || lyrics.length === 0) return -1
    let idx = -1
    for (let i = 0; i < lyrics.length; i++) {
      if (lyrics[i].time <= currentTime) idx = i
      else break
    }
    return idx
  }, [lyrics, currentTime])

  // 歌词加载/切换时重置到顶部，并标记跳过下一次滚动
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    justLoadedRef.current = true
    container.scrollTop = 0
  }, [lyrics])

  // 滚动到当前行居中（只操作容器，不影响页面滚动）
  useEffect(() => {
    // 歌词刚加载时跳过，避免直接跳到中间位置
    if (justLoadedRef.current) {
      justLoadedRef.current = false
      return
    }
    if (activeIndex < 0) return
    const container = containerRef.current
    const active = activeRef.current
    if (!container || !active) return
    const containerRect = container.getBoundingClientRect()
    const activeRect = active.getBoundingClientRect()
    const offset =
      activeRect.top - containerRect.top + container.scrollTop - CONTAINER_HEIGHT / 2 + active.clientHeight / 2
    container.scrollTo({ top: offset, behavior: 'smooth' })
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
      ref={containerRef}
      className="w-full overflow-y-auto text-center px-2"
      style={{
        height: `${CONTAINER_HEIGHT}px`,
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      <style>{`.lyrics-scroll::-webkit-scrollbar { display: none; }`}</style>
      <div className="lyrics-scroll" style={{ paddingTop: `${CONTAINER_HEIGHT / 2}px`, paddingBottom: `${CONTAINER_HEIGHT / 2}px` }}>
        {lyrics.map((line, i) => {
          const isActive = i === activeIndex
          const isPast = i < activeIndex
          return (
            <p
              key={i}
              ref={isActive ? activeRef : null}
              className="transition-all duration-300 leading-6 py-1 text-sm select-none"
              style={{
                color: isActive ? '#ffffff' : isPast ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.25)',
                fontWeight: isActive ? 600 : 400,
                transform: isActive ? 'scale(1.05)' : 'scale(1)',
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
