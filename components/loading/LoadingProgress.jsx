'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'

const CIRCUMFERENCE = 2 * Math.PI * 44 // r=44

// 静态粒子数据（固定种子，避免 hydration 不一致）
const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  cx: 50 + 42 * Math.cos((i / 18) * Math.PI * 2),
  cy: 50 + 42 * Math.sin((i / 18) * Math.PI * 2),
  r: 1 + (i % 3) * 0.6,
  delay: i * 0.12,
}))

const LoadingProgress = ({ progress, isFadingOut, loadingDescription }) => {
  const dashOffset = useMemo(
    () => CIRCUMFERENCE * (1 - Math.min(progress, 100) / 100),
    [progress]
  )

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: isFadingOut ? 0 : 1 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
      className="fixed inset-0 bg-black flex items-center justify-center z-40 overflow-hidden"
    >

      <motion.div
        initial={{ scale: 1 }}
        animate={{ scale: isFadingOut ? 0.92 : 1 }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
        className="relative flex flex-col items-center"
      >
        {/* 圆形进度环 */}
        <div className="relative w-40 h-40 mb-6">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full -rotate-90"
            aria-hidden="true"
          >
            {/* 轨道 */}
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="rgba(255,255,255,0.07)"
              strokeWidth="3"
            />

            {/* 进度弧 */}
            <motion.circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              initial={{ strokeDashoffset: CIRCUMFERENCE }}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 1.0, ease: 'easeOut' }}
            />

            {/* 粒子点 */}
            {PARTICLES.map((p) => (
              <motion.circle
                key={p.id}
                cx={p.cx}
                cy={p.cy}
                r={p.r}
                fill="rgba(255,255,255,0.25)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.6, 0] }}
                transition={{
                  duration: 2.4,
                  delay: p.delay,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            ))}

          </svg>

          {/* 中心百分比 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              key={Math.round(progress)}
              initial={{ scale: 1.15, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="text-2xl font-bold text-white font-mono leading-none"
            >
              {Math.round(progress)}
            </motion.span>
            <span className="text-white/40 text-xs mt-0.5 font-mono">%</span>
          </div>
        </div>

        {/* 标题 — 字母逐一浮入 */}
        <motion.h1
          className="text-4xl font-bold text-white mb-3 tracking-wide"
          initial={{ y: 0 }}
          animate={{ y: isFadingOut ? -20 : 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        >
          {['J', 'k', 'e', 'r', 'o', 'r', 'o'].map((letter, i) => (
            <motion.span
              key={i}
              className="inline-block"
              initial={{ opacity: 0, y: 16 }}
              animate={{
                opacity: 1,
                y: [0, -12, 0],
              }}
              transition={{
                opacity: { duration: 0.4, delay: 0.15 + i * 0.08 },
                y: {
                  duration: 1.8,
                  repeat: Infinity,
                  repeatType: 'reverse',
                  ease: 'easeInOut',
                  delay: 1.2 + i * 0.15,
                },
              }}
              style={{
                textShadow: '0 0 20px rgba(255,255,255,0.4)',
              }}
            >
              {letter}
            </motion.span>
          ))}
        </motion.h1>

        {/* 副标题 */}
        <motion.p
          className="text-white/60 text-sm mb-1 tracking-widest uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: isFadingOut ? 0 : 0.6 }}
          transition={{ duration: 1, delay: 0.8 }}
        >
          Welcome to my Cozy Place
        </motion.p>

        {/* 加载描述 */}
        <motion.div
          className="text-white/40 text-xs mt-3 text-center"
          initial={{ opacity: 1 }}
          animate={{ opacity: isFadingOut ? 0 : 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="mb-0.5">{loadingDescription.en}</div>
          <div className="text-white/25">{loadingDescription.zh}</div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

export default LoadingProgress
