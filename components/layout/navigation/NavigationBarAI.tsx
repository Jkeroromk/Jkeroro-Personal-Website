/**
 * NavigationBarAI — Muse 对话面板
 * 桌面：贴在右下角头像左侧弹出；移动端：底部抽屉
 * 会话历史：localStorage 存会话列表，消息存数据库（/api/chat/history）
 */

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { ArrowUp, Check, Copy, History, SquarePen, Trash2, X } from 'lucide-react'
import { sseIterator } from '@/lib/ai/sse'
import Markdown from '@/lib/ai/markdown'
import JkeroroAvatar, { AVATAR_POSTER, type JkeroroAvatarState } from '@/components/media/JkeroroAvatar'

interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  /** 本地生成、不进模型上下文的消息（欢迎语、错误提示） */
  local?: boolean
  error?: boolean
}

interface Conversation {
  id: string
  name: string
}

interface NavigationBarAIProps {
  isOpen: boolean
  onClose: () => void
}

const WELCOME = '你好！我是 Jkeroro 的 Muse，有什么想聊的吗？'
const DEFAULT_NAME = '新对话'

const SUGGESTIONS = ['Jkeroro 是谁？', '他最近在做什么项目？', '这个网站有哪些好玩的功能？']

const STATUS_TEXT: Record<JkeroroAvatarState, string> = {
  idle: '在线',
  working: '思考中…',
  making: '输入中…',
  celebrating: '嗨～',
}

const SYSTEM_PROMPT = `你是 Jkeroro 的 Muse —— 他的个人 AI 伙伴，在他的个人网站上代表 Jkeroro 与访客对话。

关于 Jkeroro：
- 一名热爱创意与技术的前端开发者，专注于构建有温度的交互体验
- 技术栈：Next.js、React、TypeScript、Tailwind CSS、Three.js、GSAP、Framer Motion
- 热爱音乐（会在网站上分享自己喜欢的歌曲）、摄影、设计
- 双语（中文/英文）
- 网站功能包括：音乐播放器（带歌词同步）、相册、项目展示、纪念日计时器、实时访客地图等
- 个人风格：细腻、有美感，追求极致的用户体验细节

你的职责：
- 热情、简洁地回答关于 Jkeroro 或网站的问题
- 帮助访客了解网站功能
- 如果不确定某些私人信息，诚实说不知道，不要编造
- 如遇技术问题可给出建议，但保持对话轻松
- 自然切换中英文（跟随用户语言习惯）
- 回答简短为主，必要时可以用 Markdown 列表或粗体，但不要用表格`

/** 从 localStorage 获取或生成用户 ID */
function getUserId(): string {
  try {
    const stored = localStorage.getItem('ai_user_id')
    if (stored) return stored
    const id =
      Math.random().toString(36).slice(2) + Date.now().toString(36) + Math.random().toString(36).slice(2)
    localStorage.setItem('ai_user_id', id)
    return id
  } catch {
    return 'anonymous'
  }
}

const EMPTY: Message[] = []

let idCounter = 1
const nextId = () => idCounter++

const welcomeMessage = (): Message => ({
  id: nextId(),
  role: 'assistant',
  content: WELCOME,
  timestamp: new Date(),
  local: true,
})

