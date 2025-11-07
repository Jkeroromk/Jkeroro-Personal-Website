/**
 * CommentInput Component
 * 评论输入组件
 */

import { useState, FormEvent } from 'react'
import { useToast } from '@/hooks/use-toast'
import { apiRequest } from '@/lib/api-client'

interface CommentInputProps {
  onCommentAdded: () => void
}

export default function CommentInput({ onCommentAdded }: CommentInputProps) {
  const [comment, setComment] = useState('')
  const [commentError, setCommentError] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) {
      setCommentError(true)
      return
    }

    setSubmitting(true)
    try {
      const result = await apiRequest('/api/comments', {
        method: 'POST',
        body: JSON.stringify({ text: comment.trim() }),
      })

      if (result.error) {
        throw new Error(result.error.message || 'Failed to add comment')
      }

      setComment('')
      setCommentError(false)
      onCommentAdded()

      toast({
        title: 'Comment added!',
        description: 'Your comment has been posted.',
      })
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to add comment. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex-shrink-0 mt-4">
      <div className="flex gap-2">
        <textarea
          value={comment}
          onChange={(e) => {
            setComment(e.target.value)
            setCommentError(false)
          }}
          placeholder="Write a comment..."
          className={`flex-1 bg-white/10 border rounded-lg px-3 py-2 text-white placeholder-white/50 text-sm focus:outline-none focus:border-white/40 resize-none ${
            commentError ? 'border-red-500' : 'border-white/20'
          }`}
          rows={3}
          aria-label="Comment input"
        />
        <button
          type="submit"
          disabled={submitting || !comment.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors"
        >
          {submitting ? 'Posting...' : 'Post'}
        </button>
      </div>
      {commentError && (
        <p className="text-red-400 text-xs mt-1">Please enter a comment</p>
      )}
    </form>
  )
}

