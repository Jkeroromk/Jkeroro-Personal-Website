'use client'

import React, { useState, useEffect } from 'react'

const LoadingScreen = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [loadingText, setLoadingText] = useState('Loading...')
  const [dots, setDots] = useState('')
  const [isMounted, setIsMounted] = useState(true) // 默认显示加载屏幕
  const [isFadingOut, setIsFadingOut] = useState(false)
  const [loadingDescription, setLoadingDescription] = useState({
    en: 'Brewing digital coffee...',
    zh: '冲泡数字咖啡...'
  })

  // 移除这个 useEffect，因为我们已经默认显示加载屏幕

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

    // 动态加载文本
    const textInterval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return ''
        return prev + '.'
      })
    }, 500)

    // 更新加载描述
    const descriptionInterval = setInterval(() => {
      const randomDesc = descriptions[Math.floor(Math.random() * descriptions.length)]
      setLoadingDescription(randomDesc)
    }, 1500)

    // 模拟加载进度 - 放慢速度
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + Math.random() * 8 + 2 // 减少增量，放慢速度
      })
    }, 400) // 增加间隔时间

    // 检查关键资源是否加载完成
    const checkResources = () => {
      let resourcesLoaded = 0
      const totalResources = 3
      
      const checkInterval = setInterval(() => {
        const threeLoaded = typeof window !== 'undefined' && window.THREE
        const vantaLoaded = typeof window !== 'undefined' && window.VANTA
        const imagesLoaded = document.images && Array.from(document.images).every(img => img.complete)
        
        // 计算已加载的资源数量
        if (threeLoaded) resourcesLoaded = Math.max(resourcesLoaded, 1)
        if (vantaLoaded) resourcesLoaded = Math.max(resourcesLoaded, 2)
        if (imagesLoaded) resourcesLoaded = Math.max(resourcesLoaded, 3)
        
        // 如果所有资源都加载完成且进度达到80%
        if (resourcesLoaded >= totalResources && progress >= 80) {
          setProgress(100)
          setLoadingText('Almost there...')
          clearInterval(checkInterval)
          
          // 开始淡出效果
          setTimeout(() => {
            setIsFadingOut(true)
            // 淡出完成后隐藏加载屏幕
            setTimeout(() => {
              setIsLoading(false)
            }, 1200)
          }, 800) // 减少等待时间
        }
      }, 50) // 更频繁的检查

      // 3秒后强制隐藏加载屏幕（减少等待时间）
      setTimeout(() => {
        clearInterval(checkInterval)
        setProgress(100)
        setLoadingText('Ready!')
        setTimeout(() => {
          setIsFadingOut(true)
          setTimeout(() => {
            setIsLoading(false)
          }, 1200)
        }, 800)
      }, 3000)
    }

    checkResources()

    return () => {
      clearInterval(progressInterval)
      clearInterval(textInterval)
      clearInterval(descriptionInterval)
    }
  }, [progress])

  if (!isLoading) {
    return null // 完全移除，不返回任何内容
  }

  return (
    <>
      {/* 额外的覆盖层确保完全覆盖 */}
      <div 
        className="fixed inset-0 bg-black"
        style={{ 
          zIndex: 99998,
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          margin: 0,
          padding: 0
        }}
      />
      
      {/* 主要内容层 */}
      <div 
        className={`loading-screen fixed bg-black flex items-center justify-center transition-opacity duration-1200 ${
          isFadingOut ? 'opacity-0' : 'opacity-100'
        }`}
        style={{ 
          zIndex: 99999,
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          minWidth: '100vw',
          minHeight: '100vh',
          maxWidth: '100vw',
          maxHeight: '100vh',
          margin: 0,
          padding: 0,
          border: 'none',
          outline: 'none'
        }}
      >
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">
          <span className="inline-block animate-bounce" style={{ animationDelay: '0s' }}>J</span>
          <span className="inline-block animate-bounce" style={{ animationDelay: '0.1s' }}>k</span>
          <span className="inline-block animate-bounce" style={{ animationDelay: '0.2s' }}>e</span>
          <span className="inline-block animate-bounce" style={{ animationDelay: '0.3s' }}>r</span>
          <span className="inline-block animate-bounce" style={{ animationDelay: '0.4s' }}>o</span>
          <span className="inline-block animate-bounce" style={{ animationDelay: '0.5s' }}>r</span>
          <span className="inline-block animate-bounce" style={{ animationDelay: '0.6s' }}>o</span>
        </h1>
        <p className="text-white/70 mb-6">Welcome to my Cozy Place</p>
        
        {/* 生活类加载描述 */}
        <div className="text-white/50 text-sm mb-4 transition-opacity duration-500">
          <div className="mb-1">{loadingDescription.en}</div>
          <div className="text-xs">{loadingDescription.zh}</div>
        </div>
        
        <div className="w-64 mx-auto mb-4">
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white/40 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
        
        <div className="text-white/60 text-sm">
          {Math.round(progress)}%
        </div>
      </div>
      </div>
    </>
  )
}

export default LoadingScreen
