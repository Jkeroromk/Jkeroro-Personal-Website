'use client';

import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "../firebase";

gsap.registerPlugin(ScrollTrigger);

const Album = () => {
  const albumRef = useRef(null);
  const imageRefs = useRef([]);
  const [images, setImages] = useState([]);

  // 从 Firestore 加载图片数据
  const loadImages = async () => {
    if (typeof window === "undefined") {
      return;
    }
    
    if (!firestore) {
      setImages([]);
      return;
    }
    
    try {
      const imagesSnapshot = await getDocs(collection(firestore, "images"));
      const firebaseImages = imagesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // 如果 Firestore 中没有图片，不显示任何内容
      if (firebaseImages.length === 0) {
        setImages([]);
      } else {
        setImages(firebaseImages);
      }
    } catch (error) {
      console.error('Album: Error loading images from Firestore:', error);
      // 如果 Firestore 加载失败，不显示任何内容
      setImages([]);
    }
  };

  useEffect(() => {
    loadImages();
  }, []);

  // 监听图片数据变化事件
  useEffect(() => {
    const handleImagesDataChange = () => {
      loadImages();
    };

    window.addEventListener('imagesDataChanged', handleImagesDataChange);
    
    return () => {
      window.removeEventListener('imagesDataChanged', handleImagesDataChange);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const imageElements = imageRefs.current;

    // 检查是否有图片元素
    if (!imageElements || imageElements.length === 0) {
      return;
    }

    gsap.set(imageElements, { opacity: 0 });

    imageElements.forEach((image, index) => {
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
  }, [images]); // 依赖 images 数组，当图片数据变化时重新运行动画

  const addToRefs = (el) => {
    if (el && !imageRefs.current.includes(el)) {
      imageRefs.current.push(el);
    }
  };

  // 如果没有图片，不渲染任何内容
  if (images.length === 0) {
    return null;
  }

  return (
    <div
      ref={albumRef}
      className="flex flex-col items-center justify-center mt-6 overflow-x-hidden"
    >
      {images.map((image, index) => (
        <div key={image.id} ref={addToRefs} className="w-full sm:w-[550px] mb-4">
          <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-gray-800">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              priority={image.priority}
              className="object-cover"
              style={{ 
                objectPosition: `${image.imageOffsetX || 50}% ${image.imageOffsetY || 50}%`
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default Album;