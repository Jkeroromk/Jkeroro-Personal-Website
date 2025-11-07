/**
 * useVolume Hook
 * 音量控制逻辑（支持 Web Audio API 放大）
 */

import { useState, useRef, useEffect, useCallback } from 'react'

export function useVolume() {
  const [volume, setVolume] = useState(50) // 0-150
  const [isMuted, setIsMuted] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)

  // 初始化 Web Audio API
  const initializeWebAudio = useCallback((audioElement: HTMLAudioElement) => {
    if (audioContextRef.current) return // 已初始化

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      audioContextRef.current = new AudioContext()
      gainNodeRef.current = audioContextRef.current.createGain()
      gainNodeRef.current.connect(audioContextRef.current.destination)

      // 创建 MediaElementSource（只能创建一次）
      try {
        sourceRef.current = audioContextRef.current.createMediaElementSource(audioElement)
        sourceRef.current.connect(gainNodeRef.current)
        audioElement.setAttribute('crossorigin', 'anonymous')
      } catch (error) {
        console.warn('MediaElementSource creation failed, using standard volume:', error)
      }
    } catch (error) {
      console.warn('Web Audio API not supported, using standard volume control:', error)
    }
  }, [])

  // 更新音量
  const updateVolume = useCallback(
    (newVolume: number, audioElement: HTMLAudioElement | null) => {
      if (!audioElement) return

      // 初始化 Web Audio API（如果需要）
      if (gainNodeRef.current) {
        const gainValue =
          newVolume <= 100
            ? newVolume / 100
            : 1.0 + ((newVolume - 100) / 50) * 1.0 // 100-150 映射到 1.0-2.0
        gainNodeRef.current.gain.value = isMuted ? 0 : gainValue
      } else {
        audioElement.volume = isMuted ? 0 : Math.min(1.0, newVolume / 100)
      }
    },
    [isMuted]
  )

  // 调整音量
  const changeVolume = useCallback(
    (delta: number, audioElement: HTMLAudioElement | null) => {
      const newVolume = Math.max(0, Math.min(150, volume + delta))
      setVolume(newVolume)
      setIsMuted(newVolume === 0)
      updateVolume(newVolume, audioElement)
    },
    [volume, updateVolume]
  )

  // 切换静音
  const toggleMute = useCallback(
    (audioElement: HTMLAudioElement | null) => {
      if (!audioElement) return

      if (gainNodeRef.current) {
        const gainValue = isMuted
          ? volume <= 100
            ? volume / 100
            : 1.0 + ((volume - 100) / 50) * 1.0
          : 0
        gainNodeRef.current.gain.value = gainValue
      } else {
        audioElement.volume = isMuted ? Math.min(1.0, volume / 100) : 0
      }
      setIsMuted(!isMuted)
    },
    [isMuted, volume]
  )

  return {
    volume,
    isMuted,
    changeVolume,
    toggleMute,
    initializeWebAudio,
    updateVolume,
  }
}

