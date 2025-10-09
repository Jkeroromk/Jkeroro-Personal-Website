'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

export default function ClientScripts() {
  const [threeLoaded, setThreeLoaded] = useState(false);
  const [vantaLoaded, setVantaLoaded] = useState(false);

  useEffect(() => {
    // 检查 Three.js 是否已经加载
    if (typeof window !== 'undefined' && window.THREE) {
      setThreeLoaded(true);
    }
  }, []);

  return (
    <>
      {/* 关键脚本按顺序加载 */}
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"
        strategy="beforeInteractive"
        onLoad={() => {
          console.log('Three.js loaded');
          setThreeLoaded(true);
          // 确保 THREE 对象在全局可用
          if (typeof window !== 'undefined') {
            window.THREE = window.THREE || window.THREE;
            console.log('THREE object available:', !!window.THREE);
            console.log('PerspectiveCamera available:', !!window.THREE?.PerspectiveCamera);
          }
        }}
      />
      {threeLoaded && (
        <Script
          src="https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.birds.min.js"
          strategy="afterInteractive"
          onLoad={() => {
            console.log('Vanta.js loaded');
            setVantaLoaded(true);
            console.log('VANTA object available:', !!window.VANTA);
            console.log('BIRDS available:', !!window.VANTA?.BIRDS);
          }}
        />
      )}
    </>
  );
}
