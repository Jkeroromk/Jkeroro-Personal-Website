'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import MouseTrail from '@/components/mousetrail'

const LoadingPage = () => {
  const [progress, setProgress] = useState(0)
  const [isFadingOut, setIsFadingOut] = useState(false)
  const [showAudioPermission, setShowAudioPermission] = useState(false)
  const [loadingDescription, setLoadingDescription] = useState({
    en: 'Brewing digital coffee...',
    zh: '冲泡数字咖啡...'
  })
  const [language, setLanguage] = useState<'en' | 'zh'>('en') // 默认英文
  const router = useRouter()

  // 语言切换函数
  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'zh' : 'en')
  }

  // 多语言内容
  const content: Record<'en' | 'zh', {
    title: string;
    description: string;
    subtitle: string;
    buttonDecline: string;
    buttonAccept: string;
  }> = {
    en: {
      title: "Welcome to Jkeroro's Place",
      description: "I've prepared some nice BGM, shall we start?",
      subtitle: "(It's okay if you don't want to, you can play manually anytime)",
      buttonDecline: "Keep it quiet 🤫",
      buttonAccept: "Let's enjoy! 🎶"
    },
    zh: {
      title: "欢迎来到我的小窝 🏠",
      description: "我准备了一些好听的BGM，要开始了吗？",
      subtitle: "（不开启也没关系，随时可以手动播放）",
      buttonDecline: "先安静会儿 🤫",
      buttonAccept: "开始享受！🎶"
    }
  }

  // 处理音频权限响应
  const handleAudioPermission = (allow: boolean) => {
    console.log('🎵 处理音频权限:', allow)
    setShowAudioPermission(false)
    // 设置Cookie，不设置过期时间（会话Cookie）
    document.cookie = `perm=${allow ? 'allowed' : 'declined'}; Path=/; SameSite=Lax`
    // 设置localStorage，供音乐播放器使用
    localStorage.setItem('audioPermission', allow ? 'allowed' : 'declined')
    // 设置一个标记，表示这是正常跳转
    sessionStorage.setItem('fromLoading', 'true')
    console.log('✅ 设置Cookie、localStorage和sessionStorage完成')
    console.log('✅ localStorage中的audioPermission:', localStorage.getItem('audioPermission'))
    setIsFadingOut(true)
    setTimeout(() => {
      console.log('🚀 开始跳转到home页面')
      router.replace('/home')
    }, 800)
  }


  useEffect(() => {
    // 生活类加载描述
    const descriptions = [
      { en: 'Brewing digital coffee...', zh: '冲泡数字咖啡...' },
      { en: 'Polishing the pixels...', zh: '抛光像素...' },
      { en: 'Making the bed...', zh: '整理床铺...' },
      { en: 'Watering the plants...', zh: '给植物浇水...' },
      { en: 'Folding the laundry...', zh: '叠衣服...' },
      { en: 'Cooking some bytes...', zh: '烹饪一些字节...' },
      { en: 'Cleaning the cache...', zh: '清理缓存...' },
      { en: 'Organizing the files...', zh: '整理文件...' },
      { en: 'Setting the table...', zh: '摆桌子...' },
      { en: 'Taking out the trash...', zh: '倒垃圾...' },
      { en: 'Vacuuming the data...', zh: '吸尘数据...' },
      { en: 'Doing the dishes...', zh: '洗碗...' },
      { en: 'Almost there, I promise...', zh: '快好了，我保证...' }
    ]


    // 更新加载描述
    const descriptionInterval = setInterval(() => {
      const randomDesc = descriptions[Math.floor(Math.random() * descriptions.length)]
      setLoadingDescription(randomDesc)
    }, 1500)

    // 模拟加载进度
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + Math.random() * 8 + 2
      })
    }, 400)

    // 3秒后强制显示音频权限选择
    setTimeout(() => {
      setProgress(100)
      setTimeout(() => {
        setShowAudioPermission(true)
      }, 500)
    }, 3000)

    // 确保MouseTrail在loading页面正确初始化
    const initMouseTrail = setTimeout(() => {
      // 使用记录的鼠标位置或屏幕中心
      const mouseX = (window as typeof window & { lastMouseX?: number }).lastMouseX || window.innerWidth / 2;
      const mouseY = (window as typeof window & { lastMouseY?: number }).lastMouseY || window.innerHeight / 2;
      
      const event = new MouseEvent('mousemove', {
        clientX: mouseX,
        clientY: mouseY
      });
      window.dispatchEvent(event);
    }, 200);

    return () => {
      clearInterval(progressInterval)
      clearInterval(descriptionInterval)
      clearTimeout(initMouseTrail)
    }
  }, [router])


  return (
    <>
      <MouseTrail />
      
      {/* 黑白灰主题的音频权限提示 */}
      {showAudioPermission && (
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
                    className="w-28 h-28 mx-auto bg-gradient-to-br from-gray-100/30 to-gray-200/30 rounded-full flex items-center justify-center backdrop-blur-sm border border-gray-500/50 hover:border-gray-400/60 transition-all duration-300"
                  >
                    <div 
                      className="w-28 h-28 rounded-full overflow-hidden"
                    >
                      <img 
                        src="/pfp.webp" 
                        alt="Jkeroro" 
                        className="w-full h-full object-cover"
                      />
                    </div>
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
      )}

    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: isFadingOut ? 0 : 1 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className={`fixed inset-0 bg-black flex items-center justify-center ${isFadingOut ? 'pointer-events-none' : 'z-40'}`}
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
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 0.6, delay: 0, repeat: Infinity }}
          >J</motion.span>
          <motion.span 
            className="inline-block"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 0.6, delay: 0.1, repeat: Infinity }}
          >k</motion.span>
          <motion.span 
            className="inline-block"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 0.6, delay: 0.2, repeat: Infinity }}
          >e</motion.span>
          <motion.span 
            className="inline-block"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 0.6, delay: 0.3, repeat: Infinity }}
          >r</motion.span>
          <motion.span 
            className="inline-block"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 0.6, delay: 0.4, repeat: Infinity }}
          >o</motion.span>
          <motion.span 
            className="inline-block"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 0.6, delay: 0.5, repeat: Infinity }}
          >r</motion.span>
          <motion.span 
            className="inline-block"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 0.6, delay: 0.6, repeat: Infinity }}
          >o</motion.span>
        </motion.h1>
        
        <motion.p 
          className="text-white/70 mb-6"
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
    </>
  )
}

export default LoadingPage
