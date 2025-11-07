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
  const [isInitialized, setIsInitialized] = useState(false) // 防止重复初始化
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
      // 静默处理存储错误
    }
    
    // 先隐藏模态框
    setShowAudioPermission(false)
    setIsFadingOut(true)
    
    // 延迟跳转，确保动画完成
    setTimeout(() => {
      // 使用单一跳转方式，避免双重跳转
      router.replace('/home')
    }, 500)
  }

  useEffect(() => {
    // 防止重复初始化
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
      { en: 'Almost ready to launch...', zh: '即将准备就绪...' }
    ]

    // 更新加载描述 - 减少频率
    const descriptionInterval = setInterval(() => {
      const randomDesc = descriptions[Math.floor(Math.random() * descriptions.length)]
      setLoadingDescription(randomDesc)
    }, 3000)

    // 简化的进度系统
    let isCompleted = false
    let resourceProgress = 0
    let scriptProgress = 0
    let musicProgress = 0
    let databaseProgress = 0
    
    // 平滑进度更新函数
    const updateProgress = () => {
      if (isCompleted) return
      
      // 资源占40%，脚本占20%，音乐占20%，数据库占20%
      const totalProgress = Math.min(95, resourceProgress + scriptProgress + musicProgress + databaseProgress)
      setProgress(prev => {
        // 确保进度只增不减，并且平滑增长
        if (totalProgress > prev) {
          return Math.min(totalProgress, prev + 2) // 每次最多增加2%
        }
        return prev
      })
      
      // 检查是否完成 - 需要所有资源都加载完成
      // 降低完成阈值到 80%，让用户更快进入（剩余数据可以后台加载）
      if (totalProgress >= 80 && !isCompleted) {
        isCompleted = true
        setTimeout(() => {
          setProgress(100)
          setTimeout(() => {
            setShowAudioPermission(true)
          }, 300) // 减少延迟，从 800ms 到 300ms
        }, 500) // 减少延迟，从 1000ms 到 500ms
      }
    }

    // 预加载 home 页面的关键资源（立即开始，不延迟）
    const preloadHomeResources = () => {
      const homeResources = [
        '/pfp.webp',
        '/me.webp', 
        '/static/car.png',
        '/static/car.webp',
        '/static/glow.png',
        '/header.webp',
        '/background.mp4',
      ]
      
      let loadedCount = 0
      const totalResources = homeResources.length
      let musicDataLoaded = false
      
      // 超时保护：如果8秒内没有完成，强制继续（减少等待时间）
      const timeoutId = setTimeout(() => {
        resourceProgress = 40
        scriptProgress = 20
        musicProgress = 20
        databaseProgress = 20 // 强制设置数据库进度
        updateProgress()
      }, 8000) // 从 20 秒减少到 8 秒
      
      // 检查音乐数据（从 API 或本地数据）
      const checkMusicResources = async () => {
        try {
          // 尝试从 API 加载音乐数据
          try {
            const response = await fetch('/api/media/tracks')
            if (response.ok) {
              const tracks = await response.json()
              if (tracks && tracks.length > 0) {
                musicDataLoaded = true
                // 保存到 DataManager 供 home 页面使用
                const DataManager = (await import('@/lib/data-manager')).default
                const dataManager = DataManager.getInstance()
                dataManager.saveTracks(tracks)
                musicProgress = 20
                updateProgress()
                return
              }
            }
          } catch (apiError) {
            // API 失败，降级到本地数据
          }
          
          // 降级到本地数据
          const DataManager = (await import('@/lib/data-manager')).default
          const dataManager = DataManager.getInstance()
          const localTracks = dataManager.getTracks()
          if (localTracks && localTracks.length > 0) {
            musicDataLoaded = true
          }
          
          // 更新进度
          if (musicDataLoaded) {
            musicProgress = 20
            updateProgress()
          }
        } catch (error) {
          // 静默处理错误，使用默认进度
          musicProgress = 20
          updateProgress()
        }
      }
      
      // 预加载数据库数据（images, projects, tracks, countries, view_count）
      const preloadDatabaseData = async () => {
        try {
          setLoadingDescription({ en: 'Loading database...', zh: '加载数据库...' })
          
          const DataManager = (await import('@/lib/data-manager')).default
          const dataManager = DataManager.getInstance()
          
          // 并行加载所有数据库数据（包括 countries 和 view_count）
          const [imagesResponse, projectsResponse, tracksResponse, countriesResponse, viewCountResponse] = await Promise.allSettled([
            fetch('/api/media/images').catch(() => ({ ok: false, json: () => [] })),
            fetch('/api/media/projects').catch(() => ({ ok: false, json: () => [] })),
            fetch('/api/media/tracks').catch(() => ({ ok: false, json: () => [] })),
            fetch('/api/stats/countries').catch(() => ({ ok: false, json: () => [] })),
            fetch('/api/stats/view').catch(() => ({ ok: false, json: () => ({ count: 0 }) }))
          ])
          
          let loadedCount = 0
          
          // 处理图片数据
          if (imagesResponse.status === 'fulfilled' && imagesResponse.value.ok) {
            try {
              const images = await imagesResponse.value.json()
              if (images && Array.isArray(images)) {
                dataManager.saveImages(images)
                loadedCount++
              }
            } catch (e) {
              // 静默处理错误
            }
          }
          
          // 处理项目数据
          if (projectsResponse.status === 'fulfilled' && projectsResponse.value.ok) {
            try {
              const projects = await projectsResponse.value.json()
              if (projects && Array.isArray(projects)) {
                dataManager.saveProjects(projects)
                loadedCount++
              }
            } catch (e) {
              // 静默处理错误
            }
          }
          
          // 处理音乐数据（如果 checkMusicResources 还没完成）
          if (tracksResponse.status === 'fulfilled' && tracksResponse.value.ok) {
            try {
              const tracks = await tracksResponse.value.json()
              if (tracks && Array.isArray(tracks)) {
                dataManager.saveTracks(tracks)
                if (!musicDataLoaded) {
                  musicDataLoaded = true
                  musicProgress = 20
                }
                loadedCount++
              }
            } catch (e) {
              // 静默处理错误
            }
          }
          
          // 处理国家数据
          if (countriesResponse.status === 'fulfilled' && countriesResponse.value.ok) {
            try {
              const countries = await countriesResponse.value.json()
              if (countries && Array.isArray(countries)) {
                dataManager.saveCountries(countries)
                loadedCount++
              }
            } catch (e) {
              // 静默处理错误
            }
          }
          
          // 处理 viewer count 数据（可选，不阻塞）
          if (viewCountResponse.status === 'fulfilled' && viewCountResponse.value.ok) {
            try {
              const viewData = await viewCountResponse.value.json()
              if (viewData && typeof viewData.count === 'number') {
                // 可以保存到 localStorage 供 ViewerStats 使用
                localStorage.setItem('jkeroro-view-count', JSON.stringify(viewData))
              }
            } catch (e) {
              // 静默处理错误
            }
          }
          
          // 更新数据库加载进度（至少加载了1个就算成功）
          databaseProgress = loadedCount >= 1 ? 20 : 10
          updateProgress()
          
          setLoadingDescription({ en: 'Database loaded', zh: '数据库加载完成' })
        } catch (error) {
          // 静默处理错误，至少给一些进度
          databaseProgress = 10
          updateProgress()
        }
      }
      
      // 检查脚本是否加载完成
      const checkScriptsLoaded = () => {
        if (typeof window !== 'undefined' && 
            window.THREE && 
            window.THREE.PerspectiveCamera) {
          scriptProgress = 20
          updateProgress()
        } else {
          setTimeout(checkScriptsLoaded, 200)
        }
      }

      const onResourceLoaded = () => {
        loadedCount++
        resourceProgress = (loadedCount / totalResources) * 40 // 资源占40%
        updateProgress()
      }
      
      // 预加载静态资源
      homeResources.forEach((src, index) => {
        const timeout = setTimeout(() => {
          onResourceLoaded()
        }, 5000) // 每个资源5秒超时
        
        if (src.endsWith('.webp') || src.endsWith('.png') || src.endsWith('.jpg')) {
          const img = new Image()
          img.onload = () => {
            clearTimeout(timeout)
            onResourceLoaded()
          }
          img.onerror = () => {
            clearTimeout(timeout)
            onResourceLoaded()
          }
          img.src = src
          // 添加 fetchpriority 提示浏览器优先加载
          if (src === '/me.webp' || src === '/pfp.webp') {
            img.fetchPriority = 'high'
          }
        } else if (src.endsWith('.mp4')) {
          const video = document.createElement('video')
          video.oncanplay = () => {
            clearTimeout(timeout)
            onResourceLoaded()
          }
          video.onerror = () => {
            clearTimeout(timeout)
            onResourceLoaded()
          }
          video.src = src
          video.preload = 'metadata'
          // 视频不需要完全加载，metadata 就够了
        }
      })
      
      // 立即开始检查脚本加载状态（不延迟）
        checkScriptsLoaded()
      
      // 立即开始检查音乐资源（不延迟）
        checkMusicResources()
      
      // 立即开始预加载数据库数据（不延迟）
        preloadDatabaseData()
    }
    
    // 立即开始预加载（不延迟，让用户更快进入）
    preloadHomeResources()
    
    // 确保进度从0开始
    setProgress(0)

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
  }, [isInitialized]) // 添加isInitialized依赖

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
