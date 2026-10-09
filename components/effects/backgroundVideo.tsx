"use client";

import React, { useRef, useEffect, useState } from "react";
import { onIntroPhase } from "@/lib/intro-signal";

export default function BackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  // 背景视频有二十多 MB。首页在开场遮罩下面就挂载了，
  // 等开场把音乐、图片、Muse 这些关键资源加载完（ready）再开始下载，免得抢带宽。
  const [canLoad, setCanLoad] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => onIntroPhase((phase) => {
    if (phase !== "loading") setCanLoad(true);
  }), []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !canLoad) return;
    video.load();

    // 系统开启了"减弱动态效果"：背景视频会一直循环播放，属于持续性动效，停在当前帧不播放
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      video.pause();
      return;
    }

    // 降低播放速率减少 GPU 负担，烟雾效果慢放更自然
    video.playbackRate = 0.75;

    // 确保视频播放（某些浏览器需要手动触发）
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // 自动播放被阻止，静默处理
      });
    }
  }, [canLoad]);

  return (
    <div className="fixed -z-50 overflow-hidden will-change-transform" style={{ top: '-50px', left: '-50px', right: '-50px', bottom: '-50px' }}>
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload={canLoad ? "auto" : "none"}
        onLoadedData={() => setVisible(true)}
        className="absolute inset-0 w-full h-full object-cover gpu-accelerated"
        style={{
          minWidth: '100vw',
          minHeight: '100dvh',
          width: 'auto',
          height: 'auto',
          objectFit: 'cover',
          transform: 'scale(1.3) translateZ(0)',
          transformOrigin: 'center center',
          opacity: visible ? 1 : 0,
          transition: 'opacity 1.2s ease',
        }}
      >
        {canLoad && <source src="/background.mp4" type="video/mp4" />}
      </video>
    </div>
  );
}