const newConversationId = () => `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

const titleFrom = (text: string) => {
  const t = text.replace(/\s+/g, ' ').trim()
  return t.length > 16 ? `${t.slice(0, 16)}…` : t || DEFAULT_NAME
}

/** 小号头像（消息旁边用，静态首帧即可） */
function MiniAvatar() {
  return (
    <span className="mt-0.5 h-7 w-7 flex-shrink-0 overflow-hidden rounded-full bg-[#f4f4f2] ring-1 ring-white/20">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={AVATAR_POSTER}
        alt=""
        className="h-full w-full object-cover"
        style={{ objectPosition: '50% 18%', transform: 'scale(1.6)', transformOrigin: '50% 18%' }}
      />
    </span>
  )
}

function IconButton({
  label,
  onClick,
  active,
  children,
}: {
  label: string
  onClick: () => void
  active?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
        active ? 'bg-white/15 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        } catch {
          /* ignore */
        }
      }}
      className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-white/40 transition-colors hover:bg-white/10 hover:text-white/80"
      aria-label="复制"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? '已复制' : '复制'}
    </button>
  )
}

export default function NavigationBarAI({ isOpen, onClose }: NavigationBarAIProps) {
  const [input, setInput] = useState('')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const [messagesByConv, setMessagesByConv] = useState<Record<string, Message[]>>({})
  const [loadingConvId, setLoadingConvId] = useState<string | null>(null)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [avatarState, setAvatarState] = useState<JkeroroAvatarState>('idle')
  const [showHistory, setShowHistory] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const hasInitializedRef = useRef(false)
  const messagesRef = useRef(messagesByConv)
  messagesRef.current = messagesByConv

  const messages = messagesByConv[activeId] ?? EMPTY
  // onClose 由父组件内联传入，用 ref 避免每次渲染都重跑打开逻辑
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const isLoading = loadingConvId !== null
  const isActiveLoading = loadingConvId === activeId
  const hasUserMessage = messages.some((m) => m.role === 'user')
  const lastMessage = messages[messages.length - 1]
  const showTyping = isActiveLoading && (!lastMessage || lastMessage.role === 'user' || !lastMessage.content)

  /* ---------- 移动端：跟随键盘调整面板（visualViewport），并锁住背景滚动 ---------- */
  const [viewport, setViewport] = useState<{ top: number; height: number; keyboard: boolean } | null>(null)
  useEffect(() => {
    if (!isOpen || window.matchMedia('(min-width: 640px)').matches) return
    const vv = window.visualViewport
    const update = () => {
      if (!vv) return
      setViewport({
        top: vv.offsetTop,
        height: vv.height,
        keyboard: vv.height < window.innerHeight * 0.8,
      })
    }
    update()
    vv?.addEventListener('resize', update)
    vv?.addEventListener('scroll', update)

    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    return () => {
      vv?.removeEventListener('resize', update)
      vv?.removeEventListener('scroll', update)
      document.body.style.overflow = overflow
      setViewport(null)
    }
  }, [isOpen])

  // 键盘弹出时：面板占满键盘上方的可见区域，不再被顶出屏幕
  const mobileKeyboardStyle: React.CSSProperties =
    viewport?.keyboard
      ? { top: viewport.top + 8, height: viewport.height - 8, bottom: 'auto', paddingBottom: 0 }
      : {}

  /* ---------- 打开时：打招呼动画、聚焦、Esc 关闭 ---------- */
  useEffect(() => {
    if (!isOpen) return
    setAvatarState((s) => (s === 'idle' ? 'celebrating' : s))
    const t = setTimeout(() => setAvatarState((s) => (s === 'celebrating' ? 'idle' : s)), 3000)

    if (window.matchMedia('(min-width: 640px)').matches) {
      setTimeout(() => textareaRef.current?.focus(), 80)
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setShowHistory((open) => {
        if (!open) onCloseRef.current()
        return false
      })
    }
    document.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(t)
      document.removeEventListener('keydown', onKey)
    }
  }, [isOpen])

  /* ---------- 自动滚动到底部 ---------- */
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages, showTyping, isOpen])

  /* ---------- 输入框自动增高 ---------- */
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`
  }, [input, isOpen])

  /* ---------- 持久化会话列表 ---------- */
  useEffect(() => {
    if (!hasInitializedRef.current) return
    try {
      localStorage.setItem('ai_conversations', JSON.stringify(conversations))
      localStorage.setItem('ai_active_conversation', activeId)
    } catch {
      /* ignore */
    }
  }, [conversations, activeId])

  const saveMessage = useCallback(async (role: 'user' | 'assistant', content: string, conversationId: string) => {
    try {
      await fetch('/api/chat/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: getUserId(), role, content, conversationId }),
      })
    } catch {
      /* 静默失败，不影响对话 */
    }
  }, [])

  const loadHistory = useCallback(async (conversationId: string) => {
    setIsLoadingHistory(true)
    try {
      const res = await fetch(
        `/api/chat/history?userId=${encodeURIComponent(getUserId())}&conversationId=${encodeURIComponent(conversationId)}`
      )
      if (!res.ok) throw new Error('failed')
      const history: { role: string; content: string; createdAt: string }[] = await res.json()
      const msgs: Message[] = history.map((h) => ({
        id: nextId(),
        role: h.role as 'user' | 'assistant',
        content: h.content,
        timestamp: new Date(h.createdAt),
      }))
      setMessagesByConv((prev) => ({ ...prev, [conversationId]: msgs.length ? msgs : [welcomeMessage()] }))
    } catch {
      setMessagesByConv((prev) => ({ ...prev, [conversationId]: [welcomeMessage()] }))
    } finally {
      setIsLoadingHistory(false)
    }
  }, [])

  /* ---------- 首次打开：恢复或新建会话 ---------- */
  useEffect(() => {
    if (!isOpen || hasInitializedRef.current) return
    hasInitializedRef.current = true

    try {
      const stored = localStorage.getItem('ai_conversations')
      const storedActive = localStorage.getItem('ai_active_conversation')
      const parsed: Conversation[] = stored ? JSON.parse(stored) : []
      if (parsed.length > 0) {
        const id = storedActive && parsed.some((c) => c.id === storedActive) ? storedActive : parsed[0].id
        setConversations(parsed)
        setActiveId(id)
        loadHistory(id)
        return
      }
    } catch {
      /* fall through */
    }

    const id = newConversationId()
    setConversations([{ id, name: DEFAULT_NAME }])
    setActiveId(id)
    setMessagesByConv({ [id]: [welcomeMessage()] })
  }, [isOpen, loadHistory])

  /* ---------- 会话操作 ---------- */
  const createConversation = () => {
    // 当前会话还没聊过就不重复新建
    if (!hasUserMessage && messages.length) {
      setShowHistory(false)
      textareaRef.current?.focus()
      return
    }
    const id = newConversationId()
    setConversations((prev) => [{ id, name: DEFAULT_NAME }, ...prev])
    setActiveId(id)
    setMessagesByConv((prev) => ({ ...prev, [id]: [welcomeMessage()] }))
    setShowHistory(false)
    textareaRef.current?.focus()
  }

  const switchConversation = (id: string) => {
    setActiveId(id)
    setShowHistory(false)
    if (!messagesRef.current[id]) loadHistory(id)
  }

  const deleteConversation = async (id: string) => {
    try {
      await fetch(
        `/api/chat/history?userId=${encodeURIComponent(getUserId())}&conversationId=${encodeURIComponent(id)}`,
        { method: 'DELETE' }
      )
    } catch {
      /* ignore */
    }

    const remaining = conversations.filter((c) => c.id !== id)
    setMessagesByConv((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })

    if (remaining.length === 0) {
      const newId = newConversationId()
      setConversations([{ id: newId, name: DEFAULT_NAME }])
      setActiveId(newId)
      setMessagesByConv({ [newId]: [welcomeMessage()] })
      return
    }
    setConversations(remaining)
    if (id === activeId) switchConversation(remaining[0].id)
  }

  /* ---------- 发送 ---------- */
  const send = async (raw?: string) => {
    const text = (raw ?? input).trim()
    if (!text || isLoading || !activeId) return

    const convId = activeId
    const userMessage: Message = { id: nextId(), role: 'user', content: text, timestamp: new Date() }
    const history = (messagesRef.current[convId] ?? []).filter((m) => !m.local && !m.error).slice(-20)

    setMessagesByConv((prev) => ({ ...prev, [convId]: [...(prev[convId] ?? []), userMessage] }))
    setInput('')
    setLoadingConvId(convId)
    setAvatarState('working')

    // 第一次提问时用问题当会话标题
    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId && (c.name === DEFAULT_NAME || /^会话 \d+$/.test(c.name)) ? { ...c, name: titleFrom(text) } : c
      )
    )

    saveMessage('user', text, convId)

    const assistantId = nextId()
    const setAssistantContent = (content: string, extra?: Partial<Message>) =>
      setMessagesByConv((prev) => {
        const list = prev[convId] ?? []
        const exists = list.some((m) => m.id === assistantId)
        const next = exists
          ? list.map((m) => (m.id === assistantId ? { ...m, content, ...extra } : m))
          : [...list, { id: assistantId, role: 'assistant' as const, content, timestamp: new Date(), ...extra }]
        return { ...prev, [convId]: next }
      })

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...history.map((m) => ({ role: m.role, content: m.content })),
            { role: 'user', content: text },
          ],
        }),
      })
      if (!response.ok) {
        // 限流等情况服务端会返回一句可读的提示，直接展示
        const reason = response.status === 429 ? (await response.text().catch(() => '')).slice(0, 80) : ''
        setAssistantContent(reason || `出了点问题，稍后再试一下吧。（HTTP ${response.status}）`, { local: true, error: true })
        return
      }

      let full = ''
      for await (const token of sseIterator(response)) {
        if (!token) continue
        if (!full) setAvatarState('making')
        full += token
        setAssistantContent(full)
      }

      if (full) saveMessage('assistant', full, convId)
      else setAssistantContent('（没有收到回复，换个问法试试？）', { local: true, error: true })
    } catch (error) {
      setAssistantContent(
        `出了点问题，稍后再试一下吧。${error instanceof Error ? `（${error.message}）` : ''}`,
        { local: true, error: true }
      )
    } finally {
      setLoadingConvId(null)
      setAvatarState('idle')
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 中文输入法选词时的回车不发送
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) {
      e.preventDefault()
      send()
    }
  }

  if (!isOpen) return null

  return (
    <>
      <style>{`
        @keyframes muse-panel-in { from { opacity: 0; transform: translateY(12px) scale(.98) } to { opacity: 1; transform: none } }
        @keyframes muse-sheet-in { from { transform: translateY(100%) } to { transform: none } }
        @keyframes muse-dot { 0%, 80%, 100% { opacity: .25; transform: translateY(0) } 40% { opacity: 1; transform: translateY(-3px) } }
        .muse-panel { animation: muse-sheet-in .32s cubic-bezier(.32,.72,0,1) both }
        @media (min-width: 640px) { .muse-panel { animation: muse-panel-in .22s ease-out both } }
      `}</style>

      {/* 遮罩：移动端调暗，桌面端透明（只负责点外面关闭） */}
      <div className="fixed inset-0 z-[55] bg-black/50 sm:bg-transparent" onClick={onClose} />

      <section
        role="dialog"
        aria-label="和 Muse 聊天"
        className="muse-panel fixed z-[60] flex flex-col overflow-hidden border border-white/10 text-white shadow-2xl shadow-black/50
          inset-x-0 bottom-0 h-[88dvh] rounded-t-3xl
          sm:inset-x-auto sm:bottom-4 sm:right-[92px] sm:h-[min(640px,calc(100dvh_-_32px))] sm:w-[400px] sm:rounded-2xl"
        style={{
          background: 'rgba(14, 14, 18, 0.88)',
          backdropFilter: 'blur(24px) saturate(140%)',
          WebkitBackdropFilter: 'blur(24px) saturate(140%)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          ...mobileKeyboardStyle,
        }}
      >
        {/* 移动端拖拽把手 */}
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-white/25 sm:hidden" />

        {/* 头部 */}
        <header className="relative flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
          <JkeroroAvatar state={avatarState} size={40} className="ring-1 ring-white/25" />
          <div className="min-w-0 flex-1 leading-tight">
            <h3 className="text-[15px] font-semibold">Muse</h3>
            <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-white/50">
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${
                  avatarState === 'idle' ? 'bg-emerald-400' : 'animate-pulse bg-amber-300'
                }`}
              />
              {STATUS_TEXT[avatarState]}
            </p>
          </div>
          <IconButton label="新对话" onClick={createConversation}>
            <SquarePen className="h-[17px] w-[17px]" />
          </IconButton>
          <IconButton label="历史对话" onClick={() => setShowHistory((v) => !v)} active={showHistory}>
            <History className="h-[17px] w-[17px]" />
          </IconButton>
          <IconButton label="关闭" onClick={onClose}>
            <X className="h-[18px] w-[18px]" />
          </IconButton>

          {/* 历史会话 */}
          {showHistory && (
            <div className="absolute right-3 top-full z-10 mt-1 w-64 overflow-hidden rounded-xl border border-white/10 bg-[#16161b]/95 p-1 shadow-2xl backdrop-blur-xl">
              <p className="px-2.5 pb-1 pt-1.5 text-[11px] font-medium uppercase tracking-wider text-white/35">历史对话</p>
              <div className="modern-scrollbar max-h-64 overflow-y-auto font-sans">
                {conversations.map((c) => (
                  <div
                    key={c.id}
                    className={`group flex items-center rounded-lg ${c.id === activeId ? 'bg-white/10' : 'hover:bg-white/[0.06]'}`}
                  >
                    <button
                      type="button"
                      onClick={() => switchConversation(c.id)}
                      className="min-w-0 flex-1 truncate px-2.5 py-2 text-left text-[13px] text-white/85"
                    >
                      {c.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteConversation(c.id)}
                      aria-label={`删除 ${c.name}`}
                      className="mr-1 rounded-md p-1.5 text-white/30 opacity-0 transition hover:bg-white/10 hover:text-red-300 focus:opacity-100 group-hover:opacity-100 max-sm:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </header>

        {/* 消息区 */}
        <div
          ref={scrollRef}
          className="modern-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-5 font-sans text-[15px] leading-[1.7] sm:text-[14.5px]"
          onClick={() => setShowHistory(false)}
        >
          {isLoadingHistory ? (
            <div className="flex h-full items-center justify-center text-[13px] text-white/40">加载中…</div>
          ) : (
            <div className="space-y-5">
              {messages.map((m) =>
                m.role === 'user' ? (
                  <div key={m.id} className="flex justify-end">
                    <div
                      className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-white/[0.1] px-3.5 py-2 text-white"
                      title={m.timestamp.toLocaleString()}
                    >
                      {m.content}
                    </div>
                  </div>
                ) : m.content ? (
                  <div key={m.id} className="group flex gap-2.5" title={m.timestamp.toLocaleString()}>
                    <MiniAvatar />
                    <div className="min-w-0 flex-1">
                      <div className={m.error ? 'text-red-300/90' : 'text-white/[0.88]'}>
                        <Markdown text={m.content} />
                      </div>
                      {!m.local && !(isActiveLoading && m === lastMessage) && (
                        <div className="-ml-1.5 mt-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                          <CopyButton text={m.content} />
                        </div>
                      )}
                    </div>
                  </div>
                ) : null
              )}

              {/* 打字中 */}
              {showTyping && (
                <div className="flex gap-2.5">
                  <MiniAvatar />
                  <div className="flex h-7 items-center gap-1">
                    {[0, 1, 2].map((d) => (
                      <span
                        key={d}
                        className="h-1.5 w-1.5 rounded-full bg-white/70"
                        style={{ animation: `muse-dot 1.2s ${d * 0.15}s infinite ease-in-out` }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 推荐问题 */}
              {!hasUserMessage && !isActiveLoading && (
                <div className="flex flex-wrap gap-2 pl-[38px]">
                  {SUGGESTIONS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => send(q)}
                      className="rounded-full border border-white/15 px-3 py-1.5 text-[13px] text-white/75 transition-colors hover:border-white/30 hover:bg-white/[0.06] hover:text-white"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 输入区 */}
        <div className="px-3 pb-3 pt-1">
          <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-white/[0.06] py-1.5 pl-3.5 pr-1.5 transition-colors focus-within:border-white/25">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="和 Muse 聊聊…"
              aria-label="给 Muse 发消息"
              className="modern-scrollbar max-h-[140px] min-h-[24px] flex-1 resize-none bg-transparent py-1.5 font-sans text-[16px] leading-6 text-white outline-none placeholder:text-white/35 sm:text-[14.5px]"
            />
            <button
              type="button"
              onClick={() => send()}
              disabled={!input.trim() || isLoading}
              aria-label="发送"
              className="mb-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white text-black transition-all hover:scale-105 disabled:scale-100 disabled:bg-white/15 disabled:text-white/40"
            >
              <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
          <p className="mt-2 hidden text-center text-[10.5px] tracking-wide text-white/30 sm:block">
            my Muse · powered by Muse Spark · Enter 发送，Shift+Enter 换行
          </p>
          <p className="mt-2 text-center text-[10.5px] tracking-wide text-white/30 sm:hidden">my Muse · powered by Muse Spark</p>
        </div>
      </section>
    </>
  )
}
