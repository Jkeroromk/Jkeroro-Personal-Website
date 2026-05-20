'use client'

import { useState, useEffect, memo } from 'react'
import { useCommentReactions } from '@/hooks/useCommentReactions'
import ReactionButtons from './comments/ReactionButtons'
import { Comment } from '@/types/api'

// ── i18n ──────────────────────────────────────────────────────────────────────

type Translations = {
  title: string
  subtitle: string
  cancel: string
  addEntry: string
  success: string
  namePlaceholder: string
  messagePlaceholder: string
  emptyError: string
  submitting: string
  submit: string
  empty: string
  viewAll: (n: number) => string
  allEntries: string
  entriesCount: (n: number) => string
  loading: string
  networkError: string
  submitError: string
  anonymous: string
}

const translations: Record<string, Translations> = {
  zh: {
    title: '留言墙',
    subtitle: '留下你的足迹 ✨',
    cancel: '取消',
    addEntry: '+ 留言',
    success: '留言成功，谢谢你的到来！🎉',
    namePlaceholder: '你的名字（最多20字）',
    messagePlaceholder: '留下你想说的话（最多150字）',
    emptyError: '名字和留言都不能为空',
    submitting: '提交中...',
    submit: '提交留言',
    empty: '还没有留言，来做第一个吧 👋',
    viewAll: (n) => `查看全部 ${n} 条留言 →`,
    allEntries: '全部留言',
    entriesCount: (n) => `${n} 条`,
    loading: '加载中...',
    networkError: '网络错误，请重试',
    submitError: '提交失败，请重试',
    anonymous: '匿名访客',
  },
  en: {
    title: 'Guestbook',
    subtitle: 'Leave your mark ✨',
    cancel: 'Cancel',
    addEntry: '+ Sign',
    success: 'Signed! Thanks for visiting! 🎉',
    namePlaceholder: 'Your name (max 20 chars)',
    messagePlaceholder: 'Leave a message (max 150 chars)',
    emptyError: 'Name and message are required',
    submitting: 'Submitting...',
    submit: 'Submit',
    empty: 'No entries yet — be the first! 👋',
    viewAll: (n) => `View all ${n} entries →`,
    allEntries: 'All Entries',
    entriesCount: (n) => `${n} entries`,
    loading: 'Loading...',
    networkError: 'Network error, please try again',
    submitError: 'Submission failed, please try again',
    anonymous: 'Anonymous',
  },
  ja: {
    title: 'ゲストブック',
    subtitle: '足跡を残してね ✨',
    cancel: 'キャンセル',
    addEntry: '+ 記入',
    success: '記入完了！ご来訪ありがとう！🎉',
    namePlaceholder: 'お名前（20文字以内）',
    messagePlaceholder: 'メッセージを残してね（150文字以内）',
    emptyError: 'お名前とメッセージを入力してください',
    submitting: '送信中...',
    submit: '送信',
    empty: 'まだ記入がありません。最初の方になろう 👋',
    viewAll: (n) => `全 ${n} 件を見る →`,
    allEntries: '全ての記入',
    entriesCount: (n) => `${n} 件`,
    loading: '読み込み中...',
    networkError: 'ネットワークエラー、もう一度お試しください',
    submitError: '送信失敗、もう一度お試しください',
    anonymous: '匿名',
  },
  ko: {
    title: '방명록',
    subtitle: '발자취를 남겨보세요 ✨',
    cancel: '취소',
    addEntry: '+ 작성',
    success: '작성 완료! 방문해 주셔서 감사해요! 🎉',
    namePlaceholder: '이름 (최대 20자)',
    messagePlaceholder: '메시지를 남겨주세요 (최대 150자)',
    emptyError: '이름과 메시지를 입력해주세요',
    submitting: '제출 중...',
    submit: '제출',
    empty: '아직 방명록이 없어요. 첫 번째 작성자가 되어보세요 👋',
    viewAll: (n) => `전체 ${n}개 보기 →`,
    allEntries: '전체 방명록',
    entriesCount: (n) => `${n}개`,
    loading: '불러오는 중...',
    networkError: '네트워크 오류, 다시 시도해주세요',
    submitError: '제출 실패, 다시 시도해주세요',
    anonymous: '익명',
  },
  fr: {
    title: 'Livre d\'or',
    subtitle: 'Laissez votre trace ✨',
    cancel: 'Annuler',
    addEntry: '+ Signer',
    success: 'Signé ! Merci de votre visite ! 🎉',
    namePlaceholder: 'Votre nom (max 20 caractères)',
    messagePlaceholder: 'Laissez un message (max 150 caractères)',
    emptyError: 'Le nom et le message sont requis',
    submitting: 'Envoi...',
    submit: 'Envoyer',
    empty: 'Aucune entrée pour l\'instant — soyez le premier ! 👋',
    viewAll: (n) => `Voir les ${n} entrées →`,
    allEntries: 'Toutes les entrées',
    entriesCount: (n) => `${n} entrées`,
    loading: 'Chargement...',
    networkError: 'Erreur réseau, veuillez réessayer',
    submitError: 'Échec de l\'envoi, veuillez réessayer',
    anonymous: 'Anonyme',
  },
  es: {
    title: 'Libro de visitas',
    subtitle: 'Deja tu huella ✨',
    cancel: 'Cancelar',
    addEntry: '+ Firmar',
    success: '¡Firmado! ¡Gracias por tu visita! 🎉',
    namePlaceholder: 'Tu nombre (máx. 20 caracteres)',
    messagePlaceholder: 'Deja un mensaje (máx. 150 caracteres)',
    emptyError: 'El nombre y el mensaje son obligatorios',
    submitting: 'Enviando...',
    submit: 'Enviar',
    empty: 'Sin entradas aún — ¡sé el primero! 👋',
    viewAll: (n) => `Ver las ${n} entradas →`,
    allEntries: 'Todas las entradas',
    entriesCount: (n) => `${n} entradas`,
    loading: 'Cargando...',
    networkError: 'Error de red, intenta de nuevo',
    submitError: 'Error al enviar, intenta de nuevo',
    anonymous: 'Anónimo',
  },
}

