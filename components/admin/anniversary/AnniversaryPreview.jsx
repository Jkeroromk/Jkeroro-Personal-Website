import Image from 'next/image'
import { Heart } from 'lucide-react'

export default function AnniversaryPreview({ 
  imageUrl, 
  imageOffsetX, 
  imageOffsetY 
}) {
  return (
    <div className="flex justify-center w-full">
      <div className="w-full sm:w-[550px] mx-auto group">
        <div className="bg-white bg-opacity-80 border-2 border-black rounded-3xl overflow-hidden transition-all duration-300 h-[360px] sm:h-[400px] flex flex-col relative group-hover:shadow-[0_0_20px_white] my-4">
          {/* 顶部装饰区域 - 背景图片 */}
          <div className="relative h-[320px] sm:h-[360px] overflow-hidden">
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
            
            {/* 标题和天数 - 放在正下方中间 */}
            <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center z-10 pb-6 sm:pb-8">
              {/* 标题 */}
              <div className="flex items-center gap-2 mb-2 sm:mb-3 mr-11">
                <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-pink-400 fill-pink-400 animate-pulse" />
                <h2 className="text-xl sm:text-2xl font-bold text-white drop-shadow-lg">With You</h2>
                <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-pink-400 fill-pink-400 animate-pulse" />
              </div>
              
              {/* 天数显示 */}
              <div className="flex items-baseline justify-center gap-2 sm:gap-3">
                <span className="text-5xl sm:text-4xl font-semibold text-white drop-shadow-lg">XXX</span>
                <span className="text-lg sm:text-xl font-semibold text-pink-100 drop-shadow-md">days</span>
              </div>
            </div>
          </div>
          
          {/* 文字内容区域 */}
          <div className="p-1.5 flex flex-col justify-center bg-white">
            <div className="text-center">
              <div className="text-xs sm:text-sm text-gray-600">
                Since May 20, 2023 💕
              </div>
            </div>
            
            {/* 底部装饰线 */}
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex-1 h-px bg-gradient-to-r from-black/30 to-transparent"></div>
              <div className="w-1 h-1 bg-pink-400 rounded-full"></div>
              <div className="flex-1 h-px bg-gradient-to-l from-black/30 to-transparent"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

