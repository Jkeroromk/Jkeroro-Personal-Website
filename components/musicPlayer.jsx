'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Minus, Plus } from 'lucide-react';

const tracks = [
  { title: 'ReawakeR (Solo Leveling)', subtitle: 'LiSA(feat. Felix of Stray Kids)', src: '/ReawakeR.mp3' },
  { title: 'Work (Hell Paradise)', subtitle: '椎名林檎 ● ꉈꀧ꒒꒒ꁄꍈꍈꀧ꒦ꉈ ꉣꅔꎡꅔꁕꁄ', src: '/Work.mp3' },
  { title: 'SPECIALZ (Jujutsu Kaisen)', subtitle: 'Anifi', src: '/SPECIALZ (Jujutsu Kaisen).mp3' },
];

const MusicPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(true);
  const audioRef = useRef(null);

  // Handle permission response
  const handlePermissionResponse = (allow) => {
    if (allow) {
      const audio = audioRef.current;
      audio.muted = false;
      setShowPermissionPrompt(false);
      setIsPlaying(true);
      setTimeout(() => {
        audio.play().catch((error) => console.error('Error playing audio:', error));
      }, 0);
    } else {
      setShowPermissionPrompt(false);
    }
  };

  // Toggle play/pause
  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch((error) => console.error('Error playing audio:', error));
    }
    setIsPlaying(!isPlaying);
  };

  // Skip tracks
  const skipTrack = (direction) => {
    const newIndex = (currentTrackIndex + direction + tracks.length) % tracks.length;
    setCurrentTrackIndex(newIndex);
    setIsPlaying(true);
  };

  // Update time and duration
  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    setCurrentTime(audio.currentTime);
    setDuration(audio.duration);
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
    audio.volume = isMuted ? volume / 100 : 0;
    setIsMuted(!isMuted);
  };

  // Adjust volume
  const changeVolume = (delta) => {
    const newVolume = Math.max(0, Math.min(100, volume + delta));
    setVolume(newVolume);
    audioRef.current.volume = newVolume / 100;
    setIsMuted(newVolume === 0);
  };

  // Setup audio listeners and initial volume
  useEffect(() => {
    const audio = audioRef.current;
    audio.volume = volume / 100;
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', () => skipTrack(1));

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', () => skipTrack(1));
    };
  }, [volume, currentTrackIndex]);

  // Update audio source and media session
  useEffect(() => {
    const audio = audioRef.current;
    audio.src = tracks[currentTrackIndex].src;

    if (isPlaying) {
      audio.play().catch((error) => console.error('Error playing audio:', error));
    }

    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: tracks[currentTrackIndex].title,
        artist: tracks[currentTrackIndex].subtitle || 'Unknown Artist',
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

  return (
    <>
      {/* Permission prompt outside main container */}
      {showPermissionPrompt && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-sm w-full">
            <h2 className="text-lg font-bold mb-4">Allow Audio Playback</h2>
            <p className="mb-4">This website requires audio playback to continue. Would you like to enable sound?</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => handlePermissionResponse(true)} className="bg-blue-500 text-white px-4 py-2 rounded-lg">
                Allow
              </button>
              <button onClick={() => handlePermissionResponse(false)} className="bg-red-300 text-black px-4 py-2 rounded-lg">
                Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main player container with fixed height */}
      <div
        className="flex flex-col items-center justify-center mt-10 w-full"
        style={{ height: '400px' }} // Fixed height to prevent shifts
      >
        <audio
          ref={audioRef}
          src={tracks[currentTrackIndex].src}
          muted={isMuted}
          preload="metadata" // Preload metadata to avoid late duration updates
          onEnded={() => skipTrack(1)}
        />

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
            {tracks[currentTrackIndex].title}
          </h3>
          {tracks[currentTrackIndex].subtitle && (
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
