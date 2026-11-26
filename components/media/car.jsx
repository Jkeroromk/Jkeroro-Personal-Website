"use client";

import React, { useCallback, useEffect, useRef, useState, memo } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence } from "framer-motion";

// Showroom（three.js + 3D 模型）只在点开时才加载；首页卡片放的是同一台 Lexus 在 Blender（Cycles）里渲染的 60 秒雨夜短片
const loadShowroom = () => import("./Showroom");
const Showroom = dynamic(loadShowroom, { ssr: false });

const MODEL_PAGE =
  "https://sketchfab.com/3d-models/lexus-lc-500-wald-sports-line-wwwvecarzcom-120879ad2666438b86d080dcf26621fa";

// 视频文件名带版本号：vercel.json 给 .mp4 / .webp 设了一年的 immutable 缓存，换片子必须换文件名
const POSTER = "/static/lexus-lc500-poster-v3.webp";
const SOURCES = {
  // 2048×1024：卡片实际像素（CSS 宽 × devicePixelRatio）够大时用，比如 Retina 屏
  hi: [
    { src: "/static/lexus-lc500-2k.av1.mp4", type: 'video/mp4; codecs="av01.0.08M.08"' },
    { src: "/static/lexus-lc500-2k.h264.mp4", type: 'video/mp4; codecs="avc1.640033"' },
  ],
  // 1200×600：手机、普通屏、省流量模式、慢网络
  lo: [
    { src: "/static/lexus-lc500-1200.av1.mp4", type: 'video/mp4; codecs="av01.0.05M.08"' },
    { src: "/static/lexus-lc500-1200.h264.mp4", type: 'video/mp4; codecs="avc1.640032"' },
  ],
};

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// 选清晰度和编码：AV1 体积小一半左右，浏览器不支持时退回 H.264
function pickSource(video) {
  const conn = navigator.connection;
  const slow = conn?.saveData || /(^|-)(2g|3g)$/.test(conn?.effectiveType || "");
  const physicalWidth = video.clientWidth * (window.devicePixelRatio || 1);
  const tier = !slow && physicalWidth >= 1100 ? "hi" : "lo";
  const list = SOURCES[tier];
  return list.find((s) => video.canPlayType(s.type)) ?? list[list.length - 1];
}

// 等页面主要资源加载完再开始拉视频，不和首屏的脚本、图片抢带宽
const afterPageLoad = (cb) => {
  if (document.readyState === "complete") {
    const id = window.requestIdleCallback ? window.requestIdleCallback(cb, { timeout: 1500 }) : setTimeout(cb, 200);
    return () => (window.cancelIdleCallback ? window.cancelIdleCallback(id) : clearTimeout(id));
  }
  window.addEventListener("load", cb, { once: true });
  return () => window.removeEventListener("load", cb);
};

const Car = memo(function Car() {
  const videoRef = useRef(null);
  const [videoReady, setVideoReady] = useState(false);
  const [showroomOpen, setShowroomOpen] = useState(false);
  const [inView, setInView] = useState(false);
  const loadedRef = useRef(false);

  // 卡片进入（或接近）视口才开始加载；离开视口就暂停，省电省 CPU
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin: "300px 0px" });
    io.observe(video);
    return () => io.disconnect();
  }, []);

  // 第一次进入视口时挑一个源并开始加载；系统设置了"减少动态效果"时只显示封面图，不下载视频
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !inView || loadedRef.current || prefersReducedMotion()) return;
    return afterPageLoad(() => {
      if (loadedRef.current) return;
      loadedRef.current = true;
      video.src = pickSource(video).src;
      video.preload = "auto";
      video.load();
    });
  }, [inView]);

  // 播放 / 暂停：Showroom 打开、不在视口、减少动态效果时都暂停
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !loadedRef.current) return;
    if (showroomOpen || !inView || prefersReducedMotion()) video.pause();
    else video.play().catch(() => {});
  }, [showroomOpen, inView, videoReady]);

  const closeShowroom = useCallback(() => setShowroomOpen(false), []);

  return (
    <>
      <div className="relative w-full max-w-[600px] aspect-[2/1] rounded-lg overflow-hidden bg-[#0b0b0c]">
        {/* 封面图一直垫在下面：视频还没加载好时显示它，视频加载好后淡入盖住 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={POSTER}
          alt=""
          aria-hidden="true"
          decoding="async"
          fetchPriority="low"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${videoReady ? "opacity-100" : "opacity-0"}`}
          muted
          loop
          playsInline
          preload="none"
          disablePictureInPicture
          aria-label="Lexus LC 500 with JKERORO plates driving through a rainy neon city"
          onLoadedData={() => setVideoReady(true)}
        />
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
