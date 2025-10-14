'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { AuthProvider } from '../../auth'

const HomeAuth = ({ children }) => {
  const router = useRouter()
  const [hasValidated, setHasValidated] = useState(false) // 防止重复验证
  const validationRef = useRef(false) // 使用ref防止重新渲染时重置

  // 检查Cookie，如果没有则跳转回根页面
  const getCookie = (name) => {
    if (typeof window === 'undefined') return null
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop()?.split(';').shift()
    return null
  }

  useEffect(() => {
    // 防止重复验证 - 使用ref确保在重新渲染时不会重置
    if (validationRef.current) return
    validationRef.current = true
    setHasValidated(true)
    
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
    
    // 检查时间戳确保是最近的跳转（5分钟内有效，给足够的时间）
    const isValidJump = fromLoading && loadingTimestamp && 
      (Date.now() - parseInt(loadingTimestamp)) < 300000
    
    if (isValidJump) {
      // 如果是从loading页面跳转过来的，延迟清除标记，避免重复验证
      setTimeout(() => {
        sessionStorage.removeItem('fromLoading')
        sessionStorage.removeItem('loadingTimestamp')
      }, 1000) // 延迟1秒清除，确保验证完成
    } else {
      // 如果不是从loading页面跳转过来的（包括刷新页面），跳转回根页面重新开始流程
      // 添加防抖逻辑，避免快速重复跳转
      const redirectTimeout = setTimeout(() => {
        router.replace('/')
      }, 100)
      
      return () => clearTimeout(redirectTimeout)
    }
    
    // 清理函数：页面卸载时清除状态
    const handlePageHide = () => {
      // 不清除Cookie，保持用户选择
      // document.cookie = "perm=; Path=/; Max-Age=0; SameSite=Lax"
      // localStorage.removeItem('audioPermission')
      sessionStorage.removeItem('fromLoading')
      sessionStorage.removeItem('loadingTimestamp')
    }
    
    const handleBeforeUnload = () => {
      // 不清除Cookie，保持用户选择
      // document.cookie = "perm=; Path=/; Max-Age=0; SameSite=Lax"
      // localStorage.removeItem('audioPermission')
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
  }, []) // 空依赖数组，确保只执行一次

  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}

export default HomeAuth
