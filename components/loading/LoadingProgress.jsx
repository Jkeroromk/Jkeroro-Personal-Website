'use client'

import React from 'react'
import { motion } from 'framer-motion'

const LoadingProgress = ({ progress, isFadingOut, loadingDescription }) => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: isFadingOut ? 0 : 1 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 bg-black flex items-center justify-center z-40"
    >
      <motion.div
        initial={{ scale: 1 }}
        animate={{ scale: isFadingOut ? 0.95 : 1 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        className="text-center"
      >
        <motion.h1 
          className="text-4xl font-bold text-white mb-4"
          initial={{ y: 0 }}
          animate={{ y: isFadingOut ? -20 : 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          {['J', 'k', 'e', 'r', 'o', 'r', 'o'].map((letter, index) => (
            <motion.span 
              key={index}
              className="inline-block"
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                y: [0, -15, 0]
              }}
              transition={{ 
                duration: 0.5, 
                delay: 0.2 + index * 0.1,
                y: {
                  duration: 1.5,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                  delay: 1.5 + index * 0.2
                }
              }}
            >
              {letter}
            </motion.span>
          ))}
        </motion.h1>
        
        <motion.p 
          className="text-white/80 text-lg mb-2"
          initial={{ opacity: 1 }}
          animate={{ opacity: isFadingOut ? 0 : 1 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          Welcome to my Cozy Place
        </motion.p>
        
        <motion.div 
          className="text-white/50 text-sm mb-4"
          initial={{ opacity: 1 }}
          animate={{ opacity: isFadingOut ? 0 : 1 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          <div className="mb-1">{loadingDescription.en}</div>
          <div className="text-xs">{loadingDescription.zh}</div>
        </motion.div>
        
        <motion.div 
          className="w-64 mx-auto mb-4"
          initial={{ opacity: 1 }}
          animate={{ opacity: isFadingOut ? 0 : 1 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden relative">
            {/* 背景渐变 */}
            <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 rounded-full" />
            
            {/* 进度条主体 */}
            <motion.div 
              className="h-full bg-gradient-to-r from-white via-gray-200 to-white rounded-full relative overflow-hidden"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            >
              {/* 动态光效 */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{
                  x: ['-100%', '100%']
                }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              
              {/* 脉冲效果 */}
              <motion.div
                className="absolute inset-0 bg-white/20"
                animate={{
                  opacity: [0.3, 0.8, 0.3]
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.div>
            
            {/* 边框高光 */}
            <div className="absolute inset-0 border border-gray-600/50 rounded-full" />
            <div className="absolute inset-0 border border-white/20 rounded-full" />
          </div>
        </motion.div>
        
        <motion.div 
          className="text-white/80 text-sm font-mono"
          initial={{ opacity: 1 }}
          animate={{ opacity: isFadingOut ? 0 : 1 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          <motion.span
            key={Math.round(progress)}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {Math.round(progress)}%
          </motion.span>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

export default LoadingProgress
