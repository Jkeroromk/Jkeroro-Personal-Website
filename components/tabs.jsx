"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "../firebase";
import { useAuth } from "../auth";

const Tabs = () => {
  const { isAdmin, loading } = useAuth();
  const [carouselItems, setCarouselItems] = useState([]);
  const [fetchError, setFetchError] = useState(null);
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

  useEffect(() => {
    fetchCarouselItems();
  }, []);


  const resetAutoplay = () => {
    if (autoplayPlugin.current) {
      autoplayPlugin.current.reset();
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
    <div className="mt-2 flex flex-col justify-center items-center w-full px-4 z-10">
      {isAdmin && (
        <div className="flex flex-col items-center bg-white bg-opacity-80 border-2 border-black py-6 rounded-3xl mt-10 w-full sm:w-[550px]">
          <h1 className="text-xl font-extrabold text-black">Admin Panel</h1>
          <p className="text-sm text-gray-600 mt-2 text-center">
            Manage your website content, images, and music
          </p>
          <button
            onClick={() => window.open('/admin', '_blank')}
            className="mt-4 py-2 px-6 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Open Admin Panel
          </button>
        </div>
      )}

      <div className="flex flex-col items-center w-full">
        <a
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
        </a>
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

      <Carousel
        className="mt-5 w-full sm:w-[550px]"
        opts={{ loop: true }}
        plugins={[autoplayPlugin.current]}
      >
        <CarouselContent>
          {fetchError ? (
            <p className="text-red-600 font-bold text-center">{fetchError}</p>
          ) : carouselItems.length > 0 ? (
            carouselItems.map((item) => (
              <CarouselItem key={item.id} className="flex justify-center">
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative flex flex-col items-center justify-center border-2 border-black hover:border-blue-600 transition-all duration-300 py-6 px-8 rounded-3xl w-full sm:w-[550px] h-64 overflow-hidden group"
                  style={{
                    backgroundImage: item.image ? `url(${item.image})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    backgroundColor: item.image ? 'transparent' : '#1f2937'
                  }}
                >
                  {/* 背景遮罩 */}
                  <div className="absolute inset-0 bg-black bg-opacity-60 group-hover:bg-opacity-50 transition-all duration-300"></div>
                  
                  {/* 内容 */}
                  <div className="relative z-10 text-center">
                    <h1 className="text-xl font-extrabold text-white group-hover:text-blue-300 transition-colors duration-300 mb-2">
                      {item.title}
                    </h1>
                    <h2 className="text-sm font-semibold text-gray-200 group-hover:text-blue-200 transition-colors duration-300">
                      {item.description}
                    </h2>
                    {item.category && (
                      <span className="inline-block mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded-full">
                        {item.category}
                      </span>
                    )}
                  </div>
                </a>
              </CarouselItem>
            ))
          ) : (
            <p className="text-white ml-56 font-bold">Loading projects...</p>
          )}
        </CarouselContent>
      </Carousel>

      <div className="flex flex-col items-center w-full">
        <a
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
        </a>
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