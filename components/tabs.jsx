"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { firestore } from "../firebase";
import { useAuth } from "../auth";
import { motion } from "framer-motion";

// 简单卡片组件
const Card3D = ({ children, className = "", href, target, rel, onMouseEnter, onMouseLeave }) => {
  const CardComponent = href ? motion.a : motion.div;
  
  return (
    <CardComponent
      href={href}
      target={target}
      rel={rel}
      className={className}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        transformOrigin: "center center"
      }}
      whileHover={{
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
    >
      {children}
    </CardComponent>
  );
};

const Tabs = () => {
  const { isAdmin, loading } = useAuth();
  const [carouselItems, setCarouselItems] = useState([]);
  const [fetchError, setFetchError] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [emblaApi, setEmblaApi] = useState(null);
  const autoplayPlugin = useRef(Autoplay({ delay: 3000, stopOnInteraction: false }));

  const fetchCarouselItems = async () => {
    try {
      const querySnapshot = await getDocs(collection(firestore, "carouselItems"));
      const items = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCarouselItems(items);
      setFetchError(null);
    } catch (error) {
      console.error("Detailed error fetching carousel items:", error.code, error.message);
      if (error.code === "permission-denied") {
        setFetchError("You don't have permission to view projects.");
      } else {
        setFetchError("Failed to load projects: " + error.message);
      }
    }
  };

  // 实时监听数据变化
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(firestore, "carouselItems"),
      (querySnapshot) => {
        const items = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCarouselItems(items);
        setFetchError(null);
        console.log("Carousel data updated:", items.length, "items");
      },
      (error) => {
        console.error("Real-time listener error:", error.code, error.message);
        if (error.code === "permission-denied") {
          setFetchError("You don't have permission to view projects.");
        } else {
          setFetchError("Failed to load projects: " + error.message);
        }
      }
    );

    // 清理监听器
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (emblaApi) {
      const onSelect = () => {
        setCurrentSlide(emblaApi.selectedScrollSnap());
      };
      
      emblaApi.on('select', onSelect);
      onSelect(); // 初始化时设置当前slide
      
      return () => {
        emblaApi.off('select', onSelect);
      };
    }
  }, [emblaApi]);


  const resetAutoplay = () => {
    if (autoplayPlugin.current) {
      autoplayPlugin.current.reset();
    }
  };

  const pauseAutoplay = () => {
    if (autoplayPlugin.current) {
      autoplayPlugin.current.stop();
    }
  };

  const resumeAutoplay = () => {
    if (autoplayPlugin.current) {
      autoplayPlugin.current.play();
    }
  };

  if (loading) {
    return (
      <div className="mt-2 flex flex-col justify-center items-center w-full px-4 z-10">
        <p className="text-white font-bold">Loading authentication...</p>
      </div>
    );
  }

  return (
    <div className="mt-2 flex flex-col justify-center items-center w-full px-4 z-10" style={{ overflow: 'visible' }}>
      <div className="flex flex-col items-center w-full">
        <Card3D
          href="https://3d-portfolio-jade-xi.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center bg-white bg-opacity-80 border-2 border-black py-4 rounded-3xl mt-10 w-full sm:w-[550px] transition-transform duration-300 hover:scale-105 hover:shadow-[0_0_20px_white] heartbeat"
        >
          <h1 className="text-xl font-extrabold text-black hover:text-blue-600 transition-colors duration-300">
            Personal Cv
          </h1>
          <h2 className="text-base font-extrabold text-black hover:text-blue-600 transition-colors duration-300">
            Job Only
          </h2>
        </Card3D>
      </div>

      <h1 className="flex justify-center text-white font-extrabold text-2xl mt-10">
        Personal Project Collection
      </h1>

      <div className="flex gap-x-3">
        <ArrowLeft className="text-white mt-3 cursor-pointer hover:text-blue-300 transition-colors" onClick={resetAutoplay} />
        <h2 className="flex justify-center text-white font-extrabold text-xl mt-2">
          Swap me
        </h2>
        <ArrowRight className="text-white mt-3 cursor-pointer hover:text-blue-300 transition-colors" onClick={resetAutoplay} />
      </div>

      <div className="py-16" style={{ overflow: 'visible' }}>
        <Carousel
          className="mt-5 w-full"
          opts={{ 
            loop: true,
            align: "center"
          }}
          plugins={[autoplayPlugin.current]}
          setApi={setEmblaApi}
          style={{ overflow: 'visible' }}
        >
        <CarouselContent style={{ overflow: 'visible' }}>
          {fetchError ? (
            <p className="text-red-600 font-bold text-center">{fetchError}</p>
          ) : carouselItems.length > 0 ? (
            carouselItems.map((item) => (
              <CarouselItem key={item.id} className="flex justify-center" style={{ overflow: 'visible' }}>
                <div className="w-full sm:w-[550px] mx-auto" style={{ overflow: 'visible' }}>
                  <Card3D
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden shadow-2xl hover:shadow-white/20 transition-all duration-500 hover:border-white/40"
                    onMouseEnter={pauseAutoplay}
                    onMouseLeave={resumeAutoplay}
                  >
                      {/* 图片区域 */}
                      <div 
                        className="relative h-64 sm:h-80 overflow-hidden"
                        style={{
                          backgroundImage: item.image ? `url("${encodeURI(item.image)}")` : 'none',
                          backgroundSize: 'cover',
                          backgroundPosition: item.cropX !== undefined && item.cropY !== undefined ? `${item.cropX}% ${item.cropY}%` : (item.imagePosition || 'center'),
                          backgroundRepeat: 'no-repeat',
                          backgroundColor: item.image ? 'transparent' : '#1f2937'
                        }}
                      >
                        {/* 渐变遮罩 */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                        
                        
                        {/* 悬停指示器 */}
                        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="flex items-center gap-2 px-3 py-2 bg-white/20 backdrop-blur-sm rounded-full">
                            <span className="text-white text-sm font-medium">View Project</span>
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                      {/* 文字内容区域 */}
                      <div className="p-6">
                        <div className="flex items-center gap-3 mb-3">
                          <h1 className="text-2xl sm:text-3xl font-bold text-white group-hover:text-gray-200 transition-colors duration-300 leading-tight">
                            {item.title}
                          </h1>
                          {item.category && (
                            <span className="px-3 py-0.5 bg-blue-600/20 border-l-2 border-blue-500 text-blue-300 text-xs font-light tracking-wide uppercase">
                              {item.category}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-300 text-base sm:text-lg leading-relaxed mb-4 group-hover:text-gray-200 transition-colors duration-300">
                          {item.description}
                        </p>
                        
                        {/* 底部装饰线 */}
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-px bg-gradient-to-r from-white/30 to-transparent"></div>
                          <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                          <div className="flex-1 h-px bg-gradient-to-l from-white/30 to-transparent"></div>
                        </div>
                      </div>
                  </Card3D>
                </div>
              </CarouselItem>
            ))
          ) : (
            <p className="text-white ml-56 font-bold">Loading projects...</p>
          )}
        </CarouselContent>
        
        {/* Dot指示器 - 在carousel内部 */}
        {carouselItems.length > 1 && (
          <div className="flex justify-center mt-4 gap-2">
            {carouselItems.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  if (emblaApi) {
                    emblaApi.scrollTo(index);
                  }
                }}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide 
                    ? 'bg-white/80 scale-125' 
                    : 'bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
        </Carousel>
      </div>

      <div className="flex flex-col items-center w-full">
        <Card3D
          href="https://www.xiaohongshu.com/user/profile/678e5f43000000000e0107ac?xsec_token=YBoDy4ooZI5wbVMGN9VSpV7OGN88SSTRIr5QQntEv1awY=&xsec_source=app_share&xhsshare=CopyLink&appuid=678e5f43000000000e0107ac&apptime=1738075633&share_id=d3e00f56b0ba47ecb739975076b7eb34"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center bg-white bg-opacity-80 border-2 border-black py-6 rounded-3xl mt-16 w-full sm:w-[550px] transition-transform duration-300 hover:scale-105 hover:shadow-[0_0_20px_white] heartbeat"
        >
          <h1 className="text-xl font-extrabold text-black hover:text-blue-600 transition-colors duration-300">
            Rednote
          </h1>
          <h2 className="text-sm font-semibold text-black hover:text-blue-600 transition-colors duration-300">
            Thread
          </h2>
        </Card3D>
      </div>

      <div className="flex flex-col items-center w-full">
        <a
          href="https://discord.gg/eD7ZRcg22H"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center bg-white bg-opacity-80 border-2 border-black py-6 rounded-3xl mt-10 w-full sm:w-[550px] transition-transform duration-300 hover:scale-105 hover:shadow-[0_0_20px_white] heartbeat"
        >
          <h1 className="text-xl font-extrabold text-black hover:text-blue-600 transition-colors duration-300">
            Discord
          </h1>
          <h2 className="text-sm font-semibold text-black hover:text-blue-600 transition-colors duration-300">
            Cozy
          </h2>
        </a>
      </div>

      <div className="flex flex-col items-center w-full">
        <a
          href="https://www.patreon.com/yourprofile"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center bg-white bg-opacity-80 border-2 border-black py-6 rounded-3xl mt-10 w-full sm:w-[550px] transition-transform duration-300 hover:scale-105 hover:shadow-[0_0_20px_white] heartbeat"
        >
          <h1 className="text-xl font-extrabold text-black hover:text-blue-600 transition-colors duration-300">
            Donation
          </h1>
          <h2 className="text-sm font-semibold text-black hover:text-blue-600 transition-colors duration-300">
            Payment
          </h2>
        </a>
      </div>
    </div>
  );
};

export default Tabs;