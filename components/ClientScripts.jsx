'use client';

import { useEffect, useRef } from 'react';

export default function ClientScripts() {
  const loadingRef = useRef(false);

  useEffect(() => {
    // 统一使用 npm 包中的 Three.js，避免重复导入
    // 只在客户端加载，并设置到全局 window.THREE
    if (typeof window === 'undefined') return;
    
    // 如果已经存在或正在加载，直接返回
    if (window.THREE || loadingRef.current) return;
    
    loadingRef.current = true;
    
    import('three').then((THREE) => {
      // 检查是否已经被其他代码加载
      if (window.THREE) {
        loadingRef.current = false;
        return;
      }
      
      // 将 Three.js 设置到全局，供其他组件使用
      window.THREE = THREE;
      
      // 预加载 OrbitControls
      import('three/addons/controls/OrbitControls.js').then(({ OrbitControls }) => {
        if (window.THREE) {
          window.THREE.OrbitControls = OrbitControls;
        }
        loadingRef.current = false;
      }).catch(() => {
        loadingRef.current = false;
      });
    }).catch(() => {
      loadingRef.current = false;
    });
  }, []);

  return null;
}
