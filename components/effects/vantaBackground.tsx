"use client";

import React, { useEffect, useRef, useState } from "react";

interface VantaEffectInstance {
  destroy: () => void;
}

interface VantaOptions {
  el: HTMLElement | null;
  mouseControls?: boolean;
  touchControls?: boolean;
  gyroControls?: boolean;
  backgroundAlpha?: number;
  color?: number;
  color1?:number;
  color2?: number;
  scale?: number;
  scaleMobile?: number;
  quantity?: number;
}

type VantaConstructor = (options: VantaOptions) => VantaEffectInstance;

declare global {
  interface Window {
    VANTA?: {
      BIRDS?: VantaConstructor;
    };
  }
}

export default function VantaBackground() {
  const [vantaEffect, setVantaEffect] = useState<VantaEffectInstance | null>(null);
  const vantaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 延迟初始化 Vanta 效果，避免阻塞页面加载
    const initVanta = () => {
      if (typeof window !== "undefined" && window.VANTA && !vantaEffect) {
        const BIRDS = window.VANTA.BIRDS;
        if (BIRDS && vantaRef.current) {
          const effect = BIRDS({
            el: vantaRef.current,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            backgroundAlpha: 0.0,
            color1: 0xffffff,
            color2: 0x000000,
            scale: 1.0,
            scaleMobile: 1.0,
            quantity: 2.0
          });
          setVantaEffect(effect);
        }
      }
    };

    // 延迟 500ms 初始化，让页面先加载
    const timer = setTimeout(initVanta, 500);

    return () => {
      clearTimeout(timer);
      if (vantaEffect) {
        vantaEffect.destroy();
      }
    };
  }, [vantaEffect]);

  return (
    <div className="fixed inset-0 -z-50 overflow-hidden">
      <video
        src="/background.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          minWidth: '100vw',
          minHeight: '100vh',
          width: 'auto',
          height: 'auto',
          objectFit: 'cover',
          transform: 'scale(1.3)',
          transformOrigin: 'center center'
        }}
      />
      <div ref={vantaRef} className="absolute inset-0" />
    </div>
  );
}
