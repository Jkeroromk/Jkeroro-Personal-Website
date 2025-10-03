'use client';

import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import DataManager from "@/lib/data-manager";

gsap.registerPlugin(ScrollTrigger);

const Album = () => {
  const albumRef = useRef(null);
  const imageRefs = useRef([]);
  const [images, setImages] = useState([]);
  const [dataManager] = useState(() => DataManager.getInstance());

  // 加载图片数据
  useEffect(() => {
    if (typeof window === "undefined") return;
    setImages(dataManager.getImages());
  }, [dataManager]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const imageElements = imageRefs.current;

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
  }, []);

  const addToRefs = (el) => {
    if (el && !imageRefs.current.includes(el)) {
      imageRefs.current.push(el);
    }
  };

  return (
    <div
      ref={albumRef}
      className="flex flex-col items-center justify-center mt-10 overflow-x-hidden"
    >
      {images.map((image, index) => (
        <div key={image.id} ref={addToRefs} className="w-full max-w-[550px]">
          <Image
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            priority={image.priority}
            className="rounded-2xl scale-90 sm:scale-100 sm:mb-5 w-full h-auto object-cover"
            style={{ width: '100%', height: 'auto' }}
          />
        </div>
      ))}
    </div>
  );
};

export default Album;