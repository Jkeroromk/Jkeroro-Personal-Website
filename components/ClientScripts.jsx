'use client';

import { useEffect, useRef } from 'react';

export default function ClientScripts() {
  const loadingRef = useRef(false);

  useEffect(() => {
    // 统一使用 npm 包中的 Three.js，避免重复导入
    if (typeof window === 'undefined') return;
    if (window.THREE || loadingRef.current) return;

    const loadThree = () => {
      if (window.THREE || loadingRef.current) return;
      loadingRef.current = true;

      import('three').then((THREE) => {
        if (window.THREE) {
          loadingRef.current = false;
          return;
        }
        window.THREE = THREE;

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
    };

    // 延迟到浏览器空闲时加载 Three.js，避免阻塞首屏渲染
    if ('requestIdleCallback' in window) {
      requestIdleCallback(loadThree, { timeout: 3000 });
    } else {
      setTimeout(loadThree, 1000);
    }
  }, []);

  return null;
}
