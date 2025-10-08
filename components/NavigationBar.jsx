'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/auth'
import { useToast } from '@/hooks/use-toast'
import ModernControlPanel from '@/components/ModernControlPanel'
import { useControlPanel } from '@/contexts/ControlPanelContext'
import { sseIterator } from '@/lib/ai/sse'

/**
 * 右下角可折叠导航栏组件
 * 默认显示一个主按钮，点击展开显示AI助手、登录、控制面板三个功能按钮
 */
export default function NavigationBar() {
  const { user, isAdmin, loginWithEmail, logout } = useAuth()
  const { toast } = useToast()
  const { guiParams, handleParamChange } = useControlPanel()
  const [isMounted, setIsMounted] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [showControlPanel, setShowControlPanel] = useState(false)
  const [showAssistant, setShowAssistant] = useState(false)
  const [assistantInput, setAssistantInput] = useState("")
  const [assistantMessages, setAssistantMessages] = useState([])
  const [isAssistantLoading, setIsAssistantLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [loginError, setLoginError] = useState("")
  const [isDesktop, setIsDesktop] = useState(false)
  const [assistantPosition, setAssistantPosition] = useState({ x: 0, y: 0 })
  const [loginPosition, setLoginPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  // 重置位置到中心的函数
  const resetToCenter = (type) => {
    if (!isDesktop) return
    
    if (type === 'assistant') {
      setAssistantPosition({ 
        x: (window.innerWidth - 320) / 2, 
        y: (window.innerHeight - 480) / 2 
      })
    } else if (type === 'login') {
      setLoginPosition({ 
        x: (window.innerWidth - 288) / 2, 
        y: (window.innerHeight - 200) / 2 
      })
    }
  }

  // 确保组件在客户端挂载
  useEffect(() => {
    setIsMounted(true)
    
    // 检测设备类型
    const checkDevice = () => {
      const isDesktopDevice = window.innerWidth > 768
      setIsDesktop(isDesktopDevice)
      
      // 如果是桌面端，设置初始位置为屏幕中心
      if (isDesktopDevice) {
        resetToCenter('assistant')
        resetToCenter('login')
      }
    }
    
    checkDevice()
    window.addEventListener('resize', checkDevice)
    return () => window.removeEventListener('resize', checkDevice)
  }, [])

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (event) => {
      // ESC 键关闭展开的菜单
      if (event.key === 'Escape' && isExpanded) {
        setIsExpanded(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isExpanded])

  // 初始化欢迎消息
  useEffect(() => {
    if (isMounted && assistantMessages.length === 0) {
      setAssistantMessages([
        {
          id: 1,
          role: 'assistant',
          content: '你好！我是 Jkeroro 的 AI 助手。有什么可以帮助您的吗？',
          timestamp: new Date()
        }
      ])
    }
  }, [isMounted, assistantMessages.length])

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [assistantMessages])

  // AI助手消息发送处理
  const handleAssistantSend = async () => {
    const inputValue = assistantInput || ""
    if (!inputValue.trim() || isAssistantLoading) return

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    }
    
    // 添加用户消息到对话列表
    setAssistantMessages(prev => [...prev, userMessage])
    setAssistantInput("")
    setIsAssistantLoading(true)

    try {
      // 准备消息历史（包含系统提示词）
      const messageHistory = [
        {
          role: 'system',
          content: "You are Jkeroro's helpful AI assistant. Answer concisely, bilingual (中文/English) if user mixes languages."
        },
        ...assistantMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        {
          role: 'user',
          content: userMessage.content
        }
      ]

      // 调用 AI API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: messageHistory }),
      })


      // 检查请求是否成功
      if (!response.ok) {
        const errorText = await response.text()
        setAssistantMessages(prev => [...prev, {
          id: Date.now() + 1,
          role: 'assistant',
          content: `请求失败：\n${errorText}`,
          timestamp: new Date()
        }])
        setIsAssistantLoading(false)
        return
      }

      // 创建助手消息
      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: '',
        timestamp: new Date()
      }

      // 添加空的助手消息
      setAssistantMessages(prev => [...prev, assistantMessage])

      // 使用 SSE 解析器处理流式响应
      let fullContent = ''
      for await (const token of sseIterator(response)) {
        if (token) {
          fullContent += token
          // 更新最后一条消息的内容
          setAssistantMessages(prev => {
            const newMessages = [...prev]
            const lastMessage = newMessages[newMessages.length - 1]
            if (lastMessage && lastMessage.role === 'assistant') {
              lastMessage.content = fullContent
            }
            return newMessages
          })
        }
      }
    } catch (error) {
      console.error('AI请求错误:', error)
      setAssistantMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: `发生错误：${error.message}`,
        timestamp: new Date()
      }])
    } finally {
      setIsAssistantLoading(false)
    }
  }

  // 处理回车键发送
  const handleAssistantKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAssistantSend()
    }
  }

  // 拖拽处理函数
  const [dragType, setDragType] = useState(null)
  
  const handleMouseDown = (e, type) => {
    if (!isDesktop) return
    
    e.preventDefault()
    setIsDragging(true)
    setDragType(type)
    setDragStart({ x: e.clientX, y: e.clientY })
    
    const currentPosition = type === 'assistant' ? assistantPosition : loginPosition
    setDragOffset({
      x: e.clientX - currentPosition.x,
      y: e.clientY - currentPosition.y
    })
  }

  const handleMouseMove = (e) => {
    if (!isDragging || !isDesktop || !dragType) return
    
    e.preventDefault()
    const newX = e.clientX - dragOffset.x
    const newY = e.clientY - dragOffset.y
    
    // 限制在屏幕范围内
    const maxX = window.innerWidth - (dragType === 'assistant' ? 320 : 288)
    const maxY = window.innerHeight - (dragType === 'assistant' ? 480 : 200)
    
    const clampedX = Math.max(0, Math.min(newX, maxX))
    const clampedY = Math.max(0, Math.min(newY, maxY))
    
    if (dragType === 'assistant') {
      setAssistantPosition({ x: clampedX, y: clampedY })
    } else {
      setLoginPosition({ x: clampedX, y: clampedY })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setDragType(null)
  }

  // 添加全局鼠标事件监听
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragOffset])

  // 登录处理
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError("")
    try {
      await loginWithEmail(loginEmail, loginPassword)
      setLoginEmail("")
      setLoginPassword("")
      setShowLogin(false)
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed'
      setLoginError(errorMessage)
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  // 登出处理
  const handleLogout = async () => {
    try {
      await logout()
      setShowLogin(false)
      toast({
        title: "Logged Out",
        description: "See you next time!",
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Logout failed'
      toast({
        title: "Logout Failed",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  // 防止服务端渲染问题
  if (!isMounted) {
    return null
  }

  return (
    <>
      {/* 可折叠导航栏容器 - 右上角 */}
      <div className="fixed top-4 right-4 z-50" style={{ position: 'fixed', top: '16px', right: '16px' }}>
        {/* 导航栏背景 */}
        <div className={`absolute -inset-2 bg-white/5 rounded-xl transition-all duration-300 ${
          isExpanded ? 'opacity-100' : 'opacity-0'
        }`} style={{ backdropFilter: 'blur(20px)' }}></div>
        
        {/* 主切换按钮 */}
        <div className="relative group/button">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105 relative overflow-hidden border ${
              isExpanded 
                ? 'bg-white/20 border-white/40' 
                : 'bg-white/5 border-white/20 hover:bg-white/10'
            }`}
            style={{ backdropFilter: 'blur(20px)' }}
          >
            <svg 
              className={`w-4 h-4 sm:w-5 sm:h-5 relative z-10 text-white transition-all duration-300 ${
                isExpanded ? 'rotate-90' : 'rotate-0'
              }`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <div className="absolute inset-0 bg-white opacity-0 hover:opacity-10 transition-opacity duration-300 rounded-full"></div>
          </button>
          {/* 工具提示 */}
          <div className="absolute right-14 top-1/2 transform -translate-y-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/button:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none hidden sm:block">
            {isExpanded ? '收起菜单' : '展开菜单'}
          </div>
        </div>

        {/* 功能按钮容器 - 放在主按钮下方 */}
        <div className={`flex flex-col gap-3 sm:gap-4 mt-3 sm:mt-4 transition-all duration-300 ${
          isExpanded 
            ? 'opacity-100 translate-y-0 scale-100' 
            : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'
        }`}>
          {/* AI助手按钮 */}
          <div className="relative group/button">
            <button
              onClick={() => {
                if (!showAssistant) {
                  // 打开时重置到中心位置
                  resetToCenter('assistant')
                }
                setShowAssistant(!showAssistant)
                setIsExpanded(false)
              }}
              className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105 relative overflow-hidden border ${
                showAssistant 
                  ? 'bg-white/20 border-white/40' 
                  : 'bg-white/5 border-white/20 hover:bg-white/10'
              }`}
              style={{ backdropFilter: 'blur(20px)' }}
            >
              <span className="text-xs sm:text-sm font-bold text-white relative z-10 animate-pulse">J</span>
              <div className="absolute inset-0 bg-white opacity-0 hover:opacity-10 transition-opacity duration-300 rounded-full"></div>
            </button>
            {/* 工具提示 */}
            <div className="absolute right-14 top-1/2 transform -translate-y-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/button:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none hidden sm:block">
              AI助手
            </div>
          </div>

          {/* 登录按钮 */}
          <div className="relative group/button">
            <button
              onClick={() => {
                if (!showLogin) {
                  // 打开时重置到中心位置
                  resetToCenter('login')
                }
                setShowLogin(!showLogin)
                setIsExpanded(false)
              }}
              className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105 relative overflow-hidden border ${
                showLogin 
                  ? 'bg-white/20 border-white/40' 
                  : 'bg-white/5 border-white/20 hover:bg-white/10'
              }`}
              style={{ backdropFilter: 'blur(20px)' }}
            >
              <span className="text-xs sm:text-sm font-bold text-white relative z-10 animate-pulse">L</span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-white/10 animate-pulse opacity-50"></div>
            </button>
            {/* 工具提示 */}
            <div className="absolute right-14 top-1/2 transform -translate-y-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/button:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none hidden sm:block">
              {isAdmin ? '管理面板' : '登录'}
            </div>
          </div>

          {/* 控制面板按钮 */}
          <div className="relative group/button">
            <button
              onClick={() => {
                setShowControlPanel(!showControlPanel)
                setIsExpanded(false)
              }}
              className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105 relative overflow-hidden border ${
                showControlPanel 
                  ? 'bg-white/20 border-white/40' 
                  : 'bg-white/5 border-white/20 hover:bg-white/10'
              }`}
              style={{ backdropFilter: 'blur(20px)' }}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 relative z-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
              <div className="absolute inset-0 bg-white opacity-0 hover:opacity-10 transition-opacity duration-300 rounded-full"></div>
            </button>
            {/* 工具提示 */}
            <div className="absolute right-14 top-1/2 transform -translate-y-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/button:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none hidden sm:block">
              控制面板
            </div>
          </div>
        </div>

      </div>

      {/* AI助手对话框 - 居中显示 */}
      {showAssistant && (
        <>
          {/* 背景遮罩 */}
          <div 
            className="fixed inset-0 bg-black/20 z-40" 
            onClick={() => setShowAssistant(false)}
          ></div>
          
          <div 
            className={`w-80 h-[480px] bg-white/5 border border-white/20 rounded-lg shadow-2xl z-50 flex flex-col ${
              isDesktop ? 'fixed' : 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
            }`}
            style={{ 
              backdropFilter: 'blur(20px)',
              ...(isDesktop && {
                left: `${assistantPosition.x}px`,
                top: `${assistantPosition.y}px`
              })
            }}
          >
            {/* 窗口头部 */}
            <div 
              className="flex items-center justify-between px-3 py-2 border-b border-white/20 bg-white/5 rounded-t-lg flex-shrink-0 cursor-move" 
              style={{ backdropFilter: 'blur(10px)' }}
              onMouseDown={(e) => handleMouseDown(e, 'assistant')}
            >
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                <h3 className="text-white font-semibold text-xs">J 助手</h3>
              </div>
              <button
                onClick={() => setShowAssistant(false)}
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
                  <p className="text-white text-xs leading-relaxed">{message.content}</p>
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
                  value={assistantInput || ""}
                  onChange={(e) => setAssistantInput(e.target.value)}
                  onKeyPress={handleAssistantKeyPress}
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 text-xs focus:outline-none focus:border-white/40"
                />
                <button 
                  onClick={handleAssistantSend}
                  disabled={!(assistantInput || "").trim() || isAssistantLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg text-xs transition-colors"
                >
                  {isAssistantLoading ? '发送中...' : '发送'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 登录对话框 - 居中显示 */}
      {showLogin && (
        <>
          {/* 背景遮罩 */}
          <div 
            className="fixed inset-0 bg-black/20 z-40" 
            onClick={() => setShowLogin(false)}
          ></div>
          
          <div 
            className={`w-72 bg-white/5 border border-white/20 rounded-lg shadow-2xl z-50 ${
              isDesktop ? 'fixed' : 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
            }`}
            style={{ 
              backdropFilter: 'blur(20px)',
              ...(isDesktop && {
                left: `${loginPosition.x}px`,
                top: `${loginPosition.y}px`
              })
            }}
          >
            {/* 窗口头部 */}
            <div 
              className="flex items-center justify-between px-3 py-2 border-b border-white/20 bg-white/5 rounded-t-lg cursor-move" 
              style={{ backdropFilter: 'blur(10px)' }}
              onMouseDown={(e) => handleMouseDown(e, 'login')}
            >
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                <h3 className="text-white font-semibold text-xs">
                  {isAdmin ? 'Admin Panel' : 'Admin Login'}
                </h3>
              </div>
              <button
                onClick={() => setShowLogin(false)}
                className="text-white/60 hover:text-white transition-colors p-1 hover:bg-white/10 rounded text-xs"
              >
                ✕
              </button>
            </div>

            {/* 内容区域 */}
            <div className="p-4">
              {isAdmin ? (
                // 已登录状态
                <div className="space-y-3">
                  <div className="text-center">
                    <p className="text-white text-sm mb-2">Welcome back!</p>
                    <p className="text-white/60 text-xs">{user?.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.open('/admin', '_blank')}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm transition-colors"
                    >
                      Admin Panel
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded text-sm transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                // 未登录状态
                <form onSubmit={handleLogin} className="space-y-3">
                  <div>
                    <input
                      type="email"
                      placeholder="Email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white placeholder-white/50 text-sm focus:outline-none focus:border-white/40"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="password"
                      placeholder="Password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white placeholder-white/50 text-sm focus:outline-none focus:border-white/40"
                      required
                    />
                  </div>
                  {loginError && (
                    <p className="text-red-400 text-xs">{loginError}</p>
                  )}
                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm transition-colors"
                  >
                    Login
                  </button>
                </form>
              )}
            </div>
          </div>
        </>
      )}

      {/* 真正的控制面板 - 右上角显示 */}
      {showControlPanel && (
        <>
          {/* 背景遮罩 */}
          <div 
            className="fixed inset-0 bg-black/20 z-40" 
            onClick={() => setShowControlPanel(false)}
          ></div>
          
          <div className="fixed top-4 right-4 z-50 w-64 max-h-[60vh]">
            <ModernControlPanel
              params={guiParams}
              onParamChange={handleParamChange}
              isVisible={true}
              onToggle={() => setShowControlPanel(false)}
            />
          </div>
        </>
      )}
    </>
  )
}
