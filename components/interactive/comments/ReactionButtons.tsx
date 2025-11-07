/**
 * ReactionButtons Component
 * 评论反应按钮组件
 */

import { useState } from 'react'
import { Smile, X } from 'lucide-react'
import { Comment } from '@/types/api'

interface ReactionButtonsProps {
  comment: Comment
  onReaction: (commentId: string, reactionType: string) => void
  hasUserReaction: (commentId: string, reactionType: string) => boolean
}

const reactionEmojis = {
  likes: '👍',
  fires: '🔥',
  hearts: '❤️',
  laughs: '😂',
  wows: '😮',
}

const reactionTypes = ['likes', 'fires', 'hearts', 'laughs', 'wows'] as const

export default function ReactionButtons({
  comment,
  onReaction,
  hasUserReaction,
}: ReactionButtonsProps) {
  const [showReactions, setShowReactions] = useState(false)

  // 获取有数量的表情反应
  const getReactionsWithCount = () => {
    const reactions = [
      { type: 'likes' as const, emoji: '👍', color: 'hover:text-blue-400' },
      { type: 'fires' as const, emoji: '🔥', color: 'hover:text-orange-400' },
      { type: 'hearts' as const, emoji: '❤️', color: 'hover:text-red-400' },
      { type: 'laughs' as const, emoji: '😂', color: 'hover:text-yellow-400' },
      { type: 'wows' as const, emoji: '😮', color: 'hover:text-purple-400' },
    ]

    return reactions.filter((reaction) => {
      const count = comment[reaction.type] || 0
      const userReacted = hasUserReaction(comment.id, reaction.type)
      return (count || 0) > 0 || userReacted
    })
  }

  const reactionsWithCount = getReactionsWithCount()

  return (
    <div className="flex items-center gap-1.5 flex-shrink-0 relative">
      {/* 如果有表情反应，显示有数量的表情 */}
      {reactionsWithCount.length > 0 && (
        <div className="flex items-center gap-0.5 flex-wrap">
          {reactionsWithCount.map((reaction) => {
            const count = comment[reaction.type] || 0
            const userReacted = hasUserReaction(comment.id, reaction.type)
            const displayCount = userReacted && count === 0 ? 1 : count

            return (
              <button
                key={reaction.type}
                onClick={() => onReaction(comment.id, reaction.type)}
                className={`flex items-center gap-0.5 ${
                  userReacted ? 'text-yellow-400 bg-yellow-400/20' : 'text-gray-400'
                } ${reaction.color} transition-colors text-xs px-1.5 py-1 rounded-full hover:bg-gray-700/50 active:bg-gray-700/70 touch-manipulation flex-shrink-0`}
                title={reaction.type}
              >
                <span className="text-sm">{reaction.emoji}</span>
                <span className="text-black font-bold text-xs">{displayCount}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* 表情开关按钮 - 始终显示 */}
      <button
        onClick={() => setShowReactions(!showReactions)}
        className="text-gray-400 hover:text-yellow-400 active:text-yellow-400 transition-colors text-xs px-1.5 py-1 rounded-full hover:bg-gray-700/50 active:bg-gray-700/70 border border-gray-500/70 hover:border-yellow-400/70 active:border-yellow-400/70 touch-manipulation flex-shrink-0"
        title={showReactions ? 'Close Reactions' : 'Add Reaction'}
      >
        {showReactions ? <X size={14} /> : <Smile size={14} />}
      </button>

      {/* 表情选择器 - 迷你化设计，绝对定位 */}
      {showReactions && (
        <div className="absolute right-0 bottom-full mb-1 z-50 flex items-center gap-0.5 bg-gray-900/95 backdrop-blur-sm border border-gray-600/70 rounded-lg px-1.5 py-1 shadow-xl touch-manipulation">
          {reactionTypes.map((type) => {
            const userReacted = hasUserReaction(comment.id, type)
            return (
              <button
                key={type}
                onClick={() => {
                  onReaction(comment.id, type)
                  setShowReactions(false)
                }}
                className={`${
                  userReacted ? 'bg-blue-400/20' : 'hover:bg-gray-700/50'
                } transition-all duration-200 text-base px-1.5 py-1 rounded hover:scale-110 active:scale-95 touch-manipulation`}
                title={type}
              >
                {reactionEmojis[type]}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

