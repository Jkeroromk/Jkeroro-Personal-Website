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
    if (typeof window !== "undefined" && window.VANTA && !vantaEffect) {
      const BIRDS = window.VANTA.BIRDS;
      if (BIRDS) {
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
    return () => {
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
      />
      <div ref={vantaRef} className="absolute inset-0" />
    </div>
  );
}
