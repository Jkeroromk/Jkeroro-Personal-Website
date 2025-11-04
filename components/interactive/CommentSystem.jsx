'use client'

import { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { MessageSquare } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ToastAction } from '@/components/ui/toast'
import ClientTimeDisplay from '../layout/ClientTimeDisplay'
import { Smile, X } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'

const CommentSystem = () => {
  const [comment, setComment] = useState("")
  const [comments, setComments] = useState([])
  const [commentsError, setCommentsError] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [commentError, setCommentError] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMoreComments, setHasMoreComments] = useState(true)
  const [showReactions, setShowReactions] = useState({})
  const [userReactions, setUserReactions] = useState({})
  const { toast } = useToast()

  // Generate user ID (client-side only)
  const generateUserId = () => {
    if (typeof window === 'undefined') return null
    
    let savedUserId = localStorage.getItem('userId');
    if (!savedUserId) {
      const fingerprint = navigator.userAgent + 
                         navigator.language + 
                         (screen?.width || window.innerWidth) + 
                         (screen?.height || window.innerHeight) + 
                         new Date().getTimezoneOffset() +
                         (navigator.platform || 'unknown');
      
      try {
        savedUserId = 'user_' + btoa(fingerprint).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
      } catch (error) {
        savedUserId = 'user_' + fingerprint.replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
      }
      localStorage.setItem('userId', savedUserId);
    }
    return savedUserId;
  };

  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const newUserId = generateUserId();
    setUserId(newUserId);

    const savedReactions = localStorage.getItem('userReactions');
    if (savedReactions) {
      try {
        setUserReactions(JSON.parse(savedReactions));
      } catch (error) {
        // Silently handle parsing errors
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('userReactions', JSON.stringify(userReactions));
    }
  }, [userReactions]);

  // Fetch comments from API
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await fetch('/api/comments')
        if (!response.ok) throw new Error('Failed to fetch comments')
        
        const data = await response.json()
      const sortedComments = data
        .map(c => ({ ...c, timestamp: new Date(c.createdAt).getTime() }))
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5)
        
        setComments(sortedComments)
        setCommentsError(null)
      } catch (error) {
        console.error('Error fetching comments:', error)
        setCommentsError('Failed to load comments')
      }
    }

    fetchComments()
    
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchComments, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!comment.trim()) {
      setCommentError(true)
      return
    }

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: comment.trim() }),
      })

      if (!response.ok) throw new Error('Failed to add comment')

      setComment("")
      setCommentError(false)
      setDialogOpen(false)
      
      // Refresh comments
      const updatedResponse = await fetch('/api/comments')
      const updatedData = await updatedResponse.json()
      const sortedComments = updatedData
        .map(c => ({ ...c, timestamp: new Date(c.createdAt).getTime() }))
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5)
      setComments(sortedComments)

      toast({
        title: "Comment added!",
        description: "Your comment has been posted.",
      })
    } catch (error) {
      console.error('Error adding comment:', error)
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleCommentReaction = async (commentId, reactionType) => {
    if (!userId) {
      toast({
        title: "Error",
        description: "User not initialized",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/comments/${commentId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: reactionType, userId }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to toggle reaction')
      }

      const result = await response.json()
      
      // Update local user reactions state (support multiple reactions per comment)
      setUserReactions(prev => {
        const currentReactions = prev[commentId] || []
        
        if (Array.isArray(currentReactions)) {
          // Check if user already reacted with this type
          if (currentReactions.includes(reactionType)) {
            // Remove the reaction
            const newReactions = currentReactions.filter(r => r !== reactionType)
            return {
              ...prev,
              [commentId]: newReactions.length > 0 ? newReactions : undefined
            }
          } else {
            // Add the reaction
            return {
              ...prev,
              [commentId]: [...currentReactions, reactionType]
            }
          }
        } else {
          // Handle legacy single reaction format
          if (currentReactions === reactionType) {
            // Remove the reaction
            const newReactions = { ...prev }
            delete newReactions[commentId]
            return newReactions
          } else {
            // Convert to array format and add new reaction
            return {
              ...prev,
              [commentId]: [currentReactions, reactionType]
            }
          }
        }
      })

      // Refresh comments to get updated counts
      const updatedResponse = await fetch('/api/comments')
      const updatedData = await updatedResponse.json()
      const sortedComments = updatedData
        .map(c => ({ ...c, timestamp: new Date(c.createdAt).getTime() }))
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5)
      setComments(sortedComments)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add reaction",
        variant: "destructive",
      })
    }
  }

  // 获取有数量的表情反应
  const getReactionsWithCount = (comment) => {
    const reactions = [
      { type: 'likes', emoji: '👍', color: 'hover:text-blue-400' },
      { type: 'fires', emoji: '🔥', color: 'hover:text-orange-400' },
      { type: 'hearts', emoji: '❤️', color: 'hover:text-red-400' },
      { type: 'laughs', emoji: '😂', color: 'hover:text-yellow-400' },
      { type: 'wows', emoji: '😮', color: 'hover:text-purple-400' }
    ]

    return reactions.filter(reaction => {
      const count = comment[reaction.type] || 0
      
      // Check if user reacted with this type (support both array and single reaction formats)
      const userReactionsForComment = userReactions[comment.id]
      const userReacted = Array.isArray(userReactionsForComment) 
        ? userReactionsForComment.includes(reaction.type)
        : userReactionsForComment === reaction.type
      
      // Show reaction if it has count OR if user just reacted to it
      return (count || 0) > 0 || userReacted
    })
  }

  const toggleReactions = (commentId) => {
    setShowReactions(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }))
  }

  const reactionEmojis = {
    likes: '👍',
    fires: '🔥',
    hearts: '❤️',
    laughs: '😂',
    wows: '😮'
  }

  const reactionTypes = ['likes', 'fires', 'hearts', 'laughs', 'wows']

  return (
    <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" className="text-white hover:text-black">
          <MessageSquare /> Comments
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-black text-white border border-gray-400 shadow-lg scale-[0.9] sm:scale-[1] max-h-[80vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base font-semibold">Comments</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-300">
            Share your thoughts and interact with others!
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {commentsError ? (
          <div className="bg-red-100/90 backdrop-blur-sm border border-red-300/50 rounded-lg p-3">
            <p className="text-red-600 text-sm">{commentsError}</p>
          </div>
        ) : comments.length > 0 ? (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {comments.map((c, index) => (
              <div key={c.id || index} className="group relative pt-2">
                <div className="bg-white/90 backdrop-blur-sm border border-gray-300/50 rounded-lg p-4 pb-3 hover:bg-white/95 transition-all duration-200 w-full max-w-full overflow-visible">
                  <p className="text-black text-sm leading-relaxed font-semibold break-words overflow-wrap-anywhere">{c.text}</p>
                  <div className="flex items-center justify-between mt-3 gap-2 flex-wrap">
                    <p className="text-gray-600 text-xs flex-shrink-0">
                      <ClientTimeDisplay timestamp={c.timestamp || c.createdAt} fallback="Just now" />
                    </p>
                    
                    {/* 表情反应区域 */}
                    <div className="flex items-center gap-1.5 flex-shrink-0 relative">
                      {/* 如果有表情反应，显示有数量的表情 */}
                      {getReactionsWithCount(c).length > 0 && (
                        <div className="flex items-center gap-0.5 flex-wrap">
                          {getReactionsWithCount(c).map((reaction) => {
                            // Check if user reacted with this type (support both array and single reaction formats)
                            const userReactionsForComment = userReactions[c.id]
                            const isUserReacted = Array.isArray(userReactionsForComment) 
                              ? userReactionsForComment.includes(reaction.type)
                              : userReactionsForComment === reaction.type
                            
                            const count = c[reaction.type] || 0
                            const displayCount = isUserReacted && count === 0 ? 1 : count
                            
                            return (
                              <button
                                key={reaction.type}
                                onClick={() => handleCommentReaction(c.id, reaction.type)}
                                className={`flex items-center gap-0.5 ${isUserReacted ? 'text-yellow-400 bg-yellow-400/20' : 'text-gray-400'} ${reaction.color} transition-colors text-xs px-1.5 py-1 rounded-full hover:bg-gray-700/50 active:bg-gray-700/70 touch-manipulation flex-shrink-0`}
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
                        onClick={() => toggleReactions(c.id)}
                        className="text-gray-400 hover:text-yellow-400 active:text-yellow-400 transition-colors text-xs px-1.5 py-1 rounded-full hover:bg-gray-700/50 active:bg-gray-700/70 border border-gray-500/70 hover:border-yellow-400/70 active:border-yellow-400/70 touch-manipulation flex-shrink-0"
                        title={showReactions[c.id] ? "Close Reactions" : "Add Reaction"}
                      >
                        {showReactions[c.id] ? <X size={14} /> : <Smile size={14} />}
                      </button>
                      
                      {/* 表情选择器 - 迷你化设计，绝对定位 */}
                      {showReactions[c.id] && (
                        <div className="absolute right-0 bottom-full mb-1 z-50 flex items-center gap-0.5 bg-gray-900/95 backdrop-blur-sm border border-gray-600/70 rounded-lg px-1.5 py-1 shadow-xl touch-manipulation">
                          <button
                            onClick={() => {
                              handleCommentReaction(c.id, 'likes')
                              setShowReactions(prev => ({ ...prev, [c.id]: false }))
                            }}
                            className={`${(Array.isArray(userReactions[c.id]) ? userReactions[c.id].includes('likes') : userReactions[c.id] === 'likes') ? 'bg-blue-400/20' : 'hover:bg-gray-700/50'} transition-all duration-200 text-base px-1.5 py-1 rounded hover:scale-110 active:scale-95 touch-manipulation`}
                            title="点赞"
                          >
                            👍
                          </button>
                          <button
                            onClick={() => {
                              handleCommentReaction(c.id, 'fires')
                              setShowReactions(prev => ({ ...prev, [c.id]: false }))
                            }}
                            className={`${(Array.isArray(userReactions[c.id]) ? userReactions[c.id].includes('fires') : userReactions[c.id] === 'fires') ? 'bg-orange-400/20' : 'hover:bg-gray-700/50'} transition-all duration-200 text-base px-1.5 py-1 rounded hover:scale-110 active:scale-95 touch-manipulation`}
                            title="Fire"
                          >
                            🔥
                          </button>
                          <button
                            onClick={() => {
                              handleCommentReaction(c.id, 'hearts')
                              setShowReactions(prev => ({ ...prev, [c.id]: false }))
                            }}
                            className={`${(Array.isArray(userReactions[c.id]) ? userReactions[c.id].includes('hearts') : userReactions[c.id] === 'hearts') ? 'bg-red-400/20' : 'hover:bg-gray-700/50'} transition-all duration-200 text-base px-1.5 py-1 rounded hover:scale-110 active:scale-95 touch-manipulation`}
                            title="爱心"
                          >
                            ❤️
                          </button>
                          <button
                            onClick={() => {
                              handleCommentReaction(c.id, 'laughs')
                              setShowReactions(prev => ({ ...prev, [c.id]: false }))
                            }}
                            className={`${(Array.isArray(userReactions[c.id]) ? userReactions[c.id].includes('laughs') : userReactions[c.id] === 'laughs') ? 'bg-yellow-400/20' : 'hover:bg-gray-700/50'} transition-all duration-200 text-base px-1.5 py-1 rounded hover:scale-110 active:scale-95 touch-manipulation`}
                            title="大笑"
                          >
                            😂
                          </button>
                          <button
                            onClick={() => {
                              handleCommentReaction(c.id, 'wows')
                              setShowReactions(prev => ({ ...prev, [c.id]: false }))
                            }}
                            className={`${(Array.isArray(userReactions[c.id]) ? userReactions[c.id].includes('wows') : userReactions[c.id] === 'wows') ? 'bg-purple-400/20' : 'hover:bg-gray-700/50'} transition-all duration-200 text-base px-1.5 py-1 rounded hover:scale-110 active:scale-95 touch-manipulation`}
                            title="惊讶"
                          >
                            😮
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-12 h-12 mx-auto mb-3 bg-gray-800/50 rounded-full flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-gray-600 border-t-white rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-400 text-sm">No comments yet.</p>
          </div>
        )}
        
        <div className="space-y-4 mt-4">
          <div className="flex items-center justify-center sm:justify-start">
            <h1 className="text-lg font-semibold text-white">
              I want to hear from you
            </h1>
          </div>
          <div className="relative">
            <textarea
              className={`w-full p-3 bg-white/90 text-black border ${
                commentError ? "border-red-500" : "border-gray-300"
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all duration-200 resize-none placeholder-gray-500`}
              placeholder="Type your comment..."
              rows={4}
              value={comment}
              onChange={(e) => {
                setComment(e.target.value)
                setCommentError(false)
              }}
            />
          </div>
          {commentError && (
            <div className="bg-red-100/90 backdrop-blur-sm border border-red-300/50 rounded-lg p-2">
              <p className="text-red-600 text-sm">
                Comment cannot be empty!
              </p>
            </div>
          )}
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-all duration-200"
            >
              Post Comment
            </Button>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel className="bg-black text-white hover:bg-red-400">Close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default CommentSystem
