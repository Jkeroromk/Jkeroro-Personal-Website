"use client";

import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  isLowEnd: boolean;
  shouldReduceQuality: boolean;
}

export function usePerformanceMonitor(): PerformanceMetrics {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memoryUsage: 0,
    isLowEnd: false,
    shouldReduceQuality: false,
  });

  useEffect(() => {
    // 检测设备性能
    const isLowEnd = 
      navigator.hardwareConcurrency <= 4 || 
      navigator.deviceMemory <= 4 ||
      /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // 监控 FPS
    let frameCount = 0;
    let lastTime = performance.now();
    let fps = 60;

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        frameCount = 0;
        lastTime = currentTime;
        
        setMetrics(prev => ({
          ...prev,
          fps,
          isLowEnd,
          shouldReduceQuality: fps < 30 || isLowEnd,
        }));
      }
      
      requestAnimationFrame(measureFPS);
    };

    // 监控内存使用
    const measureMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
        
        setMetrics(prev => ({
          ...prev,
          memoryUsage,
          shouldReduceQuality: prev.shouldReduceQuality || memoryUsage > 0.8,
        }));
      }
    };

    measureFPS();
    const memoryInterval = setInterval(measureMemory, 5000);

    return () => {
      clearInterval(memoryInterval);
    };
  }, []);

  return metrics;
}

// 性能降级策略
export function getOptimizedSettings(metrics: PerformanceMetrics) {
  const { fps, isLowEnd, shouldReduceQuality } = metrics;
  
  if (shouldReduceQuality || fps < 30) {
    return {
      // Three.js 设置
      antialias: false,
      pixelRatio: 1,
      subdivisions: 64,
      
      // Vanta 设置
      quantity: 0.5,
      scale: 0.6,
      
      // 通用设置
      enableShadows: false,
      enablePostProcessing: false,
    };
  }
  
  if (isLowEnd) {
    return {
      antialias: false,
      pixelRatio: 1,
      subdivisions: 128,
      quantity: 1.0,
      scale: 0.8,
      enableShadows: false,
      enablePostProcessing: false,
    };
  }
  
  return {
    antialias: true,
    pixelRatio: Math.min(window.devicePixelRatio, 2),
    subdivisions: 256,
    quantity: 2.0,
    scale: 1.0,
    enableShadows: true,
    enablePostProcessing: true,
  };
}

