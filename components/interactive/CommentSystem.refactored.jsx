/**
 * CommentSystem Component (Refactored)
 * 评论系统主组件 - 重构版本
 */

'use client'

import { useState } from 'react'
import { Button } from '../ui/button'
import { MessageSquare } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from '@/components/ui/alert-dialog'
import { useComments } from '@/hooks/useComments'
import { useCommentReactions } from '@/hooks/useCommentReactions'
import CommentList from './comments/CommentList'
import CommentInput from './comments/CommentInput'

const CommentSystem = () => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [displayedCount, setDisplayedCount] = useState(5)
  const [loadingMore, setLoadingMore] = useState(false)
  const { allComments, loading, error, refetch } = useComments()
  const { handleReaction, hasUserReaction } = useCommentReactions()

  // 显示的评论
  const displayedComments = allComments.slice(0, displayedCount)
  const hasMoreComments = allComments.length > displayedCount

  // 加载更多评论
  const handleLoadMore = () => {
    setLoadingMore(true)
    const newCount = displayedCount + 5
    setDisplayedCount(newCount)
    setLoadingMore(false)
  }

  // 评论添加后的回调
  const handleCommentAdded = () => {
    refetch()
  }

  // 处理反应
  const handleCommentReaction = (commentId: string, reactionType: string) => {
    handleReaction(commentId, reactionType, () => {
      refetch()
    })
  }

  return (
    <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" className="text-white hover:text-black">
          <MessageSquare /> Comments
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-black text-white border border-gray-400 shadow-lg scale-[0.9] sm:scale-[1] max-h-[90vh] flex flex-col">
        <AlertDialogHeader className="flex-shrink-0">
          <AlertDialogTitle className="text-base font-semibold">Comments</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-300 mt-2">
            Share your thoughts and interact with others!
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex-1 min-h-0 flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-400 text-sm">加载中...</p>
            </div>
          ) : error ? (
            <div className="bg-red-100/90 backdrop-blur-sm border border-red-300/50 rounded-lg p-3 flex-shrink-0">
              <p className="text-red-600 text-sm">{error.message || 'Failed to load comments'}</p>
            </div>
          ) : (
            <>
              <CommentList
                comments={displayedComments}
                onReaction={handleCommentReaction}
                hasUserReaction={hasUserReaction}
                onLoadMore={hasMoreComments ? handleLoadMore : undefined}
                hasMore={hasMoreComments}
                loadingMore={loadingMore}
              />
              <CommentInput onCommentAdded={handleCommentAdded} />
            </>
          )}
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default CommentSystem

