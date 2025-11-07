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
      return true
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        setIsPlaying(false)
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
    } else {
      audio
        .play()
        .then(() => {
          setIsPlaying(true)
        })
        .catch((error) => {
          if ((error as Error).name !== 'AbortError') {
            setIsPlaying(false)
          }
        })
    }
  }, [isPlaying])

  // 跳转曲目
  const skipTrack = useCallback(
    (direction: number) => {
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

      setCurrentTrackIndex(newIndex)
      // 如果当前正在播放，继续播放下一首
      if (isPlaying) {
        setIsPlaying(true)
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

  // 更新音频源
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !tracks[currentTrackIndex]?.src) return

    audio.src = tracks[currentTrackIndex].src
    audio.loop = isLooping

    // 立即更新时间（当音频源改变时）
    const updateTime = () => {
      setCurrentTime(audio.currentTime)
      setDuration(audio.duration)
    }
    audio.addEventListener('loadedmetadata', updateTime, { once: true })
    audio.addEventListener('canplay', updateTime, { once: true })

    if (isPlaying) {
      safePlay()
    }

    // MediaSession API
    if ('mediaSession' in navigator) {
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
    }
  }, [currentTrackIndex, tracks, isLooping, isPlaying, safePlay, togglePlayPause, skipTrack])

  // 监听播放结束
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleEnded = () => {
      if (!isLooping) {
        skipTrack(1)
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

