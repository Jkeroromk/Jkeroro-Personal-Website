/**
 * NavigationBarAI Component
 * AI助手对话框组件
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { sseIterator } from '@/lib/ai/sse'

interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface NavigationBarAIProps {
  isOpen: boolean
  onClose: () => void
  isDesktop: boolean
  position: { x: number; y: number }
  onPositionChange: (position: { x: number; y: number }) => void
  onMouseDown: (e: React.MouseEvent, type: string) => void
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
  const [isAssistantLoading, setIsAssistantLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageIdCounterRef = useRef(1) // 使用计数器而不是 Date.now()，避免潜在问题

  // 初始化欢迎消息
  useEffect(() => {
    if (isOpen && assistantMessages.length === 0) {
      setAssistantMessages([
        {
          id: 1,
          role: 'assistant',
          content: '你好！我是 Jkeroro 的 AI 助手。有什么可以帮助您的吗？',
          timestamp: new Date(),
        },
      ])
    }
  }, [isOpen, assistantMessages.length])

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [assistantMessages])

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

    // 添加用户消息到对话列表
    setAssistantMessages((prev) => [...prev, userMessage])
    setAssistantInput('')
    setIsAssistantLoading(true)

    try {
      // 准备消息历史（包含系统提示词）
      const messageHistory = [
        {
          role: 'system',
          content:
            "You are Jkeroro's helpful AI assistant. Answer concisely, bilingual (中文/English) if user mixes languages.",
        },
        ...assistantMessages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        {
          role: 'user',
          content: userMessage.content,
        },
      ]

      // 调用 AI API (流式响应，直接使用 fetch)
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: messageHistory }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      // 创建空的助手消息，用于流式更新
      const assistantMessageId = messageIdCounterRef.current++
      setAssistantMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
        },
      ])

      // 使用 SSE 解析器处理流式响应
      let fullContent = ''
      for await (const token of sseIterator(response)) {
        if (token) {
          fullContent += token
          // 更新最后一条消息的内容
          setAssistantMessages((prev) => {
            const newMessages = [...prev]
            const lastMessage = newMessages[newMessages.length - 1]
            if (lastMessage && lastMessage.id === assistantMessageId) {
              lastMessage.content = fullContent
            }
            return newMessages
          })
        }
      }
    } catch (error) {
      console.error('AI请求错误:', error)
      setAssistantMessages((prev) => [
        ...prev,
        {
          id: messageIdCounterRef.current++,
          role: 'assistant',
          content: `发生错误：${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsAssistantLoading(false)
    }
  }

  // 处理回车键发送
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

        {/* 消息区域 */}
        <div className="flex-1 p-2 overflow-y-auto space-y-2 min-h-0">
          {assistantMessages.map((message) => (
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
          ))}
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

