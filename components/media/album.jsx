'use client';

import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
// 只导入需要的 GSAP 功能
import { gsap } from "gsap/dist/gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { getRealtimeClient } from "@/lib/realtime-client";

gsap.registerPlugin(ScrollTrigger);

const Album = () => {
  const albumRef = useRef(null);
  const imageRefs = useRef([]);
  const [images, setImages] = useState([]);

  // 从 API 加载图片数据（初始加载）
  const loadImages = async () => {
    if (typeof window === "undefined") {
      return;
    }
    
    try {
      const response = await fetch('/api/media/images');
      if (!response.ok) throw new Error('Failed to fetch images');
      
      const data = await response.json();
      
      // API 已经按 order 排序，如果没有 order 则按创建时间排序
      if (data.length === 0) {
        setImages([]);
      } else {
        setImages(data);
      }
    } catch (error) {
      console.error('Album: Error loading images:', error);
      setImages([]);
    }
  };

  useEffect(() => {
    // 初始加载
    loadImages();
    
    // 使用 SSE 实时更新
    const realtimeClient = getRealtimeClient();
    const unsubscribe = realtimeClient.subscribe('images', (newData) => {
      // 比较新旧数据，只在真正变化时更新
      setImages(prevImages => {
        // 如果图片数量相同，比较 ID 和关键字段
        if (prevImages.length === newData.length) {
          const prevIds = prevImages.map(img => img.id).sort().join(',');
          const newIds = newData.map(img => img.id).sort().join(',');
          
          // ID 相同，比较 order 字段（如果存在）
          if (prevIds === newIds) {
            const prevOrders = prevImages.map(img => img.order || 0).join(',');
            const newOrders = newData.map(img => img.order || 0).join(',');
            
            // 如果 order 也相同，不更新
            if (prevOrders === newOrders) {
              return prevImages; // 返回原数组，不触发重新渲染
            }
          }
        }
        
        // 数据有变化，更新状态
        return newData;
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const imageElements = imageRefs.current;

    // 检查是否有图片元素
    if (!imageElements || imageElements.length === 0) {
      return;
    }

    // 清理该元素上已有的 ScrollTrigger（避免重复创建）
    imageElements.forEach((image) => {
      if (image) {
        const existingTriggers = ScrollTrigger.getAll().filter(
          (trigger) => trigger.vars?.trigger === image
        );
        existingTriggers.forEach((trigger) => trigger.kill());
      }
    });

    gsap.set(imageElements, { opacity: 0 });

    imageElements.forEach((image, index) => {
      if (!image) return;

      const isMobile = window.innerWidth <= 768;
      // Reduce the animation distance for mobile to prevent overflow
      const direction = index % 2 === 0 ? (isMobile ? -50 : -200) : (isMobile ? 50 : 200);

      gsap.fromTo(
        image,
        { opacity: 0, x: direction },
        {
          opacity: 1,
          x: 0,
          duration: 1.5,
          ease: "expo.out",
          scrollTrigger: {
            trigger: image,
            start: isMobile ? "top 90%" : "top 85%",
            end: isMobile ? "bottom 10%" : "bottom 15%",
            toggleActions: "play none none reverse",
          },
        }
      );
    });

    // 清理函数：组件卸载或 images 变化时清理 ScrollTrigger
    return () => {
      imageElements.forEach((image) => {
        if (image) {
          const existingTriggers = ScrollTrigger.getAll().filter(
            (trigger) => trigger.vars?.trigger === image
          );
          existingTriggers.forEach((trigger) => trigger.kill());
        }
      });
    };
  }, [images]); // 依赖 images 数组，当图片数据变化时重新运行动画

  const addToRefs = (el) => {
    if (el && !imageRefs.current.includes(el)) {
      imageRefs.current.push(el);
    }
  };

  // 如果没有图片，显示占位内容而不是完全不渲染
  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center mt-6 px-4 sm:px-6">
        <div className="text-center text-gray-400">
          <p className="text-lg mb-2">📸 相册</p>
          <p className="text-sm">暂无图片</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={albumRef}
      className="flex flex-col items-center justify-center mt-6 overflow-x-hidden px-4 sm:px-6"
    >
      {images.map((image, index) => (
        <div key={image.id} ref={addToRefs} className="w-full sm:w-[550px] mb-4">
          <div className="relative w-full aspect-[550/384] rounded-2xl overflow-hidden bg-gray-800">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(max-width: 640px) 100vw, 550px"
              priority={image.priority}
              className="object-cover"
              style={{ 
                objectPosition: `${image.imageOffsetX || 50}% ${image.imageOffsetY || 50}%`
              }}
              unoptimized={image.src.startsWith('/api/file/') || image.src.startsWith('https://')}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default Album;