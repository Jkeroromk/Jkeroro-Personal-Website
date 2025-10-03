'use client'

import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import LinkforBio from "@/components/linkforbio"
import Tabs from "@/components/tabs"
import Stack from "@/components/stack"
import MusicPlayer from "@/components/musicPlayer"
import Footer from "@/components/footer"
import Album from "@/components/album"
import Interact from "@/components/interact"
import MouseTrail from "@/components/mousetrail"
import PersonalStore from "@/components/personalStore"
import { AuthProvider } from "../../auth"

const HomePage = () => {
  const router = useRouter()

  // 检查Cookie，如果没有则跳转回根页面
  const getCookie = (name: string) => {
    if (typeof window === 'undefined') return null
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop()?.split(';').shift()
    return null
  }

  useEffect(() => {
    // 确保在客户端环境运行
    if (typeof window === 'undefined') return
    
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="min-h-screen"
    >
      <AuthProvider>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          onAnimationComplete={() => {
            // 确保MouseTrail在动画完成后初始化
            setTimeout(() => {
              // 确保在客户端环境运行
              if (typeof window === 'undefined') return
              
              // 使用记录的鼠标位置或屏幕中心
              const mouseX = (window as typeof window & { lastMouseX?: number }).lastMouseX || window.innerWidth / 2;
              const mouseY = (window as typeof window & { lastMouseY?: number }).lastMouseY || window.innerHeight / 2;
              
              const event = new MouseEvent('mousemove', {
                clientX: mouseX,
                clientY: mouseY
              });
              window.dispatchEvent(event);
            }, 100);
          }}
        >
          <MouseTrail/>
          <Interact/>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <LinkforBio/>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <Stack/>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <MusicPlayer />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
        >
          <Tabs />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <PersonalStore/>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
        >
          <Album />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0 }}
        >
          <Footer />
        </motion.div>
      </AuthProvider>
    </motion.div>
  )
}

export default HomePage
