/**
 * CommentList Component
 * 评论列表组件
 */

import { Comment } from '@/types/api'
import CommentItem from './CommentItem'

interface CommentListProps {
  comments: (Comment & { timestamp?: number })[]
  onReaction: (commentId: string, reactionType: string) => void
  hasUserReaction: (commentId: string, reactionType: string) => boolean
  onLoadMore?: () => void
  hasMore?: boolean
  loadingMore?: boolean
}

export default function CommentList({
  comments,
  onReaction,
  hasUserReaction,
  onLoadMore,
  hasMore,
  loadingMore,
}: CommentListProps) {
  if (comments.length === 0) {
    return (
      <div className="text-center py-6 flex-shrink-0">
        <div className="w-12 h-12 mx-auto mb-3 bg-gray-800/50 rounded-full flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-gray-600 border-t-white rounded-full animate-spin"></div>
        </div>
        <p className="text-gray-400 text-sm">No comments yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 flex-1 overflow-y-auto pr-2 min-h-0">
      {comments.map((comment, index) => (
        <CommentItem
          key={comment.id || index}
          comment={comment}
          onReaction={onReaction}
          hasUserReaction={hasUserReaction}
        />
      ))}

      {hasMore && onLoadMore && (
        <div className="flex justify-center pt-2">
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors"
          >
            {loadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  )
}

