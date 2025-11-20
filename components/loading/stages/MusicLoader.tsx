/**
 * MusicLoader Component
 * 音乐加载器 - 优先加载音乐数据
 */

import { useEffect, useRef } from 'react'
import DataManager, { MusicTrack } from '@/lib/data-manager'
import { Track } from '@/types/api'

interface MusicLoaderProps {
  onProgress: (progress: number) => void
  onComplete: (tracks: Track[]) => void
}

// 将 MusicTrack 转换为 Track
function convertToTrack(musicTrack: MusicTrack): Track {
  return {
    ...musicTrack,
    order: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

export default function MusicLoader({ onProgress, onComplete }: MusicLoaderProps) {
  const onProgressRef = useRef(onProgress)
  const onCompleteRef = useRef(onComplete)
  const hasLoadedRef = useRef(false)

  // 更新 ref，但不触发重新请求
  useEffect(() => {
    onProgressRef.current = onProgress
    onCompleteRef.current = onComplete
  }, [onProgress, onComplete])

  useEffect(() => {
    // 防止重复加载
    if (hasLoadedRef.current) return
    
    let isMounted = true
    hasLoadedRef.current = true

    const loadMusic = async () => {
      try {
        // 立即开始加载音乐（最高优先级）
        const response = await fetch('/api/media/tracks')

        if (!isMounted) return

        if (response.ok) {
          const tracks = await response.json()
          if (tracks && Array.isArray(tracks) && tracks.length > 0) {
            // 保存到 DataManager
            const dataManager = DataManager.getInstance()
            dataManager.saveTracks(tracks)
            
            // 预加载第一首音乐的音频文件
            if (tracks[0]?.src) {
              const audio = new Audio()
              audio.preload = 'auto'
              audio.src = tracks[0].src
              
              // 等待音频元数据加载
              audio.addEventListener('loadedmetadata', () => {
                if (isMounted) {
                  onProgressRef.current(20)
                  onCompleteRef.current(tracks)
                }
              }, { once: true })

              audio.addEventListener('error', () => {
                // 即使音频加载失败，也认为音乐数据已准备好
                if (isMounted) {
                  onProgressRef.current(20)
                  onCompleteRef.current(tracks)
                }
              }, { once: true })
            } else {
              // 没有音频源，直接完成
              onProgressRef.current(20)
              onCompleteRef.current(tracks)
            }
            return
          }
        }

        // API 失败，尝试使用缓存数据
        const dataManager = DataManager.getInstance()
        const cachedTracks = dataManager.getTracks()
        if (cachedTracks && cachedTracks.length > 0) {
          onProgressRef.current(20)
          // 将 MusicTrack[] 转换为 Track[]
          const tracks = cachedTracks.map(convertToTrack)
          onCompleteRef.current(tracks)
          return
        }

        // 没有音乐数据，也标记为完成（避免阻塞）
        onProgressRef.current(20)
        onCompleteRef.current([])
      } catch {
        // 静默处理错误，使用默认进度
        if (isMounted) {
          onProgressRef.current(20)
          onCompleteRef.current([])
        }
      }
    }

    loadMusic()

    return () => {
      isMounted = false
    }
  }, []) // 空依赖数组，只在组件挂载时执行一次

  return null
}

