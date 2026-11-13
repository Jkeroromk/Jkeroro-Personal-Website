"use client";

import React, { useCallback, useEffect, useRef, useState, memo } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence } from "framer-motion";

// Showroom（three.js + 3.4 MB 模型）只在点开时才加载；首页卡片放的是同一台车在 Blender 里渲染的循环视频
const loadShowroom = () => import("./Showroom");
const Showroom = dynamic(loadShowroom, { ssr: false });

const MODEL_PAGE =
  "https://sketchfab.com/3d-models/free-porsche-911-carrera-4s-d01b254483794de3819786d93e0e1ebf";

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
          poster="/static/porsche-911-poster.webp"
          muted
          loop
          playsInline
          autoPlay
          preload="auto"
          aria-label="Porsche 911 Carrera 4S with JKERORO plates"
          onLoadedData={() => setVideoReady(true)}
        >
          <source src="/static/porsche-911-loop.mp4" type="video/mp4" />
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
          title='3D model: "(FREE) Porsche 911 Carrera 4S" (Sketchfab), licensed under CC BY-SA 4.0. Modified: black paint, white wheels, custom plates.'
          className="absolute bottom-1.5 right-2 text-[9px] leading-none text-white/30 hover:text-white/70 transition-colors"
        >
          Model: Porsche 911 Carrera 4S · CC BY-SA
        </a>
      </div>

      <AnimatePresence>{showroomOpen && <Showroom key="showroom" onClose={closeShowroom} />}</AnimatePresence>
    </>
  );
});

export default Car;
