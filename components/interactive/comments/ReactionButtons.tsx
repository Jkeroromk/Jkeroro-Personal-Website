'use client'

import { useState, memo, useRef, useEffect } from 'react'
import { Smile } from 'lucide-react'
import { Comment } from '@/types/api'

interface ReactionButtonsProps {
  comment: Comment
  onReaction: (commentId: string, reactionType: string) => void
  hasUserReaction: (commentId: string, reactionType: string) => boolean
}

const REACTIONS = [
  { type: 'likes'  as const, emoji: '👍', active: 'bg-blue-50   border-blue-200   text-blue-600'   },
  { type: 'fires'  as const, emoji: '🔥', active: 'bg-orange-50 border-orange-200 text-orange-600' },
  { type: 'hearts' as const, emoji: '❤️', active: 'bg-red-50    border-red-200    text-red-600'    },
  { type: 'laughs' as const, emoji: '😂', active: 'bg-amber-50  border-amber-200  text-amber-600'  },
  { type: 'wows'   as const, emoji: '😮', active: 'bg-purple-50 border-purple-200 text-purple-600' },
] as const

const KEYFRAMES = `
  @keyframes rx-pill-in  { from{opacity:0;transform:scale(0.4)} to{opacity:1;transform:scale(1)} }
  @keyframes rx-emoji    { 0%{transform:scale(1)} 40%{transform:scale(1.65)} 72%{transform:scale(0.85)} 100%{transform:scale(1)} }
  @keyframes rx-count    { from{opacity:0.5;transform:scale(1.35)} to{opacity:1;transform:scale(1)} }
`

const ReactionButtons = memo(function ReactionButtons({
  comment,
  onReaction,
  hasUserReaction,
}: ReactionButtonsProps) {
  const [pickerOpen, setPickerOpen]       = useState(false)
  const [pickerVisible, setPickerVisible] = useState(false)
  // Increment to re-trigger the emoji pop keyframe
  const [animKeys, setAnimKeys] = useState<Record<string, number>>({})
  // Optimistic count delta — cleared when server count syncs
  const [countAdj, setCountAdj] = useState<Record<string, number>>({})
  const wrapRef    = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    setCountAdj({})
  }, [comment.likes, comment.fires, comment.hearts, comment.laughs, comment.wows])

  useEffect(() => {
    if (!pickerOpen) return
    const handler = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) triggerClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [pickerOpen])

  const triggerOpen = () => {
    clearTimeout(closeTimer.current)
    setPickerOpen(true)
    requestAnimationFrame(() => requestAnimationFrame(() => setPickerVisible(true)))
  }

  const triggerClose = () => {
    setPickerVisible(false)
    closeTimer.current = setTimeout(() => setPickerOpen(false), 180)
  }

  const handleReact = (type: string) => {
    const wasReacted = hasUserReaction(comment.id, type)
    setCountAdj(prev => ({ ...prev, [type]: (prev[type] ?? 0) + (wasReacted ? -1 : 1) }))
    setAnimKeys(prev => ({ ...prev, [type]: (prev[type] ?? 0) + 1 }))
    onReaction(comment.id, type)
    triggerClose()
  }

  const visibleReactions = REACTIONS.filter(r => {
    const count = (comment[r.type] ?? 0) + (countAdj[r.type] ?? 0)
    return count > 0 || hasUserReaction(comment.id, r.type)
  })

  return (
    <div ref={wrapRef} className="flex items-center gap-1.5 flex-shrink-0">
      <style>{KEYFRAMES}</style>

      {/* Active pills */}
      {visibleReactions.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {visibleReactions.map(r => {
            const count   = (comment[r.type] ?? 0) + (countAdj[r.type] ?? 0)
            const reacted = hasUserReaction(comment.id, r.type)
            const display = reacted && count === 0 ? 1 : count

            return (
              <button
                key={r.type}
                onClick={() => handleReact(r.type)}
                style={{ animation: 'rx-pill-in 0.28s cubic-bezier(0.34,1.56,0.64,1) both' }}
                className={`
                  flex items-center gap-1 pl-1.5 pr-2 py-0.5 rounded-full border text-xs
                  transition-colors duration-150 touch-manipulation select-none cursor-pointer
                  ${reacted
                    ? r.active
                    : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {/* key change forces remount → re-fires animation */}
                <span
                  key={`e-${animKeys[r.type] ?? 0}`}
                  className="text-sm leading-none inline-block"
                  style={
                    (animKeys[r.type] ?? 0) > 0
                      ? { animation: 'rx-emoji 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards' }
                      : undefined
                  }
                >
                  {r.emoji}
                </span>
                {/* key change re-fires count pop */}
                <span
                  key={`c-${display}`}
                  className="font-bold leading-none tabular-nums"
                  style={{ animation: 'rx-count 0.18s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
                >
                  {display}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Smiley toggle + floating picker */}
      <div className="relative">
        <button
          onClick={() => pickerOpen ? triggerClose() : triggerOpen()}
          className={`
            flex items-center justify-center w-7 h-7 rounded-full border
            transition-all duration-150 touch-manipulation
            ${pickerOpen
              ? 'text-yellow-500 border-yellow-300 bg-yellow-50 scale-110'
              : 'text-gray-400 border-gray-200 bg-gray-50 hover:text-yellow-500 hover:border-yellow-300 hover:bg-yellow-50 hover:scale-105'
            }
          `}
        >
          <Smile size={13} />
        </button>

        {pickerOpen && (
          <div
            className={`
              absolute right-0 bottom-full mb-2 z-50
              flex items-center gap-0.5 p-1.5
              bg-gray-900/96 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl
              transition-all duration-200 origin-bottom-right
              ${pickerVisible
                ? 'opacity-100 scale-100 translate-y-0'
                : 'opacity-0 scale-90 translate-y-1.5 pointer-events-none'
              }
            `}
          >
            {REACTIONS.map((r, i) => {
              const reacted = hasUserReaction(comment.id, r.type)
              return (
                <button
                  key={r.type}
                  onClick={() => handleReact(r.type)}
                  style={{
                    animation: `rx-pill-in 0.22s cubic-bezier(0.34,1.56,0.64,1) ${i * 35}ms both`,
                  }}
                  className={`
                    relative w-9 h-9 text-xl rounded-xl flex items-center justify-center
                    touch-manipulation transition-all duration-100
                    hover:scale-125 active:scale-90
                    ${reacted ? 'bg-white/15 ring-1 ring-white/25' : 'hover:bg-white/10'}
                  `}
                >
                  {r.emoji}
                  {reacted && (
                    <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-blue-400 ring-1 ring-gray-900" />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
})

export default ReactionButtons
