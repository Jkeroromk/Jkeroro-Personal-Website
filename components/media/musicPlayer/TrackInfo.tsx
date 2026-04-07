/**
 * TrackInfo Component
 * 曲目信息显示组件
 */

'use client'

import { useRef, useEffect, useState } from 'react'
import { Track } from '@/types/api'

interface TrackInfoProps {
  track: Track | null
}

export default function TrackInfo({ track }: TrackInfoProps) {
  const titleRef = useRef<HTMLSpanElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollDist, setScrollDist] = useState(0)

  useEffect(() => {
    const titleEl = titleRef.current
    const containerEl = containerRef.current
    if (titleEl && containerEl) {
      const diff = titleEl.scrollWidth - containerEl.clientWidth
      setScrollDist(diff > 0 ? diff : 0)
    }
  }, [track?.title])

  return (
    <>
      {scrollDist > 0 && (
        <style>{`
          @keyframes title-scroll {
            0%, 20%  { transform: translateX(0); }
            80%, 100% { transform: translateX(-${scrollDist}px); }
          }
        `}</style>
      )}
      <div
        ref={containerRef}
        className={`mb-2 w-full overflow-hidden flex items-center ${scrollDist > 0 ? 'justify-start' : 'justify-center'}`}
        style={{ height: '28px' }}
      >
        <span
          ref={titleRef}
          className="text-xl font-bold whitespace-nowrap flex-shrink-0"
          style={
            scrollDist > 0
              ? { animation: 'title-scroll 5s ease-in-out infinite alternate' }
              : {}
          }
        >
          {track?.title || 'No Track'}
        </span>
      </div>
      {track?.subtitle && (
        <p
          className="text-sm text-gray-300 mb-3 truncate w-full text-center"
          style={{ height: '20px' }}
        >
          {track.subtitle}
        </p>
      )}
    </>
  )
}
