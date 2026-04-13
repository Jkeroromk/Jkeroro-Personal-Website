/**
 * MusicPlayer Component (Refactored)
 * 音乐播放器主组件 - 重构版本
 */

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react'
import { useTracks } from '@/hooks/useTracks'
import { useAudioPlayer } from '@/hooks/useAudioPlayer'
import { useVolume } from '@/hooks/useVolume'
import { useLyrics, prefetchLyrics } from '@/hooks/useLyrics'
import TrackInfo from './musicPlayer/TrackInfo'
import PlayerControls from './musicPlayer/PlayerControls'
import ProgressBar from './musicPlayer/ProgressBar'
import VolumeControl from './musicPlayer/VolumeControl'
import LyricsDisplay from './musicPlayer/LyricsDisplay'

export default function MusicPlayer() {
  const { tracks, loading } = useTracks()
  const [isLooping, setIsLooping] = useState(false)
  const [isShuffled, setIsShuffled] = useState(false)
  const [showMiniPlayer, setShowMiniPlayer] = useState(false)
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

  const currentTrackForLyrics = tracks?.[currentTrackIndex] ?? null
  const { lyrics } = useLyrics(currentTrackForLyrics)

  // tracks 加载完后立即预取所有歌词
  useEffect(() => {
    if (tracks?.length) prefetchLyrics(tracks)
  }, [tracks])

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

  // callback ref 模式：节点就绪时才挂 IntersectionObserver
  const [playerNode, setPlayerNode] = useState(null)
  const playerRef = useCallback((node) => setPlayerNode(node), [])

  useEffect(() => {
    if (!playerNode) return
    const observer = new IntersectionObserver(
      ([entry]) => setShowMiniPlayer(!entry.isIntersecting),
      { threshold: 0.2 }
    )
    observer.observe(playerNode)
    return () => observer.disconnect()
  }, [playerNode])

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
    <div className="flex flex-col items-center justify-center py-14 w-full">
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

      <div ref={playerRef} className="relative w-full sm:w-[550px] rounded-2xl text-white overflow-hidden">

        <style>{`
          @keyframes cover-fadein {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
        `}</style>


        {/* 内容层 */}
        <div className="relative z-10 p-6 flex flex-col gap-5">

          {/* 上半：标题 + 歌词/封面 */}
          <div className="flex flex-col items-center w-full">
            <TrackInfo track={currentTrack} />
            <div className="w-full mt-2">
              {/* 无歌词 + 有封面：在控制栏宽度内展示专辑封面 */}
              {(!lyrics || lyrics.length === 0) && currentTrack?.cover ? (
                <div className="w-full max-w-[300px] mx-auto" style={{ height: '130px' }}>
                  <img
                    key={currentTrack.cover}
                    src={currentTrack.cover}
                    alt="Album Cover"
                    className="w-full h-full object-cover rounded-xl shadow-lg"
                    style={{ animation: 'cover-fadein 0.6s ease forwards' }}
                  />
                </div>
              ) : (
                <LyricsDisplay
                  lyrics={lyrics}
                  currentTime={currentTime}
                  lyricsOffset={currentTrack?.lyricsOffset ?? 0}
                  hasCover={!!currentTrack?.cover}
                />
              )}
            </div>
          </div>

          {/* 下半：控制栏 */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-full max-w-[300px]">
              <PlayerControls
                isPlaying={isPlaying}
                onPlayPause={togglePlayPause}
                onSkipBack={() => skipTrack(-1, true)}
                onSkipForward={() => skipTrack(1, true)}
              />
              <ProgressBar
                currentTime={currentTime}
                duration={duration}
                onSeek={setCurrentTimeValue}
                formatTime={formatTime}
              />
            </div>
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
      </div>

      {/* ── Mini Player ── */}
      <style>{`
        @keyframes mini-slidein {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes mini-slideout {
          from { transform: translateY(0);    opacity: 1; }
          to   { transform: translateY(100%); opacity: 0; }
        }
      `}</style>

      {showMiniPlayer && (
        <div
          className="fixed z-50 text-white shadow-2xl
            bottom-0 left-0 right-0 rounded-t-2xl
            sm:bottom-4 sm:left-auto sm:right-4 sm:w-72 sm:rounded-2xl"
          style={{ animation: 'mini-slidein 0.3s ease forwards' }}
        >
          {/* 模糊封面背景 */}
          {currentTrack?.cover && (
            <div
              className="absolute inset-0 z-0 hidden sm:block"
              style={{
                backgroundImage: `url(${currentTrack.cover})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(28px)',
                transform: 'scale(1.4)',
                borderRadius: 'inherit',
              }}
            />
          )}
          <div
            className="absolute inset-0 z-0"
            style={{
              background: currentTrack?.cover
                ? 'rgba(0,0,0,0.6)'
                : 'rgba(20,20,20,0.92)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 'inherit',
            }}
          />

          {/* 内容 */}
          <div
            className="relative z-10 flex items-center gap-3 px-4 py-3"
            style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
          >
            {/* 移动端封面缩略图 */}
            {currentTrack?.cover && (
              <img
                src={currentTrack.cover}
                alt=""
                className="w-10 h-10 rounded-lg object-cover flex-shrink-0 sm:hidden"
              />
            )}

            {/* 歌名 + 歌手 */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate leading-tight">
                {currentTrack?.title || 'No Track'}
              </p>
              {currentTrack?.subtitle && (
                <p className="text-xs text-white/50 truncate mt-0.5">
                  {currentTrack.subtitle}
                </p>
              )}
            </div>

            {/* 控制按钮 */}
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              <button
                onClick={() => skipTrack(-1, true)}
                className="w-10 h-10 sm:w-auto sm:h-auto flex items-center justify-center text-white/70 hover:text-white active:scale-90 transition-all duration-200"
              >
                <SkipBack size={18} />
              </button>
              <button
                onClick={togglePlayPause}
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 active:bg-white/40 flex items-center justify-center transition-all duration-200 active:scale-90"
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              </button>
              <button
                onClick={() => skipTrack(1, true)}
                className="w-10 h-10 sm:w-auto sm:h-auto flex items-center justify-center text-white/70 hover:text-white active:scale-90 transition-all duration-200"
              >
                <SkipForward size={18} />
              </button>
            </div>
          </div>

          {/* 进度条 */}
          <div className="relative z-10 h-[3px] bg-white/10 mx-4 mb-3 rounded-full overflow-hidden">
            <div
              className="h-full bg-white/60 rounded-full transition-all duration-300"
              style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

