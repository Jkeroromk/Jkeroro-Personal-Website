/**
 * useComments Hook
 * 管理评论数据
 */

import { useState, useEffect } from 'react'
import { useApiArray } from './useApiArray'
import { Comment } from '@/types/api'
import { getRealtimeClient } from '@/lib/realtime-client'

export function useComments() {
  const { data: apiComments, loading, error, refetch } = useApiArray<Comment>(
    '/api/comments'
  )
  const [allComments, setAllComments] = useState<Comment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(true)

  // 排序评论
  const sortComments = (comments: Comment[]) => {
    return comments
      .map((c) => ({
        ...c,
        timestamp: new Date(c.createdAt).getTime(),
      }))
      .sort((a, b) => b.timestamp - a.timestamp)
  }

  // 更新 API 数据
  useEffect(() => {
    if (apiComments) {
      const sorted = sortComments(apiComments)
      setAllComments(sorted)
      setCommentsLoading(false)
    }
  }, [apiComments])

  // 实时更新
  useEffect(() => {
    const realtimeClient = getRealtimeClient()
    const unsubscribe = realtimeClient.subscribe('comments', (data: Comment[]) => {
      const sorted = sortComments(data)
      setAllComments(sorted)
      setCommentsLoading(false)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  return {
    allComments,
    comments: allComments,
    loading: loading || commentsLoading,
    error,
    refetch,
  }
}

