'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuthProvider } from '../../auth'

const HomeAuth = ({ children }) => {
  const router = useRouter()

  // 检查Cookie，如果没有则跳转回根页面
  const getCookie = (name) => {
    if (typeof window === 'undefined') return null
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop()?.split(';').shift()
    return null
  }

  useEffect(() => {
    // 确保在客户端环境运行
    if (typeof window === 'undefined') return
    
    // 确保页面滚动到顶部
    window.scrollTo(0, 0)
    
    // 检查是否是从loading页面正常跳转过来的
    const fromLoading = sessionStorage.getItem('fromLoading')
    const loadingTimestamp = sessionStorage.getItem('loadingTimestamp')
    const permCookie = getCookie('perm')
    
    // 移动端Safari兼容性：检查时间戳确保是最近的跳转
    const isValidJump = fromLoading && loadingTimestamp && 
      (Date.now() - parseInt(loadingTimestamp)) < 30000 // 30秒内有效
    
    if (isValidJump) {
      // 如果是从loading页面跳转过来的，清除标记并正常显示
      sessionStorage.removeItem('fromLoading')
      sessionStorage.removeItem('loadingTimestamp')
      // 再次确保滚动到顶部
      setTimeout(() => {
        window.scrollTo(0, 0)
      }, 100)
    } else if (!permCookie) {
      // 如果没有Cookie（直接访问或刷新），跳转回根页面
      console.log('🔄 没有有效权限，跳转到loading页面')
      router.replace('/')
    }
    
    // 移动端Safari兼容性：使用pagehide事件替代beforeunload
    const handlePageHide = () => {
      document.cookie = "perm=; Path=/; Max-Age=0; SameSite=Lax"
      localStorage.removeItem('audioPermission')
    }
    
    const handleBeforeUnload = () => {
      document.cookie = "perm=; Path=/; Max-Age=0; SameSite=Lax"
      localStorage.removeItem('audioPermission')
    }
    
    // 同时监听两个事件以确保兼容性
    window.addEventListener('pagehide', handlePageHide)
    window.addEventListener('beforeunload', handleBeforeUnload)
    
    // 移动端Safari特殊处理：检测页面可见性变化
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // 页面变为隐藏状态时清除状态
        setTimeout(() => {
          document.cookie = "perm=; Path=/; Max-Age=0; SameSite=Lax"
          localStorage.removeItem('audioPermission')
        }, 100)
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      window.removeEventListener('pagehide', handlePageHide)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [router])

  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}

export default HomeAuth
