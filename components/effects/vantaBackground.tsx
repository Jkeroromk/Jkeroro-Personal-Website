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
    THREE?: {
      PerspectiveCamera?: unknown;
      [key: string]: unknown;
    };
    VANTA?: {
      BIRDS?: VantaConstructor;
    };
  }
}

export default function VantaBackground() {
  const [vantaEffect, setVantaEffect] = useState<VantaEffectInstance | null>(null);
  const vantaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 检查 Three.js 和 Vanta 是否都已加载
    const checkAndInitVanta = () => {
      try {
        console.log('Checking dependencies:', {
          window: typeof window !== "undefined",
          THREE: !!window.THREE,
          VANTA: !!window.VANTA,
          BIRDS: !!window.VANTA?.BIRDS,
          PerspectiveCamera: !!window.THREE?.PerspectiveCamera,
          vantaEffect: !!vantaEffect,
          vantaRef: !!vantaRef.current
        });

        if (typeof window !== "undefined" && 
            window.THREE && 
            window.VANTA && 
            window.VANTA.BIRDS && 
            !vantaEffect && 
            vantaRef.current) {
          
          // 确保 Three.js 的 PerspectiveCamera 可用
          if (window.THREE.PerspectiveCamera) {
            console.log('Initializing Vanta effect...');
            const effect = window.VANTA.BIRDS({
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
            console.log('Vanta effect initialized successfully');
          } else {
            console.log('Three.js PerspectiveCamera not available');
          }
        } else {
          const missingDeps = [];
          if (!window.THREE) missingDeps.push('THREE');
          if (!window.VANTA) missingDeps.push('VANTA');
          if (!window.VANTA?.BIRDS) missingDeps.push('VANTA.BIRDS');
          if (!vantaRef.current) missingDeps.push('vantaRef');
          
          console.log(`Missing dependencies: ${missingDeps.join(', ')}`);
        }
      } catch (err) {
        console.error('Vanta initialization error:', err);
      }
    };

    // 轮询检查依赖是否加载完成
    const pollInterval = setInterval(() => {
      if (typeof window !== "undefined" && 
          window.THREE && 
          window.VANTA && 
          window.VANTA.BIRDS && 
          window.THREE.PerspectiveCamera) {
        clearInterval(pollInterval);
        checkAndInitVanta();
      }
    }, 1000); // 增加间隔时间，减少检查频率

    // 延迟初始化，确保所有依赖都已加载
    const timer = setTimeout(() => {
      checkAndInitVanta();
    }, 2000);

    // 如果第一次检查失败，再次尝试
    const retryTimer = setTimeout(() => {
      checkAndInitVanta();
    }, 4000);

    // 第三次尝试
    const finalTimer = setTimeout(() => {
      checkAndInitVanta();
    }, 6000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timer);
      clearTimeout(retryTimer);
      clearTimeout(finalTimer);
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
