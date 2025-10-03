'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Minus, Plus } from 'lucide-react';
import DataManager from '@/lib/data-manager';

const MusicPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [tracks, setTracks] = useState([]);
  const [dataManager] = useState(() => DataManager.getInstance());
  const audioRef = useRef(null);

  // 加载音乐数据
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const tracksData = dataManager.getTracks();
    console.log('🎵 加载音乐数据:', tracksData);
    setTracks(tracksData);
  }, [dataManager]);

  // 检查localStorage中的音频权限设置
  useEffect(() => {
    // 确保在客户端环境运行
    if (typeof window === 'undefined') return
    
    // 确保有音乐数据
    if (!tracks || tracks.length === 0) {
      console.log('🎵 没有音乐数据，跳过自动播放检查');
      return;
    }
    
    console.log('🎵 音乐播放器初始化，检查权限...')
    console.log('🎵 当前音乐数据:', tracks);
    const audioPermission = localStorage.getItem('audioPermission');
    console.log('🎵 当前音频权限:', audioPermission)
    
    if (audioPermission === 'allowed') {
      // 如果用户允许了音频，自动开始播放
      const audio = audioRef.current;
      console.log('🎵 音频元素:', audio)
      if (audio) {
        audio.muted = false;
        // 延迟一点时间确保音频元素完全准备好
        setTimeout(() => {
          audio.play().then(() => {
            setIsPlaying(true);
            console.log('🎵 音频权限已允许，自动开始播放成功');
          }).catch((error) => {
            console.log('🎵 自动播放失败，需要用户交互:', error);
          });
        }, 100);
      }
    } else {
      console.log('🎵 音频权限未允许或未设置')
    }
  }, [tracks]); // 添加tracks作为依赖

  // 监听localStorage变化
  useEffect(() => {
    // 确保在客户端环境运行
    if (typeof window === 'undefined') return
    
    const handleStorageChange = (e) => {
      if (e.key === 'audioPermission' && e.newValue === 'allowed') {
        console.log('🎵 检测到localStorage变化，音频权限已允许')
        const audio = audioRef.current;
        if (audio) {
          audio.muted = false;
          setTimeout(() => {
            audio.play().then(() => {
              setIsPlaying(true);
              console.log('🎵 通过localStorage变化自动开始播放');
            }).catch((error) => {
              console.log('🎵 通过localStorage变化自动播放失败:', error);
            });
          }, 100);
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
      // 自动播放音乐
      audio.play().then(() => {
        setIsPlaying(true);
        console.log('音频权限已允许，自动开始播放');
      }).catch((error) => {
        console.log('自动播放失败，需要用户交互:', error);
      });
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
      } else {
        audio.play().catch((error) => console.error('Error playing audio:', error));
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Skip tracks
  const skipTrack = (direction) => {
    if (!tracks || tracks.length === 0) return;
    const newIndex = (currentTrackIndex + direction + tracks.length) % tracks.length;
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

  // Setup audio listeners and initial volume
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume / 100;
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('ended', () => skipTrack(1));
    }

    return () => {
      if (audio) {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('ended', () => skipTrack(1));
      }
    };
  }, [volume, currentTrackIndex]);

  // Update audio source and media session
  useEffect(() => {
    const audio = audioRef.current;
    if (tracks[currentTrackIndex]?.src) {
      audio.src = tracks[currentTrackIndex].src;
    }

    // 只有在用户已经交互过且当前正在播放时才自动播放
    if (isPlaying) {
      audio.play().catch((error) => {
        console.error('Error playing audio:', error);
        // 如果播放失败，重置播放状态
        setIsPlaying(false);
      });
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
  }, [currentTrackIndex, isPlaying]);

  // 如果没有音乐数据，显示空状态
  if (!tracks || tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center mt-10">
        <div className="text-center text-gray-400">
          <p>No music tracks available</p>
          <p className="text-sm mt-2">Add tracks in the admin panel</p>
        </div>
      </div>
    );
  }

  return (
    <>

      {/* Main player container with fixed height */}
      <div
        className="flex flex-col items-center justify-center mt-10 w-full"
        style={{ height: '400px' }} // Fixed height to prevent shifts
      >
        {tracks[currentTrackIndex]?.src && (
          <audio
            ref={audioRef}
            src={tracks[currentTrackIndex].src}
            muted={isMuted}
            preload="metadata" // Preload metadata to avoid late duration updates
            onEnded={() => skipTrack(1)}
          />
        )}

        {/* Player UI with fixed dimensions */}
        <div
          className="flex flex-col items-center bg-opacity-70 p-6 rounded-lg w-72 text-white"
          style={{ height: '300px' }} // Fixed height for stability
        >
          {/* Track info with fixed heights */}
          <h3
            className="mb-2 text-xl font-bold truncate w-full text-center"
            style={{ height: '28px' }} // Fixed height for title
          >
            {tracks[currentTrackIndex]?.title || 'No Track'}
          </h3>
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
          <div className="items-center justify-center gap-3 mt-5 flex" style={{ height: '40px' }}>
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
          </div>
        </div>
      </div>
    </>
  );
};

export default MusicPlayer;
