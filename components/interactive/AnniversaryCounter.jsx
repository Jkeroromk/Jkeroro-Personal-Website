'use client'

import { useState, useEffect, useRef } from 'react'
import { Heart } from 'lucide-react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useAnniversaryData } from '@/hooks/useAnniversaryData'

const AnniversaryCounter = () => {
  const [days, setDays] = useState(0)
  const [backgroundImages, setBackgroundImages] = useState([])
  const [imagePositions, setImagePositions] = useState({})
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [imageOffsetX, setImageOffsetX] = useState(50)
  const [imageOffsetY, setImageOffsetY] = useState(50)
  const [isHovered, setIsHovered] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const currentIndexRef = useRef(0)
  const [imagesPreloaded, setImagesPreloaded] = useState(false)

  // 纪念日开始日期：2023年5月20日
  const anniversaryDate = new Date('2023-05-20T00:00:00')

  // 获取背景图列表和位置 - 使用新的 Hook
  const { backgroundImages: fetchedImages, imagePositions: fetchedPositions, loading: imagesLoading } = useAnniversaryData()
  
  useEffect(() => {
    setBackgroundImages(fetchedImages)
    setImagePositions(fetchedPositions)
    
    // 加载当前图片的位置
    if (fetchedImages.length > 0) {
      const currentImageUrl = fetchedImages[currentImageIndex]
      const currentPosition = fetchedPositions[currentImageUrl] || { x: 50, y: 50 }
      setImageOffsetX(currentPosition.x)
      setImageOffsetY(currentPosition.y)
    }
  }, [fetchedImages, fetchedPositions, currentImageIndex])

  // 预加载所有图片，避免切换时闪烁
  useEffect(() => {
    if (backgroundImages.length === 0) return
    let loaded = 0
    backgroundImages.forEach((src) => {
      const img = new window.Image()
      img.src = src
      img.onload = () => {
        loaded++
        if (loaded >= backgroundImages.length) setImagesPreloaded(true)
      }
      img.onerror = () => {
        loaded++
        if (loaded >= backgroundImages.length) setImagesPreloaded(true)
      }
    })
  }, [backgroundImages])

  // 当图片索引或位置数据变化时，更新位置
  useEffect(() => {
    if (backgroundImages.length > 0 && currentImageIndex < backgroundImages.length) {
      currentIndexRef.current = currentImageIndex
      const currentImageUrl = backgroundImages[currentImageIndex]
      const currentPosition = imagePositions[currentImageUrl] || { x: 50, y: 50 }
      setImageOffsetX(currentPosition.x)
      setImageOffsetY(currentPosition.y)
    }
  }, [currentImageIndex, backgroundImages, imagePositions])

  // 自动轮换图片（hover 时暂停）
  useEffect(() => {
    if (backgroundImages.length <= 1 || isPaused) {
      return
    }

    const rotateImages = () => {
      const currentIdx = currentIndexRef.current
      const nextIndex = (currentIdx + 1) % backgroundImages.length
      setCurrentImageIndex(nextIndex)
      // 更新新图片的位置
      const nextImageUrl = backgroundImages[nextIndex]
      const nextPosition = imagePositions[nextImageUrl] || { x: 50, y: 50 }
      setImageOffsetX(nextPosition.x)
      setImageOffsetY(nextPosition.y)
    }

    // 每 6 秒轮换一次（给图片更多停留时间）
    const interval = setInterval(rotateImages, 6000)

    return () => {
      clearInterval(interval)
    }
  }, [isPaused, backgroundImages.length, backgroundImages, imagePositions])

  // 切换到指定图片
  const goToImage = (index) => {
    if (index < 0 || index >= backgroundImages.length) return
    
    setCurrentImageIndex(index)
    currentIndexRef.current = index
    // 更新新图片的位置
    const targetImageUrl = backgroundImages[index]
    const targetPosition = imagePositions[targetImageUrl] || { x: 50, y: 50 }
    setImageOffsetX(targetPosition.x)
    setImageOffsetY(targetPosition.y)
  }

  // 鼠标进入时暂停轮换
  const handleMouseEnter = () => {
    setIsHovered(true)
    setIsPaused(true)
  }

  // 鼠标离开时恢复轮换
  const handleMouseLeave = () => {
    setIsHovered(false)
    setIsPaused(false)
  }

  // 计算天数并实时更新
  useEffect(() => {
    const calculateTime = () => {
      const now = new Date()
      const diff = now.getTime() - anniversaryDate.getTime()
      
      // 计算总天数（向下取整）
      const totalDays = Math.floor(diff / (1000 * 60 * 60 * 24))
      
      setDays(totalDays)
    }

    // 立即计算一次
    calculateTime()

    // 每分钟更新一次（确保实时显示）
    const interval = setInterval(calculateTime, 60000)

    return () => {
      clearInterval(interval)
    }
  }, [])

  return (
    <div className="flex justify-center w-full py-8 px-4 sm:px-6">
      <div className="w-full sm:w-[550px] mx-auto group">
        <div 
          className="bg-white bg-opacity-80 border-2 border-black rounded-3xl overflow-hidden transition-all duration-300 h-[360px] sm:h-[400px] relative group-hover:shadow-[0_0_20px_white] my-4"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* 背景图片区域 - 占满整个卡片 */}
          <div className="relative h-full w-full overflow-hidden">
            {/* 背景图片 - hover 时自动轮换 */}
            {backgroundImages.length > 0 && currentImageIndex < backgroundImages.length ? (
              <>
                {/* 预渲染所有图片，通过 opacity 控制显隐实现无缝切换 */}
                {backgroundImages.map((imgSrc, index) => {
                  const position = imagePositions[imgSrc] || { x: 50, y: 50 }
                  return (
                    <motion.div
                      key={imgSrc}
                      initial={false}
                      animate={{ opacity: index === currentImageIndex ? 1 : 0 }}
                      transition={{
                        duration: 1.5,
                        ease: [0.25, 0.46, 0.45, 0.94]
                      }}
                      className="absolute inset-0"
                      style={{ zIndex: index === currentImageIndex ? 1 : 0 }}
                    >
                      <Image
                        src={imgSrc}
                        alt="Anniversary background"
                        fill
                        className="object-cover"
                        style={{
                          objectPosition: `${position.x}% ${position.y}%`,
                          filter: 'blur(4px)',
                        }}
                        unoptimized={imgSrc.startsWith('/api/file/') || imgSrc.startsWith('https://')}
                        priority={index === 0}
                      />
                    </motion.div>
                  )
                })}
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-pink-500/30 via-red-500/30 to-purple-500/30"></div>
            )}
            
            {/* 渐变遮罩 */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-[2]"></div>
            
            {/* 标题和天数 - 放在中间偏下 */}
            <div className="absolute bottom-16 sm:bottom-20 left-0 right-0 flex flex-col items-center z-[3]">
              {/* 标题 */}
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-pink-400 fill-pink-400 animate-pulse" />
                <h2 className="text-xl sm:text-2xl font-bold text-white drop-shadow-lg">With You</h2>
                <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-pink-400 fill-pink-400 animate-pulse" />
              </div>
              
              {/* 天数显示 */}
              <div className="flex flex-col items-center gap-1 sm:gap-2">
                <span className="text-5xl sm:text-4xl font-semibold text-white drop-shadow-lg">{days}</span>
                <span className="text-lg sm:text-xl font-semibold text-pink-100 drop-shadow-md">days</span>
              </div>
            </div>
            
            {/* 开始日期和装饰线 - 绝对定位在图片最底部 */}
            <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col justify-center z-[3]">
              <div className="text-center mb-2">
                {/* 开始日期 */}
                <div className="text-xs sm:text-sm text-white/80 drop-shadow-md">
                  Since May 20, 2023 💕
                </div>
              </div>
              
              {/* 底部装饰线 */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-gradient-to-r from-white/30 to-transparent"></div>
                <div className="w-1 h-1 bg-pink-400 rounded-full"></div>
                <div className="flex-1 h-px bg-gradient-to-l from-white/30 to-transparent"></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 指示器点 - 放在组件下方 */}
        {backgroundImages.length > 1 && (
          <div className="flex justify-center gap-0.5 mt-4 px-4">
            {backgroundImages.map((_, index) => (
              <button
                key={index}
                onClick={() => goToImage(index)}
                aria-label={`跳转到第${index + 1}张图片`}
                className="p-1 rounded-full transition-all duration-300 flex items-center justify-center hover:bg-gray-100"
              >
                <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentImageIndex 
                    ? 'bg-pink-400 scale-125' 
                    : 'bg-gray-400 hover:bg-gray-500'
                }`} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AnniversaryCounter

