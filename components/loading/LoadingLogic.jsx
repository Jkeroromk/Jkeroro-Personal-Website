'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MouseTrail from '@/components/mousetrail'
import LoadingProgress from './LoadingProgress'
import AudioPermissionModal from './AudioPermissionModal'

const LoadingLogic = () => {
  const [progress, setProgress] = useState(0)
  const [isFadingOut, setIsFadingOut] = useState(false)
  const [showAudioPermission, setShowAudioPermission] = useState(false)
  const [loadingDescription, setLoadingDescription] = useState({
    en: 'Brewing digital coffee...',
    zh: '冲泡数字咖啡...'
  })
  const [language, setLanguage] = useState('en') // 默认英文
  const router = useRouter()

  // 语言切换函数
  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'zh' : 'en')
  }

  // 多语言内容
  const content = {
    en: {
      title: "Welcome to Jkeroro's Place",
      description: "I've prepared some nice BGM, shall we start?",
      subtitle: "(It's okay if you don't want to, you can play manually anytime)",
      buttonDecline: "Keep it quiet 🤫",
      buttonAccept: "Let's enjoy! 🎶"
    },
    zh: {
      title: "欢迎来到我的小窝 🏠",
      description: "我准备了一些好听的BGM，要开始了吗？",
      subtitle: "（不开启也没关系，随时可以手动播放）",
      buttonDecline: "先安静会儿 🤫",
      buttonAccept: "开始享受！🎶"
    }
  }

  // 处理音频权限响应
  const handleAudioPermission = (allow) => {
    setShowAudioPermission(false)
    
    // 确保在客户端环境运行
    if (typeof window === 'undefined') return
    
    // 移动端Safari兼容性：使用多种方式设置状态
    try {
      // 设置Cookie，24小时过期
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toUTCString()
      document.cookie = `perm=${allow ? 'allowed' : 'declined'}; Path=/; SameSite=Lax; Expires=${expires}`
      
      // 设置localStorage，供音乐播放器使用
      localStorage.setItem('audioPermission', allow ? 'allowed' : 'declined')
      
      // 设置一个标记，表示这是正常跳转
      sessionStorage.setItem('fromLoading', 'true')
      
      // 移动端Safari额外保障：使用URL参数
      const timestamp = Date.now().toString()
      sessionStorage.setItem('loadingTimestamp', timestamp)
    } catch (error) {
      console.warn('⚠️ 设置存储时出错:', error)
    }
    
    setIsFadingOut(true)
    
    // 移动端Safari兼容性：使用更短的延迟和强制跳转
    setTimeout(() => {
      try {
        // 尝试使用replace
        router.replace('/home')
        
        // 移动端Safari备用方案：如果replace失败，使用push
        setTimeout(() => {
          if (window.location.pathname !== '/home') {
            window.location.href = '/home'
          }
        }, 100)
      } catch (error) {
        console.warn('⚠️ 路由跳转失败，使用window.location:', error)
        window.location.href = '/home'
      }
    }, 600) // 减少延迟时间
  }

  useEffect(() => {
    // 生活类加载描述
    const descriptions = [
      { en: 'Brewing digital coffee...', zh: '冲泡数字咖啡...' },
      { en: 'Polishing the pixels...', zh: '抛光像素...' },
      { en: 'Making the bed...', zh: '整理床铺...' },
      { en: 'Watering the plants...', zh: '给植物浇水...' },
      { en: 'Folding the laundry...', zh: '叠衣服...' },
      { en: 'Cooking some bytes...', zh: '烹饪一些字节...' },
      { en: 'Cleaning the cache...', zh: '清理缓存...' },
      { en: 'Organizing the files...', zh: '整理文件...' },
      { en: 'Setting the table...', zh: '摆桌子...' },
      { en: 'Taking out the trash...', zh: '倒垃圾...' },
      { en: 'Vacuuming the data...', zh: '吸尘数据...' },
      { en: 'Doing the dishes...', zh: '洗碗...' },
      { en: 'Almost there, I promise...', zh: '快好了，我保证...' }
    ]

    // 更新加载描述
    const descriptionInterval = setInterval(() => {
      const randomDesc = descriptions[Math.floor(Math.random() * descriptions.length)]
      setLoadingDescription(randomDesc)
    }, 1500)

    // 模拟加载进度
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + Math.random() * 8 + 2
      })
    }, 400)

    // 3秒后强制显示音频权限选择
    setTimeout(() => {
      setProgress(100)
      setTimeout(() => {
        setShowAudioPermission(true)
      }, 500)
    }, 3000)

    // 确保MouseTrail在loading页面正确初始化
    const initMouseTrail = setTimeout(() => {
      // 确保在客户端环境运行
      if (typeof window === 'undefined') return
      
      // 使用记录的鼠标位置或屏幕中心
      const mouseX = window.lastMouseX || window.innerWidth / 2;
      const mouseY = window.lastMouseY || window.innerHeight / 2;
      
      const event = new MouseEvent('mousemove', {
        clientX: mouseX,
        clientY: mouseY
      });
      window.dispatchEvent(event);
    }, 200);

    return () => {
      clearInterval(progressInterval)
      clearInterval(descriptionInterval)
      clearTimeout(initMouseTrail)
    }
  }, [router])

  return (
    <>
      <MouseTrail />
      
      <LoadingProgress 
        progress={progress}
        isFadingOut={isFadingOut}
        loadingDescription={loadingDescription}
      />

      <AudioPermissionModal
        showAudioPermission={showAudioPermission}
        language={language}
        content={content}
        toggleLanguage={toggleLanguage}
        handleAudioPermission={handleAudioPermission}
      />
    </>
  )
}

export default LoadingLogic
