'use client'

import React from 'react'
import { motion } from 'framer-motion'

const AudioPermissionModal = ({ 
  showAudioPermission, 
  language, 
  content, 
  toggleLanguage, 
  handleAudioPermission 
}) => {
  if (!showAudioPermission) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60]"
    >
      {/* 动态背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        {/* 简化的背景光晕 */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 2, ease: "easeOut", delay: 0.2 }}
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-gray-500/6 to-white/6 rounded-full blur-3xl"
        />
        
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 2, ease: "easeOut", delay: 0.4 }}
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-white/6 to-gray-500/6 rounded-full blur-3xl"
        />
        
        {/* 简化的浮动粒子效果 - 减少数量 */}
        {[...Array(2)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              opacity: 0,
              scale: 0
            }}
            animate={{ 
              opacity: [0, 0.3, 0],
              scale: [0, 1, 0]
            }}
            transition={{ 
              duration: 6,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
              delay: i * 2
            }}
            className="absolute w-1 h-1 bg-white/15 rounded-full blur-sm"
            style={{
              left: (20 + i * 60) + '%',
              top: (30 + i * 40) + '%'
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ scale: 0.9, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
        className="relative max-w-md w-full mx-4"
      >
        {/* 主卡片 */}
        <motion.div 
          whileHover={{ 
            scale: 1.01,
            transition: { duration: 0.2 }
          }}
          className="relative bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-900/95 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-gray-700/50 hover:border-gray-600/60 transition-all duration-300"
        >
          
          {/* 语言切换按钮 */}
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            onClick={toggleLanguage}
            className="absolute top-6 right-6 bg-white/5 hover:bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm transition-all duration-300 border border-gray-600/50 hover:border-gray-500/50 hover:scale-105"
          >
            {language === 'en' ? '中' : 'EN'}
          </motion.button>

          {/* 内容区域 */}
          <div className="pt-6">
            {/* 音乐图标容器 */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="relative mb-6"
            >
              <motion.div 
                whileHover={{ 
                  scale: 1.05,
                  transition: { duration: 0.2 }
                }}
                className="w-20 h-20 mx-auto bg-gradient-to-br from-gray-100/30 to-gray-200/30 rounded-full flex items-center justify-center backdrop-blur-sm border border-gray-500/50 hover:border-gray-400/60 transition-all duration-300"
              >
                <motion.div 
                  animate={{ 
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                  className="text-3xl"
                >
                  🎵
                </motion.div>
              </motion.div>
              
              {/* 简化的装饰性光环 */}
              <motion.div 
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.2, 0.4, 0.2]
                }}
                transition={{ 
                  duration: 6, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                className="absolute inset-0 w-20 h-20 mx-auto bg-gradient-to-br from-white/3 to-gray-500/3 rounded-full"
              />
            </motion.div>
            
            {/* 标题 */}
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="text-2xl font-bold text-white mb-3"
            >
              {content[language].title}
            </motion.h2>
            
            {/* 描述 */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.6 }}
              className="text-gray-300 mb-6 leading-relaxed"
            >
              <p className="text-base mb-2">{content[language].description}</p>
              <p className="text-sm text-gray-400 opacity-80">{content[language].subtitle}</p>
            </motion.div>
            
            {/* 按钮组 */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.7 }}
              className="flex gap-4"
            >
              <button 
                onClick={() => handleAudioPermission(false)}
                className="flex-1 bg-gradient-to-r from-gray-700/80 to-gray-800/80 hover:from-gray-600/80 hover:to-gray-700/80 text-gray-200 px-4 py-3 rounded-xl transition-all duration-300 font-medium border border-gray-600/50 hover:border-gray-500/50 backdrop-blur-sm hover:scale-105 text-sm"
              >
                {content[language].buttonDecline}
              </button>
              <button 
                onClick={() => handleAudioPermission(true)}
                className="flex-1 bg-gradient-to-r from-white to-gray-200 hover:from-gray-100 hover:to-gray-300 text-black px-4 py-3 rounded-xl transition-all duration-300 font-medium shadow-lg hover:shadow-white/10 transform hover:scale-105 text-sm"
              >
                {content[language].buttonAccept}
              </button>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

export default AudioPermissionModal
