/**
 * NavigationBar Component (Refactored)
 * 可折叠导航栏组件 - 重构版本
 * 使用子组件拆分功能
 */

'use client'

import React, { useState, useEffect } from 'react'
import { MessageCircle } from 'lucide-react'
import { useAuth } from '@/auth'
import ModernControlPanel from '@/components/interactive/ModernControlPanel'
import { useControlPanel } from '@/contexts/ControlPanelContext'
import NavigationBarAI from './navigation/NavigationBarAI'
import NavigationBarLogin from './navigation/NavigationBarLogin'
import JkeroroAvatar from '@/components/media/JkeroroAvatar'

export default function NavigationBar() {
  const { isAdmin } = useAuth()
  const { guiParams, handleParamChange } = useControlPanel()
  const [isMounted, setIsMounted] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const navRef = React.useRef(null)
  const toggleBtnRef = React.useRef(null)
  const [showLogin, setShowLogin] = useState(false)
  const [showControlPanel, setShowControlPanel] = useState(false)
  const [showAssistant, setShowAssistant] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [assistantPosition, setAssistantPosition] = useState({ x: 0, y: 0 })
  const [loginPosition, setLoginPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragType, setDragType] = useState(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  // 重置位置到中心的函数
  const resetToCenter = (type) => {
    if (!isDesktop) return

    if (type === 'assistant') {
      setAssistantPosition({
        x: (window.innerWidth - 320) / 2,
        y: (window.innerHeight - 480) / 2,
      })
    } else if (type === 'login') {
      setLoginPosition({
        x: (window.innerWidth - 288) / 2,
        y: (window.innerHeight - 200) / 2,
      })
    }
  }

  // 测量右下角导航（头像 + 已展开菜单）的总高度，写入 --nav-stack，
  // 供圆形迷你播放器叠在它上方。折叠时只量头像（隐藏的菜单仍占布局空间）。
  useEffect(() => {
    if (!isMounted) return
    const measure = () => {
      const target = isExpanded ? navRef.current : toggleBtnRef.current
      if (!target) return
      const { top, bottom } = target.getBoundingClientRect()
      document.documentElement.style.setProperty('--nav-stack', `${Math.round(bottom - top)}px`)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [isMounted, isExpanded])

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

  // 迷你播放卡片打开时关掉控制面板（互斥）
  useEffect(() => {
    const close = () => setShowControlPanel(false)
    window.addEventListener('jk:close-control-panel', close)
    return () => window.removeEventListener('jk:close-control-panel', close)
  }, [])

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (event) => {
      // ESC：先关控制面板，再收起菜单
      if (event.key !== 'Escape') return
      if (showControlPanel) {
        setShowControlPanel(false)
      } else if (isExpanded) {
        setIsExpanded(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isExpanded, showControlPanel])

  // 拖拽处理函数
  const handleMouseDown = (e, type) => {
    if (!isDesktop) return

    e.preventDefault()
    setIsDragging(true)
    setDragType(type)

    const currentPosition =
      type === 'assistant' ? assistantPosition : loginPosition
    setDragOffset({
      x: e.clientX - currentPosition.x,
      y: e.clientY - currentPosition.y,
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

  // 防止服务端渲染问题
  if (!isMounted) {
    return null
  }

  return (
    <>
      {/* 可折叠导航栏容器 - 右下角，Muse 头像即菜单开关，菜单向上展开 */}
      <div
        id="nav-bar"
        ref={navRef}
        className="fixed z-50 flex flex-col-reverse items-end"
        style={{
          position: 'fixed',
          right: '16px',
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
        }}
      >
        {/* 主切换按钮：Muse 头像 */}
        <div ref={toggleBtnRef} className="relative group/button">
          <button
            onClick={() => {
              // 收起菜单时连同控制面板一起关掉
              if (isExpanded) setShowControlPanel(false)
              setIsExpanded(!isExpanded)
            }}
            aria-label={isExpanded ? '收起菜单' : '展开菜单'}
            aria-expanded={isExpanded}
            className={`block w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105 relative border-2 ${
              isExpanded
                ? 'border-white/80 scale-105'
                : 'border-white/30 hover:border-white/60'
            }`}
          >
            <span className="absolute inset-0 rounded-full overflow-hidden">
              <JkeroroAvatar
                state="idle"
                states={['idle']}
                size={64}
                className="!w-full !h-full"
              />
            </span>
            {/* 角标：提示这是菜单 */}
            <span
              aria-hidden="true"
              className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-black/70 border border-white/30 flex items-center justify-center text-white"
              style={{ backdropFilter: 'blur(10px)' }}
            >
              <svg
                className={`w-3 h-3 transition-transform duration-300 ${isExpanded ? 'rotate-90' : 'rotate-0'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isExpanded ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 6l12 12M18 6L6 18" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 7h16M4 12h16M4 17h16" />
                )}
              </svg>
            </span>
          </button>
          {/* 工具提示 */}
          <div className="absolute right-[72px] top-1/2 transform -translate-y-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/button:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none hidden sm:block">
            {isExpanded ? '收起菜单' : 'my Muse'}
          </div>
        </div>

        {/* 功能按钮容器 - 在头像上方，向上展开 */}
        <div
          className={`flex flex-col items-center gap-2.5 sm:gap-3 mb-3 pr-2 sm:pr-2.5 transition-all duration-300 ${
            isExpanded
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-2 scale-95 pointer-events-none'
          }`}
        >
          {/* 和 Muse 聊天 */}
          <div className="relative group/button">
            <button
              onClick={() => {
                if (!showAssistant) {
                  resetToCenter('assistant')
                }
                setShowAssistant(!showAssistant)
                setIsExpanded(false)
              }}
              aria-label={showAssistant ? '关闭 Muse 对话' : '和 Muse 聊天'}
              className={`flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105 relative overflow-hidden border ${
                showAssistant
                  ? 'bg-white/20 border-white/40'
                  : 'bg-white/5 border-white/20 hover:bg-white/10'
              }`}
              style={{ backdropFilter: 'blur(20px)' }}
            >
              <MessageCircle className="w-4 h-4 sm:w-[18px] sm:h-[18px] relative z-10 text-white" />
              <div className="absolute inset-0 bg-white opacity-0 hover:opacity-10 transition-opacity duration-300 rounded-full"></div>
            </button>
            {/* 工具提示 */}
            <div className="absolute right-[52px] top-1/2 transform -translate-y-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/button:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none hidden sm:block">
              和 Muse 聊天
            </div>
          </div>

          {/* 登录按钮 */}
          <div className="relative group/button">
            <button
              onClick={() => {
                if (!showLogin) {
                  resetToCenter('login')
                }
                setShowLogin(!showLogin)
                setIsExpanded(false)
              }}
              aria-label={
                isAdmin
                  ? showLogin
                    ? '关闭管理面板'
                    : '打开管理面板'
                  : showLogin
                    ? '关闭登录'
                    : '打开登录'
              }
              className={`flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105 relative overflow-hidden border ${
                showLogin
                  ? 'bg-white/20 border-white/40'
                  : 'bg-white/5 border-white/20 hover:bg-white/10'
              }`}
              style={{ backdropFilter: 'blur(20px)' }}
            >
              <span className="text-xs sm:text-sm font-bold text-white relative z-10">
                L
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-white/10 opacity-50"></div>
            </button>
            {/* 工具提示 */}
            <div className="absolute right-[52px] top-1/2 transform -translate-y-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/button:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none hidden sm:block">
              {isAdmin ? '管理面板' : '登录'}
            </div>
          </div>

          {/* 控制面板按钮 */}
          <div className="relative group/button">
            <button
              onClick={() => {
                // 控制面板作为菜单的弹出层：打开时菜单保持展开，按钮显示选中态
                if (!showControlPanel) {
                  // 和桌面迷你播放卡片互斥，避免两个弹层叠在一起
                  window.dispatchEvent(new Event('jk:close-mini-card'))
                }
                setShowControlPanel(!showControlPanel)
              }}
              aria-label={
                showControlPanel ? '关闭控制面板' : '打开控制面板'
              }
              className={`flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105 relative overflow-hidden border ${
                showControlPanel
                  ? 'bg-white/20 border-white/40'
                  : 'bg-white/5 border-white/20 hover:bg-white/10'
              }`}
              style={{ backdropFilter: 'blur(20px)' }}
            >
              <svg
                className="w-4 h-4 sm:w-[18px] sm:h-[18px] relative z-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                />
              </svg>
              <div className="absolute inset-0 bg-white opacity-0 hover:opacity-10 transition-opacity duration-300 rounded-full"></div>
            </button>
            {/* 工具提示 */}
            <div className="absolute right-[52px] top-1/2 transform -translate-y-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/button:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none hidden sm:block">
              控制面板
            </div>
          </div>
        </div>
      </div>

      {/* Muse 对话框 */}
      <NavigationBarAI
        isOpen={showAssistant}
        onClose={() => setShowAssistant(false)}
      />

      {/* 登录对话框 */}
      <NavigationBarLogin
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        isDesktop={isDesktop}
        position={loginPosition}
        onPositionChange={setLoginPosition}
        onMouseDown={handleMouseDown}
      />

      {/* 控制面板：贴在菜单列左侧弹出，菜单保持展开 */}
      {showControlPanel && (
        <>
          {/* 透明遮罩：点外面关闭面板并收起菜单；不调暗背景，方便边调边看 3D 效果 */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setShowControlPanel(false)
              setIsExpanded(false)
            }}
          ></div>

          <div
            className="fixed z-50 w-64 max-w-[calc(100vw-88px)] right-[76px] sm:right-[92px]"
            style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
          >
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

