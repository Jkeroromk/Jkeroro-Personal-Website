'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Edit2, Trash2, MessageSquare, ThumbsUp, Flame, Heart, Laugh, Eye, RefreshCw, Check, X } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'

const reactionIcons = {
  likes:  { icon: ThumbsUp, color: 'text-blue-400' },
  fires:  { icon: Flame,    color: 'text-orange-400' },
  hearts: { icon: Heart,    color: 'text-pink-400' },
  laughs: { icon: Laugh,    color: 'text-yellow-400' },
  wows:   { icon: Eye,      color: 'text-purple-400' },
}

const CommentsTab = () => {
  const [comments, setComments]             = useState([])
  const [loading, setLoading]               = useState(true)
  const [editingComment, setEditingComment] = useState(null)
  const [editText, setEditText]             = useState('')
  const { toast } = useToast()

  const fetchComments = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/comments')
      if (!res.ok) throw new Error('Failed to fetch comments')
      const data = await res.json()
      setComments(data.map(c => ({
        ...c,
        timestamp: c.createdAt ? new Date(c.createdAt).getTime() : Date.now(),
      })))
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchComments() }, [])

  const handleDelete = async (id) => {
    if (!confirm('Delete this comment?')) return
    try {
      const res = await fetch(`/api/comments/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed')
      setComments(c => c.filter(x => x.id !== id))
      toast({ title: 'Deleted', description: 'Comment removed.' })
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    }
  }

  const handleSaveEdit = async () => {
    if (!editText.trim()) {
      toast({ title: 'Error', description: 'Comment cannot be empty.', variant: 'destructive' })
      return
    }
    try {
      const res = await fetch(`/api/comments/${editingComment}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: editText.trim() }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed')
      setComments(c => c.map(x => x.id === editingComment ? { ...x, text: editText.trim() } : x))
      setEditingComment(null)
      toast({ title: 'Saved', description: 'Comment updated.' })
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    }
  }

  const formatTime = (ts) => {
    if (!ts) return 'Unknown'
    const date = new Date(ts)
    const diff = Date.now() - date
    if (diff < 60000)     return 'Just now'
    if (diff < 3600000)   return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000)  return `${Math.floor(diff / 3600000)}h ago`
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const totalReactions = (c) =>
    ['likes', 'fires', 'hearts', 'laughs', 'wows'].reduce(
      (sum, k) => sum + (typeof c[k] === 'number' ? c[k] : 0), 0
    )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex items-center gap-3 text-zinc-400">
          <div className="w-5 h-5 border-2 border-zinc-700 border-t-indigo-500 rounded-full animate-spin" />
          <span className="text-sm">Loading comments...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">Comments</h2>
          <p className="text-xs text-zinc-500 mt-0.5">{comments.length} comment{comments.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={fetchComments}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 text-sm transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Empty state */}
      {comments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-white/10 bg-white/[0.02]">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
            <MessageSquare className="w-5 h-5 text-zinc-500" />
          </div>
          <p className="text-sm font-medium text-white mb-1">No comments yet</p>
          <p className="text-xs text-zinc-500">Comments from visitors will appear here</p>
        </div>
      )}

      {/* Comment list */}
      {comments.length > 0 && (
        <div className="space-y-2">
          {comments.map((comment, index) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.04 }}
              className="rounded-xl border border-white/5 bg-zinc-900 p-4 hover:border-white/10 transition-colors"
            >
              {editingComment === comment.id ? (
                <div className="space-y-3">
                  <Textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="bg-zinc-800 text-white border-white/10 focus:border-indigo-500/50 resize-none text-sm"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEdit}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-medium transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Save
                    </button>
                    <button
                      onClick={() => { setEditingComment(null); setEditText('') }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-zinc-400 hover:text-white text-xs transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <p className="text-sm text-zinc-200 leading-relaxed flex-1">{comment.text}</p>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => { setEditingComment(comment.id); setEditText(comment.text) }}
                        className="p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="p-1.5 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-zinc-600">{formatTime(comment.timestamp)}</span>

                      {totalReactions(comment) > 0 && (
                        <div className="flex items-center gap-2">
                          {Object.entries(reactionIcons).map(([key, { icon: Icon, color }]) => {
                            const count = comment[key]
                            if (!count || count === 0) return null
                            return (
                              <span key={key} className={`flex items-center gap-1 text-xs ${color}`}>
                                <Icon className="w-3 h-3" />
                                {count}
                              </span>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    <span className="text-[10px] font-mono text-zinc-700">
                      {comment.id.slice(-8)}
                    </span>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CommentsTab
