'use client';

import React, { useState, useRef, useEffect, memo, useCallback, useMemo } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Minus, Plus, Repeat, Shuffle } from 'lucide-react';
import DataManager from '@/lib/data-manager';
import { getRealtimeClient } from '@/lib/realtime-client';
// No longer using Firebase - using API instead

const MusicPlayer = memo(() => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [tracks, setTracks] = useState([]);
  const [dataManager] = useState(() => DataManager.getInstance());
  const audioRef = useRef(null);
  const playPromiseRef = useRef(null);

  // 安全的播放函数，避免 AbortError
  const safePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    // 取消之前的播放请求
    if (playPromiseRef.current) {
      try {
        await playPromiseRef.current;
      } catch (error) {
        // 忽略 AbortError
      }
    }

    try {
      playPromiseRef.current = audio.play();
      await playPromiseRef.current;
      setIsPlaying(true);
      return true;
    } catch (error) {
      if (error.name !== 'AbortError') {
        setIsPlaying(false);
      }
      return false;
    } finally {
      playPromiseRef.current = null;
    }
  };

  // 从 API 加载音乐数据（初始加载）
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // 先使用缓存数据立即显示（如果存在）
    const cachedTracks = dataManager.getTracks();
    if (cachedTracks && cachedTracks.length > 0) {
      setTracks(cachedTracks);
      // 确保当前轨道索引在有效范围内
      if (currentTrackIndex >= cachedTracks.length) {
        setCurrentTrackIndex(0);
      }
    }
    
    // 然后异步从 API 获取最新数据
    const loadTracks = async () => {
      try {
        const response = await fetch('/api/media/tracks');
        if (!response.ok) throw new Error('Failed to fetch tracks');
        
        const tracksData = await response.json();
        setTracks(tracksData);
        
        // 确保当前轨道索引在有效范围内
        if (tracksData.length > 0 && currentTrackIndex >= tracksData.length) {
          setCurrentTrackIndex(0);
        }
      } catch (error) {
        console.error('Error loading tracks from API:', error);
        // API 失败时，如果缓存数据也没有设置，尝试使用缓存数据
        // 如果已经有缓存数据显示了，就不需要再次设置
      }
    };

    // 异步加载 API 数据
    loadTracks();
    
    // 使用 SSE 实时更新
    const realtimeClient = getRealtimeClient();
    const unsubscribe = realtimeClient.subscribe('tracks', (tracksData) => {
      setTracks(tracksData);
      // 确保当前轨道索引在有效范围内
      if (tracksData.length > 0 && currentTrackIndex >= tracksData.length) {
        setCurrentTrackIndex(0);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [dataManager, currentTrackIndex]);

  // 监听音乐数据变化事件
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const reloadTracks = async () => {
      try {
        // 从 API 重新加载
        const response = await fetch('/api/media/tracks');
        if (response.ok) {
          const tracksData = await response.json();
          setTracks(tracksData);
          
          // 如果当前播放的歌曲索引超出范围，重置到0
          if (tracksData.length > 0 && currentTrackIndex >= tracksData.length) {
            setCurrentTrackIndex(0);
          }
        } else {
          // 降级到本地数据
          const tracksData = dataManager.getTracks();
          setTracks(tracksData);
        }
      } catch (error) {
        // 静默处理重新加载错误
        console.error('Error reloading tracks:', error);
      }
    };

    const handleStorageChange = (e) => {
      if (e.key === 'jkeroro-website-data' || e.type === 'musicDataChanged') {
        reloadTracks();
      }
    };

    // 监听 storage 事件（跨标签页）
    window.addEventListener('storage', handleStorageChange);

    // 监听自定义事件（同标签页内的变化）
    window.addEventListener('musicDataChanged', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('musicDataChanged', handleStorageChange);
    };
  }, [dataManager, currentTrackIndex]);

  // 检查localStorage中的音频权限设置
  useEffect(() => {
    // 确保在客户端环境运行
    if (typeof window === 'undefined') return
    
    // 确保有音乐数据
    if (!tracks || tracks.length === 0) {
      return;
    }
    
    const audioPermission = localStorage.getItem('audioPermission');
    const fromLoading = sessionStorage.getItem('fromLoading');
    
    if (audioPermission === 'allowed') {
      // 如果用户允许了音频，准备播放
      const audio = audioRef.current;
      if (audio) {
        audio.muted = false;
        // 确保事件监听器已添加
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', () => skipTrack(1));
        
        // 如果是从loading页面跳转过来的，自动播放
        if (fromLoading) {
          setTimeout(async () => {
            await safePlay();
          }, 500); // 延迟500ms确保页面完全加载
        }
      }
    }
  }, [tracks]); // 添加tracks作为依赖

  // 监听localStorage变化
  useEffect(() => {
    // 确保在客户端环境运行
    if (typeof window === 'undefined') return
    
    const handleStorageChange = (e) => {
      if (e.key === 'audioPermission' && e.newValue === 'allowed') {
        const audio = audioRef.current;
        if (audio) {
          audio.muted = false;
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Handle permission response
  const handlePermissionResponse = (allow) => {
    if (allow) {
      const audio = audioRef.current;
      audio.muted = false;
      setShowPermissionPrompt(false);
    } else {
      setShowPermissionPrompt(false);
    }
  };

  // Toggle play/pause
  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (audio) {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        // 直接播放，不重新设置音频源
        audio.play().then(() => {
          setIsPlaying(true);
        }).catch((error) => {
          if (error.name !== 'AbortError') {
            setIsPlaying(false);
          }
        });
      }
    }
  };

  // Skip tracks
  const skipTrack = (direction) => {
    if (!tracks || tracks.length === 0) {
      return;
    }
    
    let newIndex;
    if (isShuffled) {
      // 随机播放模式
      do {
        newIndex = Math.floor(Math.random() * tracks.length);
      } while (newIndex === currentTrackIndex && tracks.length > 1);
    } else {
      // 正常顺序播放
      newIndex = (currentTrackIndex + direction + tracks.length) % tracks.length;
    }
    
    setCurrentTrackIndex(newIndex);
    // 只有在当前正在播放时才继续播放下一首
    if (isPlaying) {
      setIsPlaying(true);
    }
  };

  // Update time and duration
  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (audio) {
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration);
    }
  };

  // Format time as MM:SS
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Toggle mute
  const toggleMute = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = isMuted ? volume / 100 : 0;
    }
    setIsMuted(!isMuted);
  };

  // Adjust volume
  const changeVolume = (delta) => {
    const newVolume = Math.max(0, Math.min(100, volume + delta));
    setVolume(newVolume);
    const audio = audioRef.current;
    if (audio) {
      audio.volume = newVolume / 100;
    }
    setIsMuted(newVolume === 0);
  };

  // Toggle loop
  const toggleLoop = () => {
    setIsLooping(!isLooping);
    const audio = audioRef.current;
    if (audio) {
      audio.loop = !isLooping;
    }
  };

  // Toggle shuffle
  const toggleShuffle = () => {
    setIsShuffled(!isShuffled);
  };

  // Setup audio listeners and initial volume
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume / 100;
      audio.loop = isLooping;
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('ended', () => {
        if (!isLooping) {
          skipTrack(1);
        }
      });
    }

    return () => {
      if (audio) {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('ended', () => {
          if (!isLooping) {
            skipTrack(1);
          }
        });
      }
    };
  }, [volume, currentTrackIndex, isLooping]);

  // Update audio source when track changes
  useEffect(() => {
    try {
      // 只有在有音频源时才处理
      if (!tracks[currentTrackIndex]?.src) {
        return;
      }

      const audio = audioRef.current;
      if (!audio) {
        // 音频元素可能还没有渲染，稍后重试
        const timer = setTimeout(() => {
          const retryAudio = audioRef.current;
          if (retryAudio && tracks[currentTrackIndex]?.src) {
            retryAudio.src = tracks[currentTrackIndex].src;
            retryAudio.loop = isLooping;
            
            if (isPlaying) {
              safePlay();
            }
          }
        }, 100);
        
        return () => clearTimeout(timer);
      }

      audio.src = tracks[currentTrackIndex].src;
      audio.loop = isLooping;
      
      // 只有在用户已经交互过且当前正在播放时才自动播放
      if (isPlaying) {
        safePlay();
      }

      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: tracks[currentTrackIndex]?.title || 'Unknown Title',
          artist: tracks[currentTrackIndex]?.subtitle || 'Unknown Artist',
          album: 'Jkeroro Music',
          artwork: [
            { src: '/512.png', sizes: '512x512', type: 'image/png' },
            { src: '/192.png', sizes: '192x192', type: 'image/png' },
          ],
        });

        navigator.mediaSession.setActionHandler('play', togglePlayPause);
        navigator.mediaSession.setActionHandler('pause', togglePlayPause);
        navigator.mediaSession.setActionHandler('previoustrack', () => skipTrack(-1));
        navigator.mediaSession.setActionHandler('nexttrack', () => skipTrack(1));
      }
    } catch (error) {
      // 静默处理音频源更新错误
    }
  }, [currentTrackIndex]); // 移除 isPlaying 依赖

  // Update loop setting when isLooping changes
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.loop = isLooping;
    }
  }, [isLooping]);

  // 如果没有音乐数据，显示空状态
  if (!tracks || tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center mt-10">
        <div className="text-center text-gray-400 max-w-md">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
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
    );
  }

  // 确保当前轨道索引有效
  if (currentTrackIndex >= tracks.length) {
    setCurrentTrackIndex(0);
    return null; // 或者返回加载状态
  }

  return (
    <>

      {/* Main player container with fixed height */}
      <div
        className="flex flex-col items-center justify-center mt-4 w-full"
        style={{ height: '400px' }} // Fixed height to prevent shifts
      >
        {tracks[currentTrackIndex]?.src && (
          <audio
            ref={audioRef}
            src={tracks[currentTrackIndex].src}
            muted={isMuted}
            preload="none" // 不预加载，节省带宽
            onEnded={() => skipTrack(1)}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleTimeUpdate}
            onLoadStart={() => {}}
            onCanPlay={() => {}}
            onError={() => {}}
          />
        )}

        {/* Player UI with fixed dimensions */}
        <div
          className="flex flex-col items-center bg-opacity-70 p-6 rounded-lg w-72 text-white"
          style={{ height: '300px' }} // Fixed height for stability
        >
          {/* Track info with fixed heights */}
          <h2
            className="mb-2 text-xl font-bold truncate w-full text-center"
            style={{ height: '28px' }} // Fixed height for title
          >
            {tracks[currentTrackIndex]?.title || 'No Track'}
          </h2>
          {tracks[currentTrackIndex]?.subtitle && (
            <p
              className="text-sm text-gray-300 mb-5 truncate w-full text-center"
              style={{ height: '20px' }} // Fixed height for subtitle
            >
              {tracks[currentTrackIndex].subtitle}
            </p>
          )}

          {/* Playback controls with reserved space */}
          <div className="flex justify-between w-full mb-5" style={{ height: '40px' }}>
            <SkipBack
              onClick={() => skipTrack(-1)}
              className="cursor-pointer text-white text-2xl hover:scale-[1.5] transition duration-300"
            />
            <div
              onClick={togglePlayPause}
              className="cursor-pointer text-white text-2xl hover:scale-[1.5] transition duration-300"
            >
              {isPlaying ? <Pause /> : <Play />}
            </div>
            <SkipForward
              onClick={() => skipTrack(1)}
              className="cursor-pointer text-white text-2xl hover:scale-[1.5] transition duration-300"
            />
          </div>

          {/* Progress bar with fixed height */}
          <div className="w-full flex flex-col items-center mb-2 mt-2" style={{ height: '40px' }}>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime || 0}
              onChange={(e) => {
                audioRef.current.currentTime = e.target.value;
              }}
              aria-label="音乐播放进度条"
              className="w-full mb-2 h-2"
              style={{
                appearance: 'none',
                background: `linear-gradient(to right, #4a4a4a ${
                  duration ? (currentTime / duration) * 100 : 0
                }%, #e0e0e0 0%)`,
                height: '8px',
                borderRadius: '5px',
              }}
            />
            <div className="flex justify-between w-full text-sm text-white">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Volume controls with reserved space */}
          <div className="items-center justify-center gap-5 mt-5 flex" style={{ height: '40px' }}>
            <div className="relative">
              <Shuffle
                className={`cursor-pointer text-xl transition duration-300 ${
                  isShuffled 
                    ? 'text-blue-400 hover:text-blue-300' 
                    : 'text-white hover:text-gray-300'
                }`}
                onPointerDown={toggleShuffle}
                title={isShuffled ? 'Disable Shuffle' : 'Enable Shuffle'}
              />
            </div>
            <Minus
              className="cursor-pointer text-white text-xl hover:scale-[1.5] transition duration-300"
              onPointerDown={() => changeVolume(-5)}
              title="Decrease Volume"
            />
            <div
              className="flex flex-col items-center cursor-pointer"
              onPointerDown={toggleMute}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="text-white text-xl" /> : <Volume2 className="text-white text-xl" />}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-white font-bold">{isMuted ? '0' : volume}</span>
              <Plus
                className="cursor-pointer text-white text-xl hover:scale-[1.5] transition duration-300"
                onPointerDown={() => changeVolume(5)}
                title="Increase Volume"
              />
            </div>
            <div className="relative">
              <Repeat
                className="cursor-pointer text-white text-xl hover:text-gray-300 "
                onPointerDown={toggleLoop}
                title={isLooping ? 'Disable Loop' : 'Enable Loop'}
              />
              {isLooping && (
                <span className="absolute -top-1 -right-1 text-xs font-bold text-white-400 transition-all duration-300">
                  1
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
});

export default MusicPlayer;
