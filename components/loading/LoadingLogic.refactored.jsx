/**
 * LoadingLogic Component (Refactored)
 * 加载逻辑主组件 - 重构版本
 * 拆分为多个加载阶段，优先加载音乐
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MouseTrail from '@/components/effects/mousetrail'
import LoadingProgress from './LoadingProgress'
import AudioPermissionModal from './AudioPermissionModal'
import { useLoadingStages } from '@/hooks/useLoadingStages'
import MusicLoader from './stages/MusicLoader'
import ResourceLoader from './stages/ResourceLoader'
import ScriptLoader from './stages/ScriptLoader'
import DatabaseLoader from './stages/DatabaseLoader'

const LoadingLogic = () => {
  const [isFadingOut, setIsFadingOut] = useState(false)
  const [showAudioPermission, setShowAudioPermission] = useState(false)
  const [loadingDescription, setLoadingDescription] = useState({
    en: 'Initializing system...',
    zh: '初始化系统...',
  })
  const [language, setLanguage] = useState('en')
  const [isInitialized, setIsInitialized] = useState(false)
  const router = useRouter()

  const {
    progress,
    musicReady,
    isCompleted,
    setResourceProgress,
    setScriptProgress,
    setMusicProgress,
    setDatabaseProgress,
  } = useLoadingStages()

  // 语言切换函数
  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'zh' : 'en'))
  }

  // 多语言内容
  const content = {
    en: {
      title: "Welcome to Jkeroro's Place",
      description: "I've prepared some nice BGM, shall we start?",
      subtitle: "(It's okay if you don't want to, you can play manually anytime)",
      buttonDecline: 'Keep it quiet 🤫',
      buttonAccept: "Let's enjoy! 🎶",
    },
    zh: {
      title: '欢迎来到我的小窝 🏠',
      description: '我准备了一些好听的BGM，要开始了吗？',
      subtitle: '（不开启也没关系，随时可以手动播放）',
      buttonDecline: '先安静会儿 🤫',
      buttonAccept: '开始享受！🎶',
    },
  }

  // 处理音频权限响应
  const handleAudioPermission = (allow) => {
    if (typeof window === 'undefined') {
      return
    }

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
      // 静默处理存储错误
    }

    // 先隐藏模态框
    setShowAudioPermission(false)
    setIsFadingOut(true)

    // 延迟跳转，确保动画完成
    setTimeout(() => {
      router.replace('/home')
    }, 500)
  }

  // 初始化
  useEffect(() => {
    if (isInitialized) return
    setIsInitialized(true)

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
      { en: 'Loading music library...', zh: '加载音乐库...' },
      { en: 'Preparing audio engine...', zh: '准备音频引擎...' },
      { en: 'Almost ready to launch...', zh: '即将准备就绪...' },
    ]

    // 更新加载描述
    const descriptionInterval = setInterval(() => {
      const randomDesc = descriptions[Math.floor(Math.random() * descriptions.length)]
      setLoadingDescription(randomDesc)
    }, 3000)

    return () => {
      clearInterval(descriptionInterval)
    }
  }, [isInitialized])

  // 当加载完成时显示权限对话框
  useEffect(() => {
    if (isCompleted && !showAudioPermission && !isFadingOut) {
      setTimeout(() => {
        setProgress((prev) => ({ ...prev, total: 100 }))
        setTimeout(() => {
          setShowAudioPermission(true)
        }, 300)
      }, 500)
    }
  }, [isCompleted, showAudioPermission, isFadingOut])

  // 确保MouseTrail在loading页面正确初始化
  useEffect(() => {
    const initMouseTrail = setTimeout(() => {
      if (typeof window === 'undefined') return

      const mouseX = window.lastMouseX || window.innerWidth / 2
      const mouseY = window.lastMouseY || window.innerHeight / 2

      const event = new MouseEvent('mousemove', {
        clientX: mouseX,
        clientY: mouseY,
      })
      window.dispatchEvent(event)
    }, 200)

    return () => clearTimeout(initMouseTrail)
  }, [])

  // 超时保护：如果8秒内没有完成，强制继续
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!isCompleted) {
        setResourceProgress(40)
        setScriptProgress(20)
        setMusicProgress(20)
        setDatabaseProgress(20)
      }
    }, 8000)

    return () => clearTimeout(timeoutId)
  }, [isCompleted, setResourceProgress, setScriptProgress, setMusicProgress, setDatabaseProgress])

  return (
    <>
      <MouseTrail />

      <LoadingProgress
        progress={progress.total}
        isFadingOut={isFadingOut}
        loadingDescription={loadingDescription}
      />

      {/* 加载阶段组件 - 音乐优先加载 */}
      <MusicLoader
        onProgress={setMusicProgress}
        onComplete={(tracks) => {
          // 音乐加载完成回调
          console.log('Music loaded:', tracks.length, 'tracks')
        }}
      />
      <ResourceLoader onProgress={setResourceProgress} />
      <ScriptLoader onProgress={setScriptProgress} />
      <DatabaseLoader onProgress={setDatabaseProgress} />

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

