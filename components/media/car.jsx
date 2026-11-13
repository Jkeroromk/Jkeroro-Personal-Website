"use client";

import React, { useEffect, useRef, useState, memo } from "react";
import { useControlPanel } from "@/contexts/ControlPanelContext";

const MODEL_PAGE =
  "https://sketchfab.com/3d-models/free-porsche-911-carrera-4s-d01b254483794de3819786d93e0e1ebf";

const Car = memo(function Car() {
  const canvasRef = useRef(null);
  const { guiParams } = useControlPanel();
  const cameraZRef = useRef(guiParams.cameraZ);
  const [ready, setReady] = useState(false);

  // 控制面板里的「距离」滑块仍然可以调镜头远近
  useEffect(() => {
    cameraZRef.current = guiParams.cameraZ;
  }, [guiParams.cameraZ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cleanup = () => {};
    let cancelled = false;

    import("./carScene")
      .then(({ createCarScene }) => {
        if (cancelled) return;
        cleanup = createCarScene(canvas, {
          getCameraZ: () => cameraZRef.current ?? 20,
          onReady: () => !cancelled && setReady(true),
        });
      })
      .catch(() => {
        // WebGL 或模型加载失败时保持深色背景
      });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return (
    <div
      className="relative w-full max-w-[600px] aspect-[2/1] rounded-lg overflow-hidden"
      style={{ background: "radial-gradient(120% 90% at 50% 35%, #1c1c22 0%, #0b0b0d 55%, #000 100%)" }}
    >
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}
        aria-label="3D Porsche 911"
      />
      <a
        href={MODEL_PAGE}
        target="_blank"
        rel="noopener noreferrer"
        title='3D model: "(FREE) Porsche 911 Carrera 4S" by Lionsharp Studios, licensed under CC BY-SA 4.0. Modified: black paint, white wheels, custom plates.'
        className="absolute bottom-1.5 right-2 text-[9px] leading-none text-white/25 hover:text-white/60 transition-colors"
      >
        Model © Lionsharp Studios · CC BY-SA
      </a>
    </div>
  );
});

export default Car;
