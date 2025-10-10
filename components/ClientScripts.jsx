'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

export default function ClientScripts() {
  const [threeLoaded, setThreeLoaded] = useState(false);

  useEffect(() => {
    // 检查 Three.js 是否已经加载
    if (typeof window !== 'undefined' && window.THREE) {
      setThreeLoaded(true);
    }
  }, []);

  return (
    <>
      {/* 只加载 Three.js，移除 Vanta 相关脚本 */}
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
    </>
  );
}
