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
          <motion.span 
            className="inline-block"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {loadingDescription.en}
          </motion.span>
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
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-white/40 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </motion.div>
        
        <motion.div 
          className="text-white/60 text-sm"
          initial={{ opacity: 1 }}
          animate={{ opacity: isFadingOut ? 0 : 1 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          {Math.round(progress)}%
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

export default LoadingProgress
