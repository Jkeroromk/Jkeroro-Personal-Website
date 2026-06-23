/**
 * useCommentReactions Hook
 * 管理评论反应逻辑
 */

import { useState, useEffect, useRef } from 'react'
import { useToast } from '@/hooks/use-toast'
import { apiRequest } from '@/lib/api-client'

export function useCommentReactions() {
  const { toast } = useToast()
  const [userReactions, setUserReactions] = useState<Record<string, string[]>>({})
  const [userId, setUserId] = useState<string | null>(null)
  // 防止网络慢时用户快速连点同一个反应，导致 add+remove 两个请求相互抵消
  const pendingRef = useRef<Set<string>>(new Set())

  // 生成用户 ID
  const generateUserId = () => {
    if (typeof window === 'undefined') return null

    let savedUserId = localStorage.getItem('userId')
    if (!savedUserId) {
      const fingerprint =
        navigator.userAgent +
        navigator.language +
        (screen?.width || window.innerWidth) +
        (screen?.height || window.innerHeight) +
        new Date().getTimezoneOffset() +
        (navigator.platform || 'unknown')

      try {
        savedUserId =
          'user_' +
          btoa(fingerprint).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16)
      } catch (error) {
        savedUserId = 'user_' + fingerprint.replace(/[^a-zA-Z0-9]/g, '').substring(0, 16)
      }
      localStorage.setItem('userId', savedUserId)
    }
    return savedUserId
  }

  // 初始化用户 ID
  useEffect(() => {
    const newUserId = generateUserId()
    setUserId(newUserId)

    const savedReactions = localStorage.getItem('userReactions')
    if (savedReactions) {
      try {
        setUserReactions(JSON.parse(savedReactions))
      } catch (error) {
        // 静默处理解析错误
      }
    }
  }, [])

  // 保存反应到 localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('userReactions', JSON.stringify(userReactions))
    }
  }, [userReactions])

  // 处理反应
  const handleReaction = async (
    commentId: string,
    reactionType: string,
    onSuccess?: () => void
  ) => {
    if (!userId) {
      toast({
        title: 'Error',
        description: 'User not initialized',
        variant: 'destructive',
      })
      return
    }

    const pendingKey = `${commentId}:${reactionType}`
    if (pendingRef.current.has(pendingKey)) return
    pendingRef.current.add(pendingKey)

    try {
      const result = await apiRequest<{ action: 'added' | 'removed' }>(
        `/api/comments/${commentId}/reactions`,
        {
          method: 'POST',
          body: JSON.stringify({ type: reactionType, userId }),
        }
      )

      if (result.error) {
        throw new Error(result.error.message || 'Failed to toggle reaction')
      }

      // 以服务端实际执行的动作为准更新本地状态，避免本地猜测的状态和数据库不一致后越点越乱
      const wasAdded = result.data?.action === 'added'

      setUserReactions((prev) => {
        const currentReactions = Array.isArray(prev[commentId]) ? prev[commentId] : []

        if (wasAdded) {
          if (currentReactions.includes(reactionType)) return prev
          return { ...prev, [commentId]: [...currentReactions, reactionType] }
        }

        const newReactions = currentReactions.filter((r) => r !== reactionType)
        if (newReactions.length > 0) {
          return { ...prev, [commentId]: newReactions }
        }
        const { [commentId]: _, ...rest } = prev
        return rest
      })

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add reaction',
        variant: 'destructive',
      })
    } finally {
      pendingRef.current.delete(pendingKey)
    }
  }

  // 检查用户是否对评论有特定反应
  const hasUserReaction = (commentId: string, reactionType: string): boolean => {
    const userReactionsForComment = userReactions[commentId]
    if (Array.isArray(userReactionsForComment)) {
      return userReactionsForComment.includes(reactionType)
    }
    return userReactionsForComment === reactionType
  }

  return {
    userId,
    userReactions,
    handleReaction,
    hasUserReaction,
  }
}

