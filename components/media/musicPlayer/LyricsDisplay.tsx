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
}

const CONTAINER_HEIGHT = 96 // px，显示约3行

export default function LyricsDisplay({ lyrics, currentTime }: LyricsDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLParagraphElement>(null)

  const activeIndex = useMemo(() => {
    if (!lyrics || lyrics.length === 0) return -1
    let idx = -1
    for (let i = 0; i < lyrics.length; i++) {
      if (lyrics[i].time <= currentTime) idx = i
      else break
    }
    return idx
  }, [lyrics, currentTime])

  // 初始化：第一行居中（scrollTop = 0 时 padding 顶对齐，需要让第一行在中间）
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    container.scrollTop = 0
  }, [lyrics])

  // 滚动到当前行居中（只操作容器，不影响页面滚动）
  useEffect(() => {
    const container = containerRef.current
    const active = activeRef.current
    if (!container || !active) return
    const containerRect = container.getBoundingClientRect()
    const activeRect = active.getBoundingClientRect()
    const offset =
      activeRect.top - containerRect.top + container.scrollTop - CONTAINER_HEIGHT / 2 + active.clientHeight / 2
    container.scrollTo({ top: offset, behavior: 'smooth' })
  }, [activeIndex])

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
      {/* paddingTop = CONTAINER_HEIGHT/2 让第一行初始居中，paddingBottom 同理让最后一行能滚到中间 */}
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
