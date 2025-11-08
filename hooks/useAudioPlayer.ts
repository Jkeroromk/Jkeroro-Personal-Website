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
    }

    try {
      playPromiseRef.current = audio.play()
      await playPromiseRef.current
      setIsPlaying(true)
      isPlayingRef.current = true
      return true
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        setIsPlaying(false)
        isPlayingRef.current = false
      }
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
      const willPlay = shouldAutoPlay !== undefined ? shouldAutoPlay : isPlaying
      
      setCurrentTrackIndex(newIndex)
      // 如果应该继续播放，保持播放状态
      if (willPlay) {
        setIsPlaying(true)
        isPlayingRef.current = true
      } else {
        isPlayingRef.current = false
      }
    },
    [tracks, currentTrackIndex, isShuffled, isPlaying]
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
      // 保存当前播放状态（使用 isPlaying 状态，而不是 audio.paused）
      const shouldContinuePlaying = isPlaying
      
      // 立即重置进度条到 0（新歌曲开始）
      setCurrentTime(0)
      setDuration(0)
      
      audio.src = newSrc
      audio.loop = isLooping

      // 立即更新时间（当音频源改变时）
      const updateTime = () => {
        setCurrentTime(audio.currentTime || 0)
        setDuration(audio.duration || 0)
      }
      audio.addEventListener('loadedmetadata', updateTime, { once: true })
      audio.addEventListener('canplay', updateTime, { once: true })

      // 如果之前正在播放，继续播放新歌曲
      if (shouldContinuePlaying) {
        // 等待音频可以播放后再播放
        const playWhenReady = async () => {
          // 确保音频已加载
          if (audio.readyState < 2) {
            // 等待音频加载完成
            const playOnReady = async () => {
              try {
                await safePlay()
              } catch (error) {
                console.warn('Failed to auto-play next track:', error)
              }
            }
            audio.addEventListener('canplay', playOnReady, { once: true })
            // 触发加载（如果还没有加载）
            if (audio.readyState === 0) {
              audio.load()
            }
          } else {
            // 音频已准备好，直接播放
            try {
              await safePlay()
            } catch (error) {
              console.warn('Failed to auto-play next track:', error)
            }
          }
        }
        // 使用 setTimeout 确保音频源已设置完成
        setTimeout(playWhenReady, 0)
      }
    } else {
      // 音频源没变，只更新循环设置
      audio.loop = isLooping
    }
  }, [currentTrackIndex, tracks, isLooping, isPlaying, safePlay])

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
  }, [isLooping, skipTrack, isPlaying])

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

