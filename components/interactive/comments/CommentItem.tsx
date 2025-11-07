/**
 * CommentItem Component
 * 单个评论项组件
 */

import { Comment } from '@/types/api'
import ClientTimeDisplay from '@/components/layout/ClientTimeDisplay'
import ReactionButtons from './ReactionButtons'

interface CommentItemProps {
  comment: Comment & { timestamp?: number }
  onReaction: (commentId: string, reactionType: string) => void
  hasUserReaction: (commentId: string, reactionType: string) => boolean
}

export default function CommentItem({
  comment,
  onReaction,
  hasUserReaction,
}: CommentItemProps) {
  return (
    <div className="group relative pt-2">
      <div className="bg-white/90 backdrop-blur-sm border border-gray-300/50 rounded-lg p-4 pb-3 hover:bg-white/95 transition-all duration-200 w-full max-w-full overflow-visible">
        <p className="text-black text-sm leading-relaxed font-semibold break-words overflow-wrap-anywhere">
          {comment.text}
        </p>
        <div className="flex items-center justify-between mt-3 gap-2 flex-wrap">
          <p className="text-gray-600 text-xs flex-shrink-0">
            <ClientTimeDisplay
              timestamp={comment.timestamp || comment.createdAt}
              fallback="Just now"
            />
          </p>

          <ReactionButtons
            comment={comment}
            onReaction={onReaction}
            hasUserReaction={hasUserReaction}
          />
        </div>
      </div>
    </div>
  )
}

