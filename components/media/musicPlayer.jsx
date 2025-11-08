/**
 * MusicPlayer Component (Refactored)
 * 音乐播放器主组件 - 重构版本
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { useTracks } from '@/hooks/useTracks'
import { useAudioPlayer } from '@/hooks/useAudioPlayer'
import { useVolume } from '@/hooks/useVolume'
import TrackInfo from './musicPlayer/TrackInfo'
import PlayerControls from './musicPlayer/PlayerControls'
import ProgressBar from './musicPlayer/ProgressBar'
import VolumeControl from './musicPlayer/VolumeControl'

export default function MusicPlayer() {
  const { tracks, loading } = useTracks()
  const [isLooping, setIsLooping] = useState(false)
  const [isShuffled, setIsShuffled] = useState(false)
  const audioRef = useRef(null)

  const {
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
  } = useAudioPlayer({
    tracks,
    isLooping,
    isShuffled,
    audioRef,
  })

  const { volume, isMuted, changeVolume, toggleMute, initializeWebAudio, updateVolume } =
    useVolume()

  // 初始化 Web Audio API
  useEffect(() => {
    if (audioRef.current) {
      initializeWebAudio(audioRef.current)
    }
  }, [initializeWebAudio])

  // 更新音量
  useEffect(() => {
    if (audioRef.current) {
      updateVolume(volume, audioRef.current)
    }
  }, [volume, isMuted, updateVolume])

  // 检查localStorage中的音频权限设置并自动播放
  useEffect(() => {
    // 确保在客户端环境运行
    if (typeof window === 'undefined') return

    // 确保有音乐数据且不在加载中
    if (loading || !tracks || tracks.length === 0) {
      return
    }

    // 获取当前曲目
    const currentTrack = tracks[currentTrackIndex]

    const audioPermission = localStorage.getItem('audioPermission')
    const fromLoading = sessionStorage.getItem('fromLoading')

    if (audioPermission === 'allowed' && fromLoading && !isPlaying) {
      // 如果用户允许了音频且从loading页面跳转过来，自动播放
      const audio = audioRef.current
      if (audio && currentTrack?.src) {
        audio.muted = false
        
        // 等待音频元素准备好
        const tryPlay = async () => {
          if (!audio || !audio.src) return
          
          // 如果音频还没加载，等待加载完成
          if (audio.readyState < 2) {
            audio.addEventListener('canplay', async () => {
              if (!isPlaying) {
                await safePlay()
              }
              sessionStorage.removeItem('fromLoading')
            }, { once: true })
            
            // 触发加载
            audio.load()
          } else {
            // 音频已准备好，直接播放
            await safePlay()
            sessionStorage.removeItem('fromLoading')
          }
        }
        
        // 延迟一点确保 DOM 已更新
        const playTimer = setTimeout(tryPlay, 300)
        
        return () => clearTimeout(playTimer)
      }
    }
  }, [loading, tracks, currentTrackIndex, isPlaying, safePlay])

  // 如果没有音乐数据，显示空状态
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center mt-10">
        <div className="text-center text-gray-400">
          <p className="text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  if (!tracks || tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center mt-10">
        <div className="text-center text-gray-400 max-w-md">
          <div className="mb-4">
            <svg
              className="w-16 h-16 mx-auto text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">No Music Available</h2>
          <p className="text-sm text-gray-400 mb-4">
            Your music library is empty. Upload your favorite tracks to get started!
          </p>
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <p className="text-xs text-gray-300 mb-2">How to add music:</p>
            <ol className="text-xs text-gray-400 space-y-1 text-left">
              <li>1. Go to Admin Panel</li>
              <li>2. Click on "Music" tab</li>
              <li>3. Upload your music files</li>
              <li>4. Add title and artist info</li>
            </ol>
          </div>
        </div>
      </div>
    )
  }

  // 确保当前轨道索引有效
  if (currentTrackIndex >= tracks.length) {
    setCurrentTrackIndex(0)
    return null
  }

  const currentTrack = tracks[currentTrackIndex]

  return (
    <div
      className="flex flex-col items-center justify-center mt-4 w-full"
      style={{ height: '400px' }}
    >
      {currentTrack?.src && (
        <audio
          ref={audioRef}
          src={currentTrack.src}
          muted={isMuted}
          preload="auto"
          onTimeUpdate={() => {
            const audio = audioRef.current
            if (audio) {
              // 时间更新由 useAudioPlayer hook 处理
            }
          }}
          onLoadedMetadata={() => {
            const audio = audioRef.current
            if (audio) {
              // 元数据加载由 useAudioPlayer hook 处理
            }
          }}
        />
      )}

      <div
        className="flex flex-col items-center bg-opacity-70 p-6 rounded-lg w-72 text-white"
        style={{ height: '300px' }}
      >
        <TrackInfo track={currentTrack} />

        <PlayerControls
          isPlaying={isPlaying}
          onPlayPause={togglePlayPause}
          onSkipBack={() => skipTrack(-1)}
          onSkipForward={() => skipTrack(1)}
        />

        <ProgressBar
          currentTime={currentTime}
          duration={duration}
          onSeek={setCurrentTimeValue}
          formatTime={formatTime}
        />

        <VolumeControl
          volume={volume}
          isMuted={isMuted}
          isLooping={isLooping}
          isShuffled={isShuffled}
          onVolumeChange={(delta) => changeVolume(delta, audioRef.current)}
          onToggleMute={() => toggleMute(audioRef.current)}
          onToggleLoop={() => setIsLooping(!isLooping)}
          onToggleShuffle={() => setIsShuffled(!isShuffled)}
        />
      </div>
    </div>
  )
}

