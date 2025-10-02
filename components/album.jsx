'use client';

import Image from "next/image";
import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const Album = () => {
  const albumRef = useRef(null);
  const imageRefs = useRef([]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const images = imageRefs.current;

    gsap.set(images, { opacity: 0 });

    images.forEach((image, index) => {
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
      <div ref={addToRefs} className="w-full max-w-[550px]">
        <Image
          src="/me.webp"
          alt="me"
          width={550}
          height={550}
          priority
          className="rounded-2xl scale-90 sm:scale-100 sm:mb-5 w-full h-auto object-cover"
          style={{ width: '100%', height: 'auto' }}
        />
      </div>
      <div ref={addToRefs} className="w-full max-w-[550px]">
        <Image
          src="/Room.jpg"
          alt="album"
          width={550}
          height={400}
          className="rounded-2xl scale-90 sm:scale-100 sm:mb-5 object-cover"
          style={{ width: '100%', height: 'auto' }}
        />
      </div>
      <div ref={addToRefs} className="w-full max-w-[550px]">
        <Image
          src="/lego-car.jpg"
          alt="album"
          width={550}
          height={400}
          className="rounded-2xl scale-90 sm:scale-100 sm:mb-5 object-cover"
          style={{ width: '100%', height: 'auto' }}
        />
      </div>
      <div ref={addToRefs} className="w-full max-w-[550px]">
        <Image
          src="/coffee.jpg"
          alt="album"
          width={550}
          height={400}
          className="rounded-2xl scale-90 sm:scale-100 sm:mb-5 object-cover"
          style={{ width: '100%', height: 'auto' }}
        />
      </div>
    </div>
  );
};

export default Album;