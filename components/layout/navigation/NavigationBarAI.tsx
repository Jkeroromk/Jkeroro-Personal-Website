/**
 * NavigationBarAI Component
 * AI助手对话框组件，支持对话历史持久化
 */

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { sseIterator } from '@/lib/ai/sse'

interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface Conversation {
  id: string
  name: string
}

interface NavigationBarAIProps {
  isOpen: boolean
  onClose: () => void
  isDesktop: boolean
  position: { x: number; y: number }
  onPositionChange: (position: { x: number; y: number }) => void
  onMouseDown: (e: React.MouseEvent, type: string) => void
}

const SYSTEM_PROMPT = `你是 Jkeroro 的个人网站 AI 助手，代表 Jkeroro 与访客对话。

关于 Jkeroro：
- 一名热爱创意与技术的前端开发者，专注于构建有温度的交互体验
- 技术栈：Next.js、React、TypeScript、Tailwind CSS、Three.js、GSAP、Framer Motion
- 热爱音乐（会在网站上分享自己喜欢的歌曲）、摄影、设计
- 双语（中文/英文），来自中国
- 网站功能包括：音乐播放器（带歌词同步）、相册、项目展示、纪念日计时器、实时访客地图等
- 个人风格：细腻、有美感，追求极致的用户体验细节

你的职责：
- 热情、简洁地回答关于 Jkeroro 或网站的问题
- 帮助访客了解网站功能
- 如果不确定某些私人信息，诚实说不知道，不要编造
- 如遇技术问题可给出建议，但保持对话轻松
- 自然切换中英文（跟随用户语言习惯）`

/** 从 localStorage 获取或生成用户 ID */
function getUserId(): string {
  try {
    const stored = localStorage.getItem('ai_user_id')
    if (stored) return stored
    const id =
      Math.random().toString(36).slice(2) +
      Date.now().toString(36) +
      Math.random().toString(36).slice(2)
    localStorage.setItem('ai_user_id', id)
    return id
  } catch {
    return 'anonymous'
  }
}

export default function NavigationBarAI({
  isOpen,
  onClose,
  isDesktop,
  position,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onPositionChange: _onPositionChange,
  onMouseDown,
}: NavigationBarAIProps) {
  const [assistantInput, setAssistantInput] = useState('')
  const [assistantMessages, setAssistantMessages] = useState<Message[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string>('default')
  const [conversationMessages, setConversationMessages] = useState<Record<string, Message[]>>({})
  const [isAssistantLoading, setIsAssistantLoading] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageIdCounterRef = useRef(1)

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [assistantMessages])

  /** 保存一条消息到数据库 */
  const saveMessage = useCallback(async (role: 'user' | 'assistant', content: string, conversationId = 'default') => {
    try {
      const userId = getUserId()
      await fetch('/api/chat/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role, content, conversationId }),
      })
    } catch {
      // 静默失败，不影响对话体验
    }
  }, [])

  const persistConversations = useCallback(() => {
    try {
      localStorage.setItem('ai_conversations', JSON.stringify(conversations))
      localStorage.setItem('ai_active_conversation', activeConversationId)
    } catch {
      // ignore storage errors
    }
  }, [conversations, activeConversationId])

  useEffect(() => {
    persistConversations()
  }, [conversations, activeConversationId, persistConversations])

  const loadHistoryForConversation = useCallback(async (conversationId: string) => {
    setIsLoadingHistory(true)
    try {
      const userId = getUserId()
      const res = await fetch(`/api/chat/history?userId=${userId}&conversationId=${conversationId}`)
      if (!res.ok) throw new Error('failed')
      const history: { role: string; content: string; createdAt: string }[] = await res.json()

      const msgs: Message[] = history.map((h) => ({
        id: messageIdCounterRef.current++,
        role: h.role as 'user' | 'assistant',
        content: h.content,
        timestamp: new Date(h.createdAt),
      }))

      setConversationMessages((prev) => ({
        ...prev,
        [conversationId]: msgs,
      }))
      setAssistantMessages(msgs)
    } catch {
      setAssistantMessages([
        {
          id: messageIdCounterRef.current++,
          role: 'assistant',
          content: '你好！我是 Jkeroro 的 AI 助手。有什么可以帮助你的吗？',
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoadingHistory(false)
    }
  }, [])

  // AI助手消息发送处理
  const handleAssistantSend = async () => {
    const inputValue = assistantInput || ''
    if (!inputValue.trim() || isAssistantLoading) return

    const userMessage: Message = {
      id: messageIdCounterRef.current++,
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    }

    setAssistantMessages((prev) => {
      const newMessages = [...prev, userMessage]
      setConversationMessages((s) => ({
        ...s,
        [activeConversationId]: newMessages,
      }))
      return newMessages
    })
    setConversationMessages((prev) => ({
      ...prev,
      [activeConversationId]: [...(prev[activeConversationId] || []), userMessage],
    }))
    setAssistantInput('')
    setIsAssistantLoading(true)

    // 保存用户消息
    saveMessage('user', userMessage.content, activeConversationId)

    try {
      // 准备消息历史（系统提示 + 最近20条对话 + 本次用户消息）
      const recentMessages = (conversationMessages[activeConversationId] || assistantMessages).slice(-20)
      const messageHistory = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...recentMessages.map((msg) => ({ role: msg.role, content: msg.content })),
        { role: 'user', content: userMessage.content },
      ]

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messageHistory }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const assistantMessageId = messageIdCounterRef.current++
      setAssistantMessages((prev) => {
        const placeholderMessage: Message = {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
        }
        const newMessages = [...prev, placeholderMessage]
        setConversationMessages((s) => ({ ...s, [activeConversationId]: newMessages }))
        return newMessages
      })

      let fullContent = ''
      for await (const token of sseIterator(response)) {
        if (token) {
          fullContent += token
          setAssistantMessages((prev) => {
            const newMessages = [...prev]
            const lastMessage = newMessages[newMessages.length - 1]
            if (lastMessage && lastMessage.id === assistantMessageId) {
              lastMessage.content = fullContent
            }
            setConversationMessages((s) => ({ ...s, [activeConversationId]: newMessages }))
            return newMessages
          })
        }
      }

      // 保存 AI 回复
      if (fullContent) {
        saveMessage('assistant', fullContent, activeConversationId)
      }
    } catch (error) {
      setAssistantMessages((prev) => {
        const errorMessage: Message = {
          id: messageIdCounterRef.current++,
          role: 'assistant',
          content: `发生错误：${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
        }
        const newMessages = [...prev, errorMessage]
        setConversationMessages((s) => ({ ...s, [activeConversationId]: newMessages }))
        return newMessages
      })
    } finally {
      setIsAssistantLoading(false)
    }
  }

  const createConversation = () => {
    const newId = `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const newConversation: Conversation = { id: newId, name: `会话 ${conversations.length + 1}` }

    const welcomeMessage: Message = {
      id: messageIdCounterRef.current++,
      role: 'assistant',
      content: '这是新的会话。请开始提问。',
      timestamp: new Date(),
    }

    setConversations((prev) => [...prev, newConversation])
    setActiveConversationId(newId)
    setAssistantMessages([welcomeMessage])
    setConversationMessages((prev) => ({ ...prev, [newId]: [welcomeMessage] }))
  }

  const handleAssistantKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAssistantSend()
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      ></div>

      <div
        className={`w-80 h-[480px] bg-white/5 border border-white/20 rounded-lg shadow-2xl z-50 flex flex-col ${
          isDesktop
            ? 'fixed'
            : 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
        }`}
        style={{
          backdropFilter: 'blur(20px)',
          ...(isDesktop && {
            left: `${position.x}px`,
            top: `${position.y}px`,
          }),
        }}
      >
        {/* 窗口头部 */}
        <div
          className="flex items-center justify-between px-3 py-2 border-b border-white/20 bg-white/5 rounded-t-lg flex-shrink-0 cursor-move"
          style={{ backdropFilter: 'blur(10px)' }}
          onMouseDown={(e) => onMouseDown(e, 'assistant')}
        >
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
            <h3 className="text-white font-semibold text-xs">J 助手</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors p-1 hover:bg-white/10 rounded text-xs"
          >
            ✕
          </button>
        </div>

        {/* 会话标签 */}
        <div className="flex items-center gap-1 p-2 border-b border-white/10 overflow-x-auto">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => {
                setActiveConversationId(conv.id)
                if (conversationMessages[conv.id]) {
                  setAssistantMessages(conversationMessages[conv.id])
                } else {
                  loadHistoryForConversation(conv.id)
                }
              }}
              className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                activeConversationId === conv.id
                  ? 'bg-white/20 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {conv.name}
            </button>
          ))}
          <button
            onClick={createConversation}
            className="ml-auto px-2 py-1 rounded-md text-xs bg-indigo-500 text-white hover:bg-indigo-400"
          >
            + 新会话
          </button>
        </div>

        {/* 消息区域 */}
        <div className="flex-1 p-2 overflow-y-auto space-y-2 min-h-0">
          {isLoadingHistory ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-white/40 text-xs">加载历史记录...</div>
            </div>
          ) : (
            assistantMessages.map((message) => (
              <div
                key={message.id}
                className={`rounded-lg p-2 ${
                  message.role === 'user'
                    ? 'bg-blue-600/20 ml-8'
                    : 'bg-white/10 mr-8'
                }`}
              >
                <p className="text-white text-xs leading-relaxed">
                  {message.content}
                </p>
                <p className="text-white/40 text-xs mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 输入区域 */}
        <div className="p-2 border-t border-white/20 flex-shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="输入消息..."
              value={assistantInput || ''}
              onChange={(e) => setAssistantInput(e.target.value)}
              onKeyPress={handleAssistantKeyPress}
              aria-label="AI助手消息输入"
              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 text-xs focus:outline-none focus:border-white/40"
            />
            <button
              onClick={handleAssistantSend}
              disabled={!(assistantInput || '').trim() || isAssistantLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg text-xs transition-colors"
            >
              {isAssistantLoading ? '发送中...' : '发送'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
