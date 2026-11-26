"use client";

import React, { useCallback, useEffect, useRef, useState, memo } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence } from "framer-motion";

// Showroom（three.js + 3D 模型）只在点开时才加载；首页卡片放的是同一台 Lexus 在 Blender（Cycles）里渲染的 60 秒雨夜短片
const loadShowroom = () => import("./Showroom");
const Showroom = dynamic(loadShowroom, { ssr: false });

const MODEL_PAGE =
  "https://sketchfab.com/3d-models/lexus-lc-500-wald-sports-line-wwwvecarzcom-120879ad2666438b86d080dcf26621fa";

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const Car = memo(function Car() {
  const videoRef = useRef(null);
  const [videoReady, setVideoReady] = useState(false);
  const [showroomOpen, setShowroomOpen] = useState(false);

  // Showroom 打开时暂停视频；系统设置了"减少动态效果"时只显示封面帧
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (showroomOpen || prefersReducedMotion()) video.pause();
    else video.play().catch(() => {});
  }, [showroomOpen]);

  const closeShowroom = useCallback(() => setShowroomOpen(false), []);

  return (
    <>
      <div className="relative w-full max-w-[600px] aspect-[2/1] rounded-lg overflow-hidden bg-[#0b0b0c]">
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${videoReady ? "opacity-100" : "opacity-0"}`}
          poster="/static/lexus-lc500-poster.webp"
          muted
          loop
          playsInline
          autoPlay
          preload="auto"
          aria-label="Lexus LC 500 with JKERORO plates driving through a rainy neon city"
          onLoadedData={() => setVideoReady(true)}
        >
          <source src="/static/lexus-lc500-loop.mp4" type="video/mp4" />
        </video>
        <button
          type="button"
          onClick={() => setShowroomOpen(true)}
          onPointerEnter={loadShowroom}
          onFocus={loadShowroom}
          className="group absolute top-2.5 right-2.5 flex items-center gap-1.5 rounded-full border border-white/25 bg-black/25 pl-3 pr-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/90 backdrop-blur-md transition-colors hover:bg-white/20 hover:text-white"
        >
          Enter Showroom
          <span className="transition-transform group-hover:translate-x-0.5" aria-hidden="true">
            →
          </span>
        </button>
        <a
          href={MODEL_PAGE}
          target="_blank"
          rel="noopener noreferrer"
          title='Car: "Lexus LC 500 WALD Sports Line" by VeCarz (Sketchfab), CC BY-NC 4.0, modified (black paint, custom plates). Surveillance camera model by Marcel Schanz, CC BY 4.0. City: KitBash3D Neo City.'
          className="absolute bottom-1.5 right-2 text-[9px] leading-none text-white/30 hover:text-white/70 transition-colors"
        >
          Model: Lexus LC 500 WALD by VeCarz · CC BY-NC · CCTV: Marcel Schanz · CC BY
        </a>
      </div>

      <AnimatePresence>{showroomOpen && <Showroom key="showroom" onClose={closeShowroom} />}</AnimatePresence>
    </>
  );
});

export default Car;
