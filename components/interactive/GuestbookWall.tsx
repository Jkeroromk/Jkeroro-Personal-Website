'use client'

import { useState, useEffect } from 'react'
import { useCommentReactions } from '@/hooks/useCommentReactions'
import ReactionButtons from './comments/ReactionButtons'
import { Comment } from '@/types/api'

interface GuestbookEntry {
  id: string
  name: string
  message: string
  emoji: string
  createdAt: string
  source: 'guestbook' | 'comment'
  likes?: number
  fires?: number
  hearts?: number
  laughs?: number
  wows?: number
  updatedAt?: string
}

const ALLOWED_EMOJIS = ['👋', '❤️', '🔥', '✨', '😊', '🎵', '🌟', '💬', '🚀', '🎉']

function EntryCard({
  entry,
  onReaction,
  hasUserReaction,
}: {
  entry: GuestbookEntry
  onReaction?: (commentId: string, reactionType: string) => void
  hasUserReaction?: (commentId: string, reactionType: string) => boolean
}) {
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 hover:bg-white/[0.08] transition-colors">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg leading-none">{entry.emoji}</span>
        <span className="text-white font-semibold text-xs">{entry.name}</span>
        <span className="text-white/60 text-xs ml-auto flex-shrink-0">
          {formatDate(entry.createdAt)}
        </span>
      </div>
      <p className="text-white text-sm leading-relaxed pl-7">{entry.message}</p>

      {entry.source === 'comment' && onReaction && hasUserReaction && (
        <div className="mt-2 pl-7">
          <ReactionButtons
            comment={{
              id: entry.id,
              text: entry.message,
              likes: entry.likes ?? 0,
              fires: entry.fires ?? 0,
              hearts: entry.hearts ?? 0,
              laughs: entry.laughs ?? 0,
              wows: entry.wows ?? 0,
              createdAt: entry.createdAt,
              updatedAt: entry.updatedAt ?? entry.createdAt,
            }}
            onReaction={onReaction}
            hasUserReaction={hasUserReaction}
          />
        </div>
      )}
    </div>
  )
}

export default function GuestbookWall() {
  const [entries, setEntries] = useState<GuestbookEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [emoji, setEmoji] = useState('👋')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const { handleReaction, hasUserReaction } = useCommentReactions()

  const fetchAllEntries = async () => {
    try {
      const [gbRes, cmRes] = await Promise.all([
        fetch('/api/guestbook'),
        fetch('/api/comments'),
      ])
      const gbData = gbRes.ok ? await gbRes.json() : []
      const cmData = cmRes.ok ? await cmRes.json() : []

      const guestbookEntries: GuestbookEntry[] = Array.isArray(gbData)
        ? gbData.map((e: { id: string; name: string; message: string; emoji: string; createdAt: string }) => ({
            id: e.id,
            name: e.name,
            message: e.message,
            emoji: e.emoji,
            createdAt: e.createdAt,
            source: 'guestbook',
          }))
        : []

      const commentEntries: GuestbookEntry[] = Array.isArray(cmData)
        ? cmData.map((c: Comment) => ({
            id: c.id,
            name: '匿名访客',
            message: c.text,
            emoji: '💬',
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
            source: 'comment',
            likes: c.likes,
            fires: c.fires,
            hearts: c.hearts,
            laughs: c.laughs,
            wows: c.wows,
          }))
        : []

      const merged = [...guestbookEntries, ...commentEntries].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      setEntries(merged)
    } catch {
      setEntries([])
    } finally {
      setLoading(false)
    }
  }

  const handleCommentReaction = (commentId: string, reactionType: string) => {
    handleReaction(commentId, reactionType, fetchAllEntries)
  }

  useEffect(() => {
    fetchAllEntries()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!name.trim() || !message.trim()) { setError('名字和留言都不能为空'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/guestbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), message: message.trim(), emoji }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || '提交失败，请重试'); return }
      const newEntry: GuestbookEntry = { ...data, source: 'guestbook' }
      setEntries((prev) => [newEntry, ...prev])
      setName(''); setMessage(''); setEmoji('👋')
      setSuccess(true); setShowForm(false)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError('网络错误，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const previewEntries = entries.slice(0, 3)
  const hasMore = entries.length > 3

  return (
    <div className="flex flex-col items-center mt-6 px-4 sm:px-6">
      <div className="w-full sm:w-[550px]">
        {/* 标题行 */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-white font-semibold text-base">留言墙</h2>
            <p className="text-white/40 text-xs mt-0.5">留下你的足迹 ✨</p>
          </div>
          <button
            onClick={() => { setShowForm((v) => !v); setError('') }}
            className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full border border-white/20 transition-colors"
          >
            {showForm ? '取消' : '+ 留言'}
          </button>
        </div>

        {/* 成功提示 */}
        {success && (
          <div className="mb-3 text-xs text-green-400 bg-green-400/10 border border-green-400/20 rounded-lg px-3 py-2">
            留言成功，谢谢你的到来！🎉
          </div>
        )}

        {/* 留言表单 */}
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-4 bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
            <input
              type="text"
              placeholder="你的名字（最多20字）"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 text-xs focus:outline-none focus:border-white/40"
            />
            <div className="flex gap-1.5 flex-wrap">
              {ALLOWED_EMOJIS.map((em) => (
                <button key={em} type="button" onClick={() => setEmoji(em)}
                  className={`text-lg leading-none p-1 rounded transition-all ${emoji === em ? 'bg-white/20 scale-110' : 'opacity-40 hover:opacity-100'}`}>
                  {em}
                </button>
              ))}
            </div>
            <textarea
              placeholder="留下你想说的话（最多150字）"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={150}
              rows={3}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 text-xs focus:outline-none focus:border-white/40 resize-none"
            />
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <div className="flex justify-between items-center">
              <span className="text-white/30 text-xs">{message.length}/150</span>
              <button type="submit" disabled={submitting}
                className="bg-white/15 hover:bg-white/25 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-lg text-xs transition-colors">
                {submitting ? '提交中...' : '提交留言'}
              </button>
            </div>
          </form>
        )}

        {/* 留言预览（最多3条） */}
        {loading ? (
          <div className="text-center text-white/30 text-xs py-6">加载中...</div>
        ) : entries.length === 0 ? (
          <div className="text-center text-white/30 text-xs py-6">还没有留言，来做第一个吧 👋</div>
        ) : (
          <div className="space-y-2">
            {previewEntries.map((entry) => (
              <EntryCard
                key={`${entry.source}-${entry.id}`}
                entry={entry}
                onReaction={handleCommentReaction}
                hasUserReaction={hasUserReaction}
              />
            ))}
            {hasMore && (
              <button
                onClick={() => setShowModal(true)}
                className="w-full mt-1 text-xs text-white hover:text-white/90 py-2 border border-white/10 hover:border-white/25 rounded-xl transition-all"
              >
                查看全部 {entries.length} 条留言 →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div className="w-full max-w-md max-h-[80vh] bg-black/90 border border-white/20 rounded-2xl flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div>
                <h3 className="text-white font-semibold text-sm">全部留言</h3>
                <p className="text-white/40 text-xs mt-0.5">{entries.length} 条</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-white/40 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {entries.map((entry) => (
                <EntryCard
                  key={`${entry.source}-${entry.id}`}
                  entry={entry}
                  onReaction={handleCommentReaction}
                  hasUserReaction={hasUserReaction}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
