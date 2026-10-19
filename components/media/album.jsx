'use client';

// 照片区：原来是一张张大图竖着排，是整页最长的一段。
// 现在是两列网格：第一张横跨两列，其余是方块（剩单数时最后一张也横跨），每张左下角一行小字。
// 小字就是后台 Images 里每张图的 Caption（数据库里的 alt 字段）。点开是全屏查看，手机上可以左右滑。

import Image from "next/image";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { getRealtimeClient } from "@/lib/realtime-client";
import DataManager from "@/lib/data-manager";

const isUnoptimized = (src) => src.startsWith("/api/file/") || src.startsWith("https://");
const objectPosition = (img) => `${img.imageOffsetX ?? 50}% ${img.imageOffsetY ?? 50}%`;

function sameImages(a, b) {
  if (a.length !== b.length) return false;
  return a.every((img, i) => img.id === b[i].id && img.order === b[i].order && img.alt === b[i].alt && img.src === b[i].src);
}

function Lightbox({ images, index, onClose, onIndex }) {
  const img = images[index];
  const start = useRef(null);
  const closeRef = useRef(null);

  const go = useCallback(
    (step) => onIndex((index + step + images.length) % images.length),
    [index, images.length, onIndex]
  );

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [go, onClose]);

  // 手机上左右滑切换
  const onPointerDown = (e) => {
    start.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e) => {
    if (!start.current) return;
    const dx = e.clientX - start.current.x;
    const dy = e.clientY - start.current.y;
    start.current = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
  };

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={img.alt || "Photo"}
      className="fixed inset-0 z-[70] flex flex-col bg-[#050505]/95 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      <div
        className="flex items-center justify-between px-4 pb-2"
        style={{ paddingTop: "max(14px, env(safe-area-inset-top))" }}
      >
        <span className="font-mono text-[11px] tracking-[0.14em] text-[#8a8a86] tabular-nums">
          {String(index + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
        </span>
        <button
          ref={closeRef}
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#202020] text-[#8a8a86] hover:text-[#f4f4f2] hover:bg-[#141415] focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#9fd8a4]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div
        className="relative flex-1 min-h-0 mx-3 sm:mx-16 touch-pan-y"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onClick={(e) => e.stopPropagation()}
      >
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={img.id}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Image
              src={img.src}
              alt={img.alt || ""}
              fill
              sizes="100vw"
              className="object-contain select-none"
              draggable={false}
              unoptimized={isUnoptimized(img.src)}
            />
          </motion.div>
        </AnimatePresence>

        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              onClick={() => go(-1)}
              className="absolute left-0 sm:-left-14 top-1/2 -translate-y-1/2 hidden sm:flex h-10 w-10 items-center justify-center rounded-full border border-[#202020] bg-[#0c0c0d]/80 text-[#8a8a86] hover:text-[#f4f4f2]"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={() => go(1)}
              className="absolute right-0 sm:-right-14 top-1/2 -translate-y-1/2 hidden sm:flex h-10 w-10 items-center justify-center rounded-full border border-[#202020] bg-[#0c0c0d]/80 text-[#8a8a86] hover:text-[#f4f4f2]"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      <div
        className="flex flex-col items-center gap-3 px-4 pt-3"
        style={{ paddingBottom: "max(18px, env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}
      >
        {img.alt && (
          <p className="font-mono text-[12px] tracking-[0.14em] uppercase text-[#f4f4f2]">{img.alt}</p>
        )}
        {images.length > 1 && (
          <div className="flex gap-1.5" aria-hidden="true">
            {images.map((p, i) => (
              <span
                key={p.id}
                className={`h-1 rounded-full transition-all duration-200 ${i === index ? "w-5 bg-[#f4f4f2]" : "w-1 bg-[#3a3a38]"}`}
              />
            ))}
          </div>
        )}
        <span className="sm:hidden font-mono text-[10px] tracking-[0.12em] text-[#3a3a38]">swipe to browse</span>
      </div>
    </motion.div>
  );
}

const Album = () => {
  const [images, setImages] = useState([]);
  const [openIndex, setOpenIndex] = useState(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const dataManager = DataManager.getInstance();
    const cached = dataManager.getImages();
    if (cached && cached.length > 0) setImages(cached);

    let alive = true;
    fetch("/api/media/images")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data) => {
        if (!alive || !Array.isArray(data)) return;
        setImages(data);
        dataManager.saveImages(data);
      })
      .catch((error) => console.error("Album: Error loading images:", error));

    // 后台改了图片，首页实时更新
    const unsubscribe = getRealtimeClient().subscribe("images", (newData) => {
      if (!Array.isArray(newData)) return;
      setImages((prev) => (sameImages(prev, newData) ? prev : newData));
    });

    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

  if (images.length === 0) return null;

  const restOdd = (images.length - 1) % 2 === 1;

  return (
    <section className="flex flex-col items-center mt-16 mb-6 px-4 sm:px-6 w-full">
      <div className="w-full sm:w-[550px] flex items-end justify-between mb-4">
        <h2 className="text-white font-extrabold text-2xl">Snapshots</h2>
        <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-[#8a8a86]">
          {images.length} photos · tap to view
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full sm:w-[550px]">
        {images.map((img, i) => {
          const wide = i === 0 || (restOdd && i === images.length - 1);
          return (
            <motion.button
              key={img.id}
              type="button"
              onClick={() => setOpenIndex(i)}
              aria-label={img.alt ? `Open photo: ${img.alt}` : "Open photo"}
              className={`group relative overflow-hidden rounded-[14px] border border-[#202020] bg-[#0c0c0d] text-left focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[#9fd8a4] ${
                wide ? "col-span-2 aspect-[16/10]" : "aspect-square"
              }`}
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -40px 0px" }}
              transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1], delay: reduceMotion ? 0 : (i % 2) * 0.06 }}
            >
              <Image
                src={img.src}
                alt={img.alt || ""}
                fill
                sizes={wide ? "(max-width: 640px) 100vw, 550px" : "(max-width: 640px) 50vw, 275px"}
                priority={img.priority}
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                style={{ objectPosition: objectPosition(img) }}
                unoptimized={isUnoptimized(img.src)}
              />
              {img.alt && (
                <>
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent" />
                  <span className="pointer-events-none absolute left-3 bottom-2.5 right-3 truncate font-mono text-[10px] sm:text-[11px] tracking-[0.14em] uppercase text-[#f4f4f2]">
                    {img.alt}
                  </span>
                </>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* 挂到 body 上：首页各段外层有 transform 动画，fixed 放在里面会被困在段落里 */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {openIndex !== null && images[openIndex] && (
              <Lightbox
                images={images}
                index={openIndex}
                onIndex={setOpenIndex}
                onClose={() => setOpenIndex(null)}
              />
            )}
          </AnimatePresence>,
          document.body
        )}
    </section>
  );
};

export default Album;
