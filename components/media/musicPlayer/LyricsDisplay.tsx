/**
 * LyricsDisplay Component
 * 歌词同步显示组件 - 转盘选择器效果
 * hasCoverInLayout: 父层已展示封面时，歌词区高度收窄匹配封面高度
 */

'use client'

import { useEffect, useRef, useMemo, useState } from 'react'
import { LyricLine } from '@/types/api'

interface LyricsDisplayProps {
  lyrics: LyricLine[]
  currentTime: number
  lyricsOffset?: number
  hasCover?: boolean
}

const HEIGHT_WITHOUT_COVER = 130

const FADE_MASK = 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)'

export default function LyricsDisplay({
  lyrics,
  currentTime,
  lyricsOffset = 0,
  hasCover = false,
}: LyricsDisplayProps) {
  const lineRefs       = useRef<(HTMLParagraphElement | null)[]>([])
  const currentTimeRef = useRef(currentTime)
  const blockUntilRef  = useRef<number>(0)

  const hasLyrics    = !!(lyrics && lyrics.length > 0)
  const lyricsHeight = HEIGHT_WITHOUT_COVER
  const lyricsCenter = lyricsHeight / 2

  const [translateY, setTranslateY] = useState(lyricsCenter)

  useEffect(() => { currentTimeRef.current = currentTime }, [currentTime])

  const activeIndex = useMemo(() => {
    if (!hasLyrics) return -1
    const t = currentTime - lyricsOffset
    let idx = -1
    for (let i = 0; i < lyrics.length; i++) {
      if (lyrics[i].time <= t) idx = i
      else break
    }
    return idx
  }, [lyrics, currentTime, lyricsOffset, hasLyrics])

  useEffect(() => {
    setTranslateY(lyricsCenter)
    if (currentTimeRef.current < 5) {
      blockUntilRef.current = Date.now() + 2000
    } else {
      blockUntilRef.current = 0
    }
  }, [lyrics, lyricsCenter])

  useEffect(() => {
    if (blockUntilRef.current > 0) {
      if (Date.now() < blockUntilRef.current) return
      blockUntilRef.current = 0
    }
    if (activeIndex < 0) {
      setTranslateY(lyricsCenter)
      return
    }
    const el = lineRefs.current[activeIndex]
    if (!el) return
    const lineCenter = el.offsetTop + el.offsetHeight / 2
    setTranslateY(lyricsCenter - lineCenter)
  }, [activeIndex, lyricsCenter])

  // 转盘效果：距当前行越远越小越淡
  const getLyricStyle = (i: number) => {
    const dist       = activeIndex < 0 ? Math.abs(i) : Math.abs(i - activeIndex)
    const scales     = [1.12, 0.82, 0.65, 0.52]
    const scale      = scales[Math.min(dist, scales.length - 1)]
    const colors     = ['#ffffff', 'rgba(255,255,255,0.35)', 'rgba(255,255,255,0.15)', 'rgba(255,255,255,0.06)']
    const color      = colors[Math.min(dist, colors.length - 1)]
    const fontWeight = dist === 0 ? 700 : 400
    return { color, fontWeight, transform: `scale(${scale})`, transformOrigin: 'center' as const }
  }

  // ── 无歌词：有封面时留白（背景已表达），无封面时显示均衡器 ──
  if (!hasLyrics) {
    if (hasCover) return <div style={{ height: `${lyricsHeight}px` }} />

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
        className="w-full flex items-center justify-center"
        style={{ height: `${lyricsHeight}px` }}
      >
        <style>{`
          @keyframes eq-bounce {
            0%, 100% { transform: scaleY(0.15); }
            50%       { transform: scaleY(1); }
          }
        `}</style>
        <div className="flex items-end gap-[3px]" style={{ height: '56px' }}>
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
      </div>
    )
  }

  // ── 有歌词：转盘滚动 ────────────────────────────────────
  return (
    <div
      className="w-full overflow-hidden relative"
      style={{
        height: `${lyricsHeight}px`,
        maskImage: FADE_MASK,
        WebkitMaskImage: FADE_MASK,
      }}
    >
      <div
        className="text-center px-2"
        style={{
          transform: `translateY(${translateY}px)`,
          transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          paddingBottom: `${lyricsHeight / 2}px`,
          willChange: 'transform',
        }}
      >
        {lyrics.map((line, i) => (
          <p
            key={i}
            ref={el => { lineRefs.current[i] = el }}
            className="transition-all duration-300 leading-6 py-1 text-sm select-none"
            style={getLyricStyle(i)}
          >
            {line.text}
          </p>
        ))}
      </div>
    </div>
  )
}
