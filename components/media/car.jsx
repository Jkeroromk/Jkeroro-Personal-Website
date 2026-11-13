"use client";

import React, { useCallback, useEffect, useRef, useState, memo } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence } from "framer-motion";

// Showroom 只在点开时才加载
const Showroom = dynamic(() => import("./Showroom"), { ssr: false });

const MODEL_PAGE =
  "https://sketchfab.com/3d-models/free-porsche-911-carrera-4s-d01b254483794de3819786d93e0e1ebf";

const Car = memo(function Car() {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [showroomOpen, setShowroomOpen] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;

    import("./carScene")
      .then(({ createCarScene }) => {
        if (cancelled) return;
        sceneRef.current = createCarScene(canvas, {
          onReady: () => !cancelled && setReady(true),
        });
      })
      .catch(() => {
        // WebGL 或模型加载失败时保持背景色
      });

    return () => {
      cancelled = true;
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, []);

  // Showroom 打开时首页这台车暂停渲染，省 GPU
  useEffect(() => {
    sceneRef.current?.setPaused(showroomOpen);
  }, [showroomOpen]);

  const closeShowroom = useCallback(() => setShowroomOpen(false), []);

  return (
    <>
      <div className="relative w-full max-w-[600px] aspect-[2/1] rounded-lg overflow-hidden bg-[#38383c]">
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}
          aria-label="3D Porsche 911 — drag to rotate"
        />
        {ready && (
          <button
            type="button"
            onClick={() => setShowroomOpen(true)}
            className="group absolute top-2.5 right-2.5 flex items-center gap-1.5 rounded-full border border-white/25 bg-black/25 pl-3 pr-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/90 backdrop-blur-md transition-colors hover:bg-white/20 hover:text-white"
          >
            Enter Showroom
            <span className="transition-transform group-hover:translate-x-0.5" aria-hidden="true">
              →
            </span>
          </button>
        )}
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
