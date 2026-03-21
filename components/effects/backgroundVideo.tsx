"use client";

import React, { useRef, useEffect } from "react";

export default function BackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // 降低播放速率减少 GPU 负担，烟雾效果慢放更自然
    video.playbackRate = 0.75;

    // 确保视频播放（某些浏览器需要手动触发）
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // 自动播放被阻止，静默处理
      });
    }
  }, []);

  return (
    <div className="fixed inset-0 -z-50 overflow-hidden will-change-transform">
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover gpu-accelerated"
        style={{
          minWidth: '100vw',
          minHeight: '100vh',
          width: 'auto',
          height: 'auto',
          objectFit: 'cover',
          transform: 'scale(1.3) translateZ(0)',
          transformOrigin: 'center center',
        }}
      >
        <source src="/background.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
