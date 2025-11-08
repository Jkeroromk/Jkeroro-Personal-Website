/**
 * useAudioPlayer Hook
 * 音频播放器核心逻辑
 */

import { useState, useRef, useEffect, useCallback, RefObject } from 'react'
import { Track } from '@/types/api'

interface UseAudioPlayerProps {
  tracks: Track[]
  isLooping: boolean
  isShuffled: boolean
  audioRef: RefObject<HTMLAudioElement | null>
  onTrackEnd?: () => void
}

export function useAudioPlayer({
  tracks,
  isLooping,
  isShuffled,
  audioRef,
  onTrackEnd,
}: UseAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const playPromiseRef = useRef<Promise<void> | null>(null)
  // 使用 ref 保存播放状态，确保在 ended 事件中能获取到正确的状态
  const isPlayingRef = useRef(false)

  // 安全的播放函数
  const safePlay = useCallback(async () => {
    const audio = audioRef.current
    if (!audio) return false

    // 取消之前的播放请求
    if (playPromiseRef.current) {
      try {
        await playPromiseRef.current
      } catch (error) {
        // 忽略 AbortError
      }
      playPromiseRef.current = null
    }

    try {
      // 确保音频源已设置
      if (!audio.src) {
        console.warn('Audio src is not set')
        return false
      }

      // 如果音频还没加载，先加载
      if (audio.readyState === 0) {
        audio.load()
        // 等待加载完成（最多等待 5 秒）
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            audio.removeEventListener('canplay', onCanPlay)
            audio.removeEventListener('error', onError)
            reject(new Error('Audio load timeout'))
          }, 5000)
          
          const onCanPlay = () => {
            clearTimeout(timeout)
            audio.removeEventListener('canplay', onCanPlay)
            audio.removeEventListener('error', onError)
            resolve()
          }
          
          const onError = () => {
            clearTimeout(timeout)
            audio.removeEventListener('canplay', onCanPlay)
            audio.removeEventListener('error', onError)
            reject(new Error('Audio load error'))
          }
          
          audio.addEventListener('canplay', onCanPlay, { once: true })
          audio.addEventListener('error', onError, { once: true })
        })
      }

      // 如果音频在暂停状态，尝试播放
      if (audio.paused) {
        try {
          playPromiseRef.current = audio.play()
          await playPromiseRef.current
        } catch (playError) {
          // 如果播放失败，抛出错误让上层处理
          throw playError
        }
      } else {
        // 如果已经在播放，确保状态正确
        setIsPlaying(true)
        isPlayingRef.current = true
        return true
      }
      
      // 等待一小段时间确保播放已开始
      await new Promise(resolve => setTimeout(resolve, 50))
      
      // 验证音频确实在播放
      if (audio.paused) {
        setIsPlaying(false)
        isPlayingRef.current = false
        return false
      }
      
      setIsPlaying(true)
      isPlayingRef.current = true
      return true
    } catch (error) {
      const errorName = (error as Error).name
      if (errorName !== 'AbortError' && errorName !== 'NotAllowedError') {
        console.warn('Play failed:', error)
      }
      setIsPlaying(false)
      isPlayingRef.current = false
      return false
    } finally {
      playPromiseRef.current = null
    }
  }, [])

  // 切换播放/暂停
  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
      isPlayingRef.current = false
    } else {
      audio
        .play()
        .then(() => {
          setIsPlaying(true)
          isPlayingRef.current = true
        })
        .catch((error) => {
          if ((error as Error).name !== 'AbortError') {
            setIsPlaying(false)
            isPlayingRef.current = false
          }
        })
    }
  }, [isPlaying])

  // 跳转曲目
  const skipTrack = useCallback(
    (direction: number, shouldAutoPlay?: boolean) => {
      if (!tracks || tracks.length === 0) return

      let newIndex: number
      if (isShuffled) {
        // 随机播放模式
        do {
          newIndex = Math.floor(Math.random() * tracks.length)
        } while (newIndex === currentTrackIndex && tracks.length > 1)
      } else {
        // 正常顺序播放
        newIndex = (currentTrackIndex + direction + tracks.length) % tracks.length
      }

      // 如果明确指定了 shouldAutoPlay，使用它；否则使用当前的 isPlaying 状态
      // 使用 ref 来获取最新的播放状态，避免闭包问题
      const willPlay = shouldAutoPlay !== undefined ? shouldAutoPlay : isPlayingRef.current
      
      // 更新索引，这会触发 useEffect 来加载新歌曲
      setCurrentTrackIndex(newIndex)
      
      // 注意：实际的播放会在 useEffect 中处理（当音频源改变时）
      // 这里只更新状态标记
      if (willPlay) {
        isPlayingRef.current = true
      } else {
        isPlayingRef.current = false
      }
    },
    [tracks, currentTrackIndex, isShuffled]
  )

  // 更新时间
  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current
    if (audio) {
      setCurrentTime(audio.currentTime)
      setDuration(audio.duration)
    }
  }, [])

  // 格式化时间
  const formatTime = useCallback((seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }, [])

  // 设置当前时间
  const setCurrentTimeValue = useCallback((time: number) => {
    const audio = audioRef.current
    if (audio) {
      audio.currentTime = time
    }
  }, [])

  // 更新音频源 - 只在曲目或循环设置改变时更新
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !tracks[currentTrackIndex]?.src) return

    const newSrc = tracks[currentTrackIndex].src
    
    // 只有当音频源真正改变时才重新设置，避免不必要的重新加载
    if (audio.src !== newSrc) {
      // 保存当前播放状态（使用 ref 来获取最新状态，避免闭包问题）
      const shouldContinuePlaying = isPlayingRef.current
      
      // 立即重置进度条到 0（新歌曲开始）
      setCurrentTime(0)
      setDuration(0)
      
      audio.src = newSrc
      audio.loop = isLooping
      
      // 立即触发加载
      audio.load()

      // 立即更新时间（当音频源改变时）
      const updateTime = () => {
        setCurrentTime(audio.currentTime || 0)
        setDuration(audio.duration || 0)
      }
      audio.addEventListener('loadedmetadata', updateTime, { once: true })
      audio.addEventListener('canplay', updateTime, { once: true })

      // 如果之前正在播放，继续播放新歌曲
      if (shouldContinuePlaying) {
        // 先设置播放状态为 true（UI 更新）
        setIsPlaying(true)
        isPlayingRef.current = true
        
        // 等待音频可以播放后再播放
        const playWhenReady = async () => {
          try {
            // 确保音频已加载
            if (audio.readyState < 2) {
              // 等待 canplay 事件（最多等待 5 秒）
              await new Promise<void>((resolve, reject) => {
                const timeout = setTimeout(() => {
                  audio.removeEventListener('canplay', onCanPlay)
                  audio.removeEventListener('error', onError)
                  reject(new Error('Audio load timeout'))
                }, 5000)
                
                const onCanPlay = () => {
                  clearTimeout(timeout)
                  audio.removeEventListener('canplay', onCanPlay)
                  audio.removeEventListener('error', onError)
                  resolve()
                }
                
                const onError = () => {
                  clearTimeout(timeout)
                  audio.removeEventListener('canplay', onCanPlay)
                  audio.removeEventListener('error', onError)
                  reject(new Error('Audio load error'))
                }
                
                audio.addEventListener('canplay', onCanPlay, { once: true })
                audio.addEventListener('error', onError, { once: true })
                
                // 如果 readyState 是 0，确保加载
                if (audio.readyState === 0) {
                  audio.load()
                }
              })
            }

            // 尝试播放（最多重试 3 次）
            let retries = 3
            let success = false
            
            while (retries > 0 && !success) {
              success = await safePlay()
              if (!success) {
                retries--
                if (retries > 0) {
                  // 等待一小段时间后重试
                  await new Promise(resolve => setTimeout(resolve, 200))
                }
              }
            }
            
            if (!success) {
              // 播放失败，重置状态
              console.warn('Failed to auto-play next track after retries')
              setIsPlaying(false)
              isPlayingRef.current = false
              return
            }
            
            // 再次验证音频确实在播放（等待一小段时间确保播放已开始）
            await new Promise(resolve => setTimeout(resolve, 150))
            if (audio.paused) {
              // 如果音频仍然暂停，说明播放失败
              console.warn('Audio is still paused after play attempt')
              setIsPlaying(false)
              isPlayingRef.current = false
              return
            }
            
            // 播放成功，确保状态正确
            setIsPlaying(true)
            isPlayingRef.current = true
          } catch (error) {
            console.warn('Failed to auto-play next track:', error)
            setIsPlaying(false)
            isPlayingRef.current = false
          }
        }
        
        // 使用 setTimeout 确保音频源已设置完成后再尝试播放
        // 使用较短的延迟，让浏览器有时间处理音频源变更
        setTimeout(() => {
          playWhenReady()
        }, 50)
      } else {
        // 如果不应该播放，确保状态正确
        setIsPlaying(false)
        isPlayingRef.current = false
      }
    } else {
      // 音频源没变，只更新循环设置
      audio.loop = isLooping
    }
  }, [currentTrackIndex, tracks, isLooping, safePlay])

  // MediaSession API - 单独管理，避免不必要的重新设置
  useEffect(() => {
    if (!('mediaSession' in navigator) || !tracks[currentTrackIndex]) return

    navigator.mediaSession.metadata = new MediaMetadata({
      title: tracks[currentTrackIndex]?.title || 'Unknown Title',
      artist: tracks[currentTrackIndex]?.subtitle || 'Unknown Artist',
      album: 'Jkeroro Music',
      artwork: [
        { src: '/512.png', sizes: '512x512', type: 'image/png' },
        { src: '/192.png', sizes: '192x192', type: 'image/png' },
      ],
    })

    navigator.mediaSession.setActionHandler('play', togglePlayPause)
    navigator.mediaSession.setActionHandler('pause', togglePlayPause)
    navigator.mediaSession.setActionHandler('previoustrack', () => skipTrack(-1))
    navigator.mediaSession.setActionHandler('nexttrack', () => skipTrack(1))
  }, [currentTrackIndex, tracks, togglePlayPause, skipTrack])

  // 监听播放结束
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleEnded = () => {
      if (!isLooping) {
        // 歌曲播放结束时，如果之前正在播放，切换到下一首并继续播放
        // 使用 ref 来获取播放状态，确保获取到的是播放结束前的状态
        const wasPlaying = isPlayingRef.current
        skipTrack(1, wasPlaying)
      }
    }

    audio.addEventListener('ended', handleEnded)
    return () => {
      audio.removeEventListener('ended', handleEnded)
    }
  }, [isLooping, skipTrack])

  // 监听时间更新 - 使用轮询确保时间更新
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => {
      if (audio) {
        setCurrentTime(audio.currentTime)
        if (audio.duration && !isNaN(audio.duration)) {
          setDuration(audio.duration)
        }
      }
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleTimeUpdate)
    audio.addEventListener('canplay', handleTimeUpdate)

    // 添加轮询作为备用方案（每100ms更新一次）
    const intervalId = setInterval(() => {
      if (audio && !audio.paused) {
        setCurrentTime(audio.currentTime)
        if (audio.duration && !isNaN(audio.duration)) {
          setDuration(audio.duration)
        }
      }
    }, 100)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleTimeUpdate)
      audio.removeEventListener('canplay', handleTimeUpdate)
      clearInterval(intervalId)
    }
  }, [tracks, currentTrackIndex]) // 当曲目改变时重新绑定监听器

  // 更新循环设置
  useEffect(() => {
    const audio = audioRef.current
    if (audio) {
      audio.loop = isLooping
    }
  }, [isLooping])

  return {
    isPlaying,
    currentTrackIndex,
    setCurrentTrackIndex,
    currentTime,
    duration,
    togglePlayPause,
    skipTrack,
    formatTime,
    setCurrentTimeValue,
    safePlay,
  }
}