function useLocale(): Translations {
  const [t, setT] = useState<Translations>(translations.en)
  useEffect(() => {
    const lang = navigator.language.split('-')[0].toLowerCase()
    setT(translations[lang] ?? translations.en)
  }, [])
  return t
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface GuestbookEntry {
  id: string
  name: string | null
  message: string
  emoji: string | null
  createdAt: string
  updatedAt?: string
  pinned: boolean
  likes: number
  fires: number
  hearts: number
  laughs: number
  wows: number
}

const ALLOWED_EMOJIS = ['👋', '❤️', '🔥', '✨', '😊', '🎵', '🌟', '💬', '🚀', '🎉']

// ── EntryCard ─────────────────────────────────────────────────────────────────

const EntryCard = memo(function EntryCard({
  entry,
  t,
  onReaction,
  hasUserReaction,
}: {
  entry: GuestbookEntry
  t: Translations
  onReaction: (id: string, type: string) => void
  hasUserReaction: (id: string, type: string) => boolean
}) {
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })

  const displayEmoji = entry.emoji ?? '💬'
  const displayName = entry.name ?? t.anonymous

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 hover:bg-white/[0.08] transition-colors">
      <div className="flex items-center gap-2 mb-1">
        {entry.pinned && (
          <span className="text-[10px] text-amber-300 font-semibold uppercase tracking-wider">📌</span>
        )}
        <span className="text-lg leading-none">{displayEmoji}</span>
        <span className="text-white font-semibold text-xs">{displayName}</span>
        <span className="text-white/60 text-xs ml-auto flex-shrink-0">
          {formatDate(entry.createdAt)}
        </span>
      </div>
      <p className="text-white text-sm leading-relaxed pl-7">{entry.message}</p>
      <div className="mt-2 pl-7">
        <ReactionButtons
          comment={{
            id: entry.id,
            text: entry.message,
            likes: entry.likes,
            fires: entry.fires,
            hearts: entry.hearts,
            laughs: entry.laughs,
            wows: entry.wows,
            createdAt: entry.createdAt,
            updatedAt: entry.updatedAt ?? entry.createdAt,
          }}
          onReaction={onReaction}
          hasUserReaction={hasUserReaction}
        />
      </div>
    </div>
  )
})

