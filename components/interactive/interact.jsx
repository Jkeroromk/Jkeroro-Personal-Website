'use client';

import dynamic from "next/dynamic";
import React from "react";

// 将 dynamic import 移到组件外部，避免每次渲染都创建新组件
const BackgroundVideo = dynamic(
  () => import("@/components/effects/backgroundVideo"),
  { ssr: false }
);

const Interact = () => {
  return (
    <div>
      <BackgroundVideo />
    </div>
  );
};

export default Interact;

