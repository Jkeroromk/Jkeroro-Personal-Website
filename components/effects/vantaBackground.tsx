"use client";

import React from "react";

export default function BackgroundVideo() {

  return (
    <div className="fixed -z-50 overflow-hidden" style={{ top: '-50px', left: '-50px', right: '-50px', bottom: '-50px' }}>
      <video
        src="/background.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          minWidth: '100vw',
          minHeight: '100dvh',
          width: 'auto',
          height: 'auto',
          objectFit: 'cover',
          transform: 'scale(1.3)',
          transformOrigin: 'center center'
        }}
      />
    </div>
  );
}