// ── GuestbookWall ─────────────────────────────────────────────────────────────

export default function GuestbookWall() {
  const t = useLocale()

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

  const fetchEntries = async () => {
    try {
      const res = await fetch('/api/comments')
      const data = res.ok ? await res.json() : []
      const mapped: GuestbookEntry[] = Array.isArray(data)
        ? data.map((c: Comment) => ({
            id: c.id,
            name: c.name ?? null,
            message: c.text,
            emoji: c.emoji ?? null,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
            pinned: c.pinned ?? false,
            likes: c.likes ?? 0,
            fires: c.fires ?? 0,
            hearts: c.hearts ?? 0,
            laughs: c.laughs ?? 0,
            wows: c.wows ?? 0,
          }))
        : []
      setEntries(mapped)
    } catch {
      setEntries([])
    } finally {
      setLoading(false)
    }
  }

  const handleEntryReaction = (id: string, type: string) => {
    handleReaction(id, type, fetchEntries)
  }

  useEffect(() => { fetchEntries() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!name.trim() || !message.trim()) { setError(t.emptyError); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/guestbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), message: message.trim(), emoji }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || t.submitError); return }
      const newEntry: GuestbookEntry = {
        id: data.id,
        name: data.name,
        message: data.message ?? data.text,
        emoji: data.emoji,
        createdAt: data.createdAt,
        pinned: false,
        likes: 0, fires: 0, hearts: 0, laughs: 0, wows: 0,
      }
      setEntries((prev) => {
        const list = [newEntry, ...prev]
        return list.sort((a, b) => {
          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
      })
      setName(''); setMessage(''); setEmoji('👋')
      setSuccess(true); setShowForm(false)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError(t.networkError)
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
            <h2 className="text-white font-semibold text-base">{t.title}</h2>
            <p className="text-white/40 text-xs mt-0.5">{t.subtitle}</p>
          </div>
          <button
            onClick={() => { setShowForm((v) => !v); setError('') }}
            className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full border border-white/20 transition-colors"
          >
            {showForm ? t.cancel : t.addEntry}
          </button>
        </div>

        {/* 成功提示 */}
        {success && (
          <div className="mb-3 text-xs text-green-400 bg-green-400/10 border border-green-400/20 rounded-lg px-3 py-2">
            {t.success}
          </div>
        )}

        {/* 留言表单 */}
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-4 bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
            <input
              type="text"
              placeholder={t.namePlaceholder}
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
              placeholder={t.messagePlaceholder}
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
                {submitting ? t.submitting : t.submit}
              </button>
            </div>
          </form>
        )}

        {/* 留言列表 */}
        {loading ? (
          <div className="text-center text-white/30 text-xs py-6">{t.loading}</div>
        ) : entries.length === 0 ? (
          <div className="text-center text-white/30 text-xs py-6">{t.empty}</div>
        ) : (
          <div className="space-y-2">
            {previewEntries.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                t={t}
                onReaction={handleEntryReaction}
                hasUserReaction={hasUserReaction}
              />
            ))}
            {hasMore && (
              <button
                onClick={() => setShowModal(true)}
                className="w-full mt-1 text-xs text-white hover:text-white/90 py-2 border border-white/10 hover:border-white/25 rounded-xl transition-all"
              >
                {t.viewAll(entries.length)}
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
                <h3 className="text-white font-semibold text-sm">{t.allEntries}</h3>
                <p className="text-white/40 text-xs mt-0.5">{t.entriesCount(entries.length)}</p>
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
                  key={entry.id}
                  entry={entry}
                  t={t}
                  onReaction={handleEntryReaction}
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
