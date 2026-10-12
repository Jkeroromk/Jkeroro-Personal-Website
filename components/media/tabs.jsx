"use client";

import React from "react";
import { useAuth } from "../../auth";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import Image from "next/image";
import DonationButton from '@/components/interactive/DonationButton';
import ProjectStory from "@/components/media/ProjectStory";

// 简单卡片组件（带鼠标跟踪 3D 倾斜）
const Card3D = ({ children, className = "", href, target, rel, onMouseEnter, onMouseLeave }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-0.5, 0.5], [10, -10]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-10, 10]);

  const springRotateX = useSpring(rotateX, { stiffness: 300, damping: 30 });
  const springRotateY = useSpring(rotateY, { stiffness: 300, damping: 30 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
    onMouseEnter?.(e);
  };

  const handleMouseLeave = (e) => {
    x.set(0);
    y.set(0);
    onMouseLeave?.(e);
  };

  const CardComponent = href ? motion.a : motion.div;

  return (
    <CardComponent
      href={href}
      target={target}
      rel={rel}
      className={className}
      style={{
        rotateX: springRotateX,
        rotateY: springRotateY,
        transformStyle: "preserve-3d",
        transformOrigin: "center center",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </CardComponent>
  );
};

const Tabs = () => {
  const { loading } = useAuth();

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
          className="flex flex-col items-center bg-white bg-opacity-80 border-2 border-black py-4 rounded-3xl mt-6 w-full sm:w-[550px] transition-transform duration-300 hover:scale-105 hover:shadow-[0_0_20px_white] heartbeat"
        >
          <h1 className="text-xl font-extrabold text-black hover:text-blue-600 transition-colors duration-300">
            Personal Cv
          </h1>
          <h2 className="text-base font-extrabold text-black hover:text-blue-600 transition-colors duration-300">
            Job Only
          </h2>
        </Card3D>

        <Card3D
          href="https://killcam.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center bg-white bg-opacity-80 border-2 border-black py-4 rounded-3xl mt-6 w-full sm:w-[550px] transition-transform duration-300 hover:scale-105 hover:shadow-[0_0_20px_white] heartbeat"
        >
          <div className="flex items-center gap-2">
            <Image
              src="/killcam.png"
              alt=""
              width={24}
              height={24}
              className="rounded-md"
            />
            <h1 className="text-xl font-extrabold text-black hover:text-blue-600 transition-colors duration-300">
              KillCam
            </h1>
          </div>
          <h2 className="text-base font-extrabold text-black hover:text-blue-600 transition-colors duration-300">
            In-Game auto Highlight Recorder
          </h2>
        </Card3D>
      </div>

      <h2 className="flex justify-center text-white font-extrabold text-2xl mt-20">
        Personal Project Collection
      </h2>

      {/* 作品区：滚动叙事（原来是 carousel） */}
      <div className="w-full py-8" style={{ overflow: 'visible' }}>
        <ProjectStory />
      </div>

      <DonationButton />
    </div>
  );
};

export default Tabs;
