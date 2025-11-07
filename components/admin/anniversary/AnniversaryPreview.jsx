'use client'

import Image from 'next/image'
import { Heart } from 'lucide-react'
import { useMemo } from 'react'

export default function AnniversaryPreview({ 
  imageUrl, 
  imageOffsetX, 
  imageOffsetY 
}) {
  // 计算天数
  const days = useMemo(() => {
    const anniversaryDate = new Date('2023-05-20T00:00:00')
    const now = new Date()
    const diff = now.getTime() - anniversaryDate.getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24))
  }, [])

  return (
    <div className="flex justify-center w-full">
      <div className="w-full sm:w-[550px] mx-auto group">
        <div className="bg-white bg-opacity-80 border-2 border-black rounded-3xl overflow-hidden transition-all duration-300 h-[360px] sm:h-[400px] relative group-hover:shadow-[0_0_20px_white] my-4">
          {/* 背景图片区域 - 占满整个卡片 */}
          <div className="relative h-full w-full overflow-hidden">
            {/* 背景图片 */}
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt="Anniversary background"
                fill
                className="object-cover"
                style={{
                  objectPosition: `${imageOffsetX}% ${imageOffsetY}%`,
                  filter: 'blur(4px)',
                }}
                unoptimized={imageUrl.startsWith('/api/file/') || imageUrl.startsWith('https://')}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-pink-500/30 via-red-500/30 to-purple-500/30"></div>
            )}
            
            {/* 渐变遮罩 */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
            
            {/* 标题和天数 - 放在中间偏下 */}
            <div className="absolute bottom-16 sm:bottom-20 left-0 right-0 flex flex-col items-center z-10">
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
            <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col justify-center z-5">
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
      </div>
    </div>
  )
}

