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
    
    // 延迟滚动，等待固定元素渲染完成
    setTimeout(() => {
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      } catch (error) {
        // 备用方案
        document.documentElement.scrollTop = 0
        document.body.scrollTop = 0
      }
    }, 100)
    
    // 检查是否是从loading页面正常跳转过来的
    const fromLoading = sessionStorage.getItem('fromLoading')
    const loadingTimestamp = sessionStorage.getItem('loadingTimestamp')
    const permCookie = getCookie('perm')
    
    // 检查时间戳确保是最近的跳转（30秒内有效）
    const isValidJump = fromLoading && loadingTimestamp && 
      (Date.now() - parseInt(loadingTimestamp)) < 30000
    
    if (isValidJump) {
      // 如果是从loading页面跳转过来的，清除标记并正常显示
      sessionStorage.removeItem('fromLoading')
      sessionStorage.removeItem('loadingTimestamp')
    } else if (!permCookie) {
      // 如果没有Cookie（直接访问或刷新），跳转回根页面
      router.replace('/')
    }
    
    // 清理函数：页面卸载时清除状态
    const handlePageHide = () => {
      document.cookie = "perm=; Path=/; Max-Age=0; SameSite=Lax"
      localStorage.removeItem('audioPermission')
      sessionStorage.removeItem('fromLoading')
      sessionStorage.removeItem('loadingTimestamp')
    }
    
    const handleBeforeUnload = () => {
      document.cookie = "perm=; Path=/; Max-Age=0; SameSite=Lax"
      localStorage.removeItem('audioPermission')
      sessionStorage.removeItem('fromLoading')
      sessionStorage.removeItem('loadingTimestamp')
    }
    
    // 监听页面卸载事件
    window.addEventListener('pagehide', handlePageHide)
    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      window.removeEventListener('pagehide', handlePageHide)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [router])

  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}

export default HomeAuth
