/**
 * NavigationBarLogin Component
 * 登录对话框组件
 */

'use client'

import { useState, FormEvent } from 'react'
import { useAuth } from '@/auth'
import { useToast } from '@/hooks/use-toast'

interface NavigationBarLoginProps {
  isOpen: boolean
  onClose: () => void
  isDesktop: boolean
  position: { x: number; y: number }
  onPositionChange: (position: { x: number; y: number }) => void
  onMouseDown: (e: React.MouseEvent, type: string) => void
}

export default function NavigationBarLogin({
  isOpen,
  onClose,
  isDesktop,
  position,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onPositionChange: _onPositionChange,
  onMouseDown,
}: NavigationBarLoginProps) {
  const { user, isAdmin, loginWithEmail, logout } = useAuth()
  const { toast } = useToast()
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  // 登录处理
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setLoginError('')
    try {
      await loginWithEmail(loginEmail, loginPassword)
      setLoginEmail('')
      setLoginPassword('')
      onClose()
      toast({
        title: 'Login Successful',
        description: 'Welcome back!',
      })
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Login failed'
      setLoginError(errorMessage)
      toast({
        title: 'Login Failed',
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }

  // 登出处理
  const handleLogout = async () => {
    try {
      await logout()
      onClose()
      toast({
        title: 'Logged Out',
        description: 'See you next time!',
      })
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Logout failed'
      toast({
        title: 'Logout Failed',
        description: errorMessage,
        variant: 'destructive',
      })
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
        className={`w-72 bg-white/5 border border-white/20 rounded-lg shadow-2xl z-50 ${
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
          className="flex items-center justify-between px-3 py-2 border-b border-white/20 bg-white/5 rounded-t-lg cursor-move"
          style={{ backdropFilter: 'blur(10px)' }}
          onMouseDown={(e) => onMouseDown(e, 'login')}
        >
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
            <h3 className="text-white font-semibold text-xs">
              {isAdmin ? 'Admin Panel' : 'Admin Login'}
            </h3>
          </div>
          <button
            onClick={onClose}
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
                  aria-label="邮箱地址"
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
                  aria-label="密码"
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
  )
}

