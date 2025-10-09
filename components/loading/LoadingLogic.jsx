'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MouseTrail from '@/components/effects/mousetrail'
import LoadingProgress from './LoadingProgress'
import AudioPermissionModal from './AudioPermissionModal'

const LoadingLogic = () => {
  const [progress, setProgress] = useState(0)
  const [isFadingOut, setIsFadingOut] = useState(false)
  const [showAudioPermission, setShowAudioPermission] = useState(false)
  const [loadingDescription, setLoadingDescription] = useState({
    en: 'Initializing system...',
    zh: '初始化系统...'
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
    // 确保在客户端环境运行
    if (typeof window === 'undefined') {
      return
    }
    
    // 如果已经在跳转过程中，直接返回
    if (isFadingOut) {
      return
    }
    
    try {
      // 设置Cookie，24小时过期
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toUTCString()
      document.cookie = `perm=${allow ? 'allowed' : 'declined'}; Path=/; SameSite=Lax; Expires=${expires}`
      
      // 设置localStorage，供音乐播放器使用
      localStorage.setItem('audioPermission', allow ? 'allowed' : 'declined')
      
      // 设置跳转标记
      sessionStorage.setItem('fromLoading', 'true')
      sessionStorage.setItem('loadingTimestamp', Date.now().toString())
      sessionStorage.setItem('loadingCompleted', 'true')
    } catch (error) {
      console.warn('⚠️ 设置存储时出错:', error)
    }
    
    // 先隐藏模态框
    setShowAudioPermission(false)
    setIsFadingOut(true)
    
    // 延迟跳转，确保动画完成
    setTimeout(() => {
      router.replace('/home')
      
      // 备用方案：如果路由跳转失败，使用 window.location
      setTimeout(() => {
        if (window.location.pathname !== '/home') {
          window.location.href = '/home'
        }
      }, 200)
    }, 500)
  }

  useEffect(() => {
    // 科技感加载描述
    const descriptions = [
      { en: 'Initializing neural networks...', zh: '初始化神经网络...' },
      { en: 'Loading quantum particles...', zh: '加载量子粒子...' },
      { en: 'Compiling digital dreams...', zh: '编译数字梦想...' },
      { en: 'Rendering the matrix...', zh: '渲染矩阵...' },
      { en: 'Syncing with the cloud...', zh: '与云端同步...' },
      { en: 'Optimizing algorithms...', zh: '优化算法...' },
      { en: 'Decrypting memories...', zh: '解密记忆...' },
      { en: 'Building virtual worlds...', zh: '构建虚拟世界...' },
      { en: 'Calibrating sensors...', zh: '校准传感器...' },
      { en: 'Establishing connections...', zh: '建立连接...' },
      { en: 'Processing creativity...', zh: '处理创意...' },
      { en: 'Generating possibilities...', zh: '生成可能性...' },
      { en: 'Almost ready to launch...', zh: '即将准备就绪...' }
    ]

    // 更新加载描述
    const descriptionInterval = setInterval(() => {
      const randomDesc = descriptions[Math.floor(Math.random() * descriptions.length)]
      setLoadingDescription(randomDesc)
    }, 1500)

    // 模拟加载进度（只到 70%，为真实资源预加载留出空间）
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 70) {
          clearInterval(progressInterval)
          return 70
        }
        return prev + Math.random() * 8 + 2
      })
    }, 400)

    // 预加载 home 页面的关键资源
    const preloadHomeResources = () => {
      const homeResources = [
        // 关键图片
        '/pfp.webp',
        '/me.webp', 
        '/static/car.png',
        '/static/car.webp',
        '/static/glow.png',
        '/header.webp',
        // 背景视频
        '/background.mp4',
        // 音乐文件（从 Firebase 获取）
      ]
      
      let loadedCount = 0
      const totalResources = homeResources.length
      
      const checkComplete = () => {
        loadedCount++
        // 基于模拟进度条（70%）的基础上，继续到 90%
        const resourceProgress = (loadedCount / totalResources) * 20 // 20% 的额外进度
        const totalProgress = Math.min(90, 70 + resourceProgress)
        setProgress(totalProgress)
        
        if (loadedCount >= totalResources) {
          // 所有资源预加载完成，再等待 2 秒确保所有效果准备好
          setTimeout(() => {
            setProgress(100)
            setTimeout(() => {
              setShowAudioPermission(true)
            }, 500)
          }, 2000)
        }
      }
      
      // 预加载图片
      homeResources.forEach(src => {
        if (src.endsWith('.webp') || src.endsWith('.png') || src.endsWith('.jpg')) {
          const img = new Image()
          img.onload = checkComplete
          img.onerror = checkComplete
          img.src = src
        } else if (src.endsWith('.mp4')) {
          const video = document.createElement('video')
          video.oncanplay = checkComplete
          video.onerror = checkComplete
          video.src = src
          video.preload = 'metadata'
        }
      })
      
      // 预加载音乐文件（从 Firebase）
      const preloadMusic = async () => {
        try {
          // 动态导入 Firebase 相关模块
          const { firestore } = await import('../../firebase')
          const { collection, getDocs, query, orderBy } = await import('firebase/firestore')
          
          if (firestore) {
            // 获取音乐文件列表
            const tracksRef = collection(firestore, 'tracks')
            const q = query(tracksRef, orderBy('order', 'asc'))
            const tracksSnapshot = await getDocs(q)
            const tracks = tracksSnapshot.docs.map(doc => doc.data())
            
            // 预加载前几首音乐（避免预加载太多）
            const tracksToPreload = tracks.slice(0, 3)
            
            tracksToPreload.forEach(track => {
              if (track.src) {
                const audio = new Audio()
                audio.oncanplaythrough = checkComplete
                audio.onerror = checkComplete
                audio.src = track.src
                audio.preload = 'metadata'
              }
            })
            
            // 如果没有音乐文件，也要调用 checkComplete
            if (tracksToPreload.length === 0) {
              checkComplete()
            }
          } else {
            checkComplete() // 如果 Firebase 不可用，继续
          }
        } catch (error) {
          checkComplete() // 如果音乐预加载失败，继续
        }
      }
      
      preloadMusic()
    }
    
    // 延迟开始预加载，给页面一些初始化时间
    setTimeout(preloadHomeResources, 1000)

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
