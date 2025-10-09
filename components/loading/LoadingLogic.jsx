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

    // 更新加载描述 - 减少频率
    const descriptionInterval = setInterval(() => {
      const randomDesc = descriptions[Math.floor(Math.random() * descriptions.length)]
      setLoadingDescription(randomDesc)
    }, 3000) // 从 1500ms 增加到 3000ms

    // 移除模拟进度条，只使用真实资源加载进度

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
      ]
      
      let loadedCount = 0
      let musicLoadedCount = 0
      let scriptsLoaded = false
      const totalResources = homeResources.length
      const maxMusicTracks = 3 // 最多预加载3首音乐
      const totalExpectedResources = totalResources + maxMusicTracks
      
      // 超时保护：如果20秒内没有完成，强制继续
      const timeoutId = setTimeout(() => {
        console.log('Loading timeout reached, forcing completion')
        // 即使脚本没有加载完成，也强制继续
        scriptsLoaded = true
        setProgress(100)
        setTimeout(() => {
          setShowAudioPermission(true)
        }, 500)
      }, 20000) // 增加超时时间到20秒
      
      // 检查脚本是否加载完成
      const checkScriptsLoaded = () => {
        if (typeof window !== 'undefined' && 
            window.THREE && 
            window.VANTA && 
            window.VANTA.BIRDS && 
            window.THREE.PerspectiveCamera) {
          console.log('All scripts loaded successfully')
          scriptsLoaded = true
          // 脚本加载完成，直接检查是否可以完成
          checkComplete('script')
        } else {
          console.log('Scripts not ready yet, retrying...')
          // 继续检查，不设置超时
          setTimeout(checkScriptsLoaded, 500) // 减少间隔时间，更频繁检查
        }
      }

      const checkComplete = (source = 'resource') => {
        if (source === 'resource') {
          loadedCount++
        } else if (source === 'music') {
          musicLoadedCount++
        } else if (source === 'script') {
          // 脚本加载完成，不增加计数，但标记为完成
        }
        
        // 资源加载进度更新
        
        const totalLoaded = loadedCount + musicLoadedCount
        const totalExpected = totalResources + Math.min(musicLoadedCount, maxMusicTracks)
        
        // 基于真实资源加载进度，从 0% 到 95%
        const resourceProgress = (totalLoaded / totalExpected) * 95 // 95% 的进度空间
        const totalProgress = Math.min(95, resourceProgress)
        
        // 确保进度只增不减
        setProgress(prev => {
          const newProgress = Math.max(prev, totalProgress)
          return newProgress
        })
        
        console.log(`Loading progress: ${totalLoaded}/${totalExpected} (${totalProgress.toFixed(1)}%) - Scripts loaded: ${scriptsLoaded}`)
        
        if (totalLoaded >= totalExpected && scriptsLoaded) {
          clearTimeout(timeoutId)
          // 所有资源预加载完成，再等待 2 秒确保所有效果准备好
          setTimeout(() => {
            setProgress(100)
            setTimeout(() => {
              setShowAudioPermission(true)
            }, 500)
          }, 2000)
        }
      }
      
      // 预加载静态资源
      homeResources.forEach((src, index) => {
        const timeout = setTimeout(() => {
          console.log(`Resource timeout: ${src}`)
          checkComplete('resource')
        }, 5000) // 每个资源5秒超时
        
        if (src.endsWith('.webp') || src.endsWith('.png') || src.endsWith('.jpg')) {
          const img = new Image()
          img.onload = () => {
            clearTimeout(timeout)
            console.log(`Image loaded: ${src}`)
            checkComplete('resource')
          }
          img.onerror = () => {
            clearTimeout(timeout)
            console.log(`Image failed: ${src}`)
            checkComplete('resource')
          }
          img.src = src
        } else if (src.endsWith('.mp4')) {
          const video = document.createElement('video')
          video.oncanplay = () => {
            clearTimeout(timeout)
            console.log(`Video loaded: ${src}`)
            checkComplete('resource')
          }
          video.onerror = () => {
            clearTimeout(timeout)
            console.log(`Video failed: ${src}`)
            checkComplete('resource')
          }
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
            const tracksToPreload = tracks.slice(0, maxMusicTracks)
            
            if (tracksToPreload.length === 0) {
              console.log('No music tracks found')
              // 如果没有音乐文件，也要调用 checkComplete
              for (let i = 0; i < maxMusicTracks; i++) {
                checkComplete('music')
              }
            } else {
              tracksToPreload.forEach((track, index) => {
                if (track.src) {
                  const timeout = setTimeout(() => {
                    console.log(`Music timeout: ${track.src}`)
                    checkComplete('music')
                  }, 8000) // 音乐文件8秒超时
                  
                  const audio = new Audio()
                  audio.oncanplaythrough = () => {
                    clearTimeout(timeout)
                    console.log(`Music loaded: ${track.src}`)
                    checkComplete('music')
                  }
                  audio.onerror = () => {
                    clearTimeout(timeout)
                    console.log(`Music failed: ${track.src}`)
                    checkComplete('music')
                  }
                  audio.src = track.src
                  audio.preload = 'metadata'
                } else {
                  checkComplete('music')
                }
              })
            }
          } else {
            console.log('Firebase not available')
            // 如果 Firebase 不可用，继续
            for (let i = 0; i < maxMusicTracks; i++) {
              checkComplete('music')
            }
          }
        } catch (error) {
          console.log('Music preload error:', error)
          // 如果音乐预加载失败，继续
          for (let i = 0; i < maxMusicTracks; i++) {
            checkComplete('music')
          }
        }
        
        // 开始检查脚本加载状态
        setTimeout(() => {
          checkScriptsLoaded()
        }, 1000)
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
