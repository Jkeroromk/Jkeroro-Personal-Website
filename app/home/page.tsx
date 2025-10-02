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
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop()?.split(';').shift()
    return null
  }

  useEffect(() => {
    // 检查是否是从loading页面正常跳转过来的
    const fromLoading = sessionStorage.getItem('fromLoading')
    const permCookie = getCookie('perm')
    
    if (fromLoading) {
      // 如果是从loading页面跳转过来的，清除标记并正常显示
      sessionStorage.removeItem('fromLoading')
    } else if (!permCookie) {
      // 如果没有Cookie（直接访问），跳转回根页面
      router.replace('/')
    }
    
    // 页面卸载时清除Cookie和localStorage，确保下次访问会重新走loading流程
    const handleBeforeUnload = () => {
      document.cookie = "perm=; Path=/; Max-Age=0; SameSite=Lax"
      localStorage.removeItem('audioPermission')
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
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
