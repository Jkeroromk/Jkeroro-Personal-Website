'use client';

import dynamic from "next/dynamic";
import React from "react";

const Interact = () => {
  // Dynamically import BackgroundVideo
  const BackgroundVideo = dynamic(
    () => import("@/components/effects/backgroundVideo"),
    { ssr: false }
  );

  return (
    <div>
      <BackgroundVideo />
    </div>
  );
};

export default Interact;

