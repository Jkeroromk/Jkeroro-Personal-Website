'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, RotateCcw, ZoomIn, ZoomOut, Move } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ImageCropper = ({ 
  imageSrc, 
  onCrop, 
  onCancel, 
  isVisible 
}) => {
  console.log('ImageCropper received imageSrc:', imageSrc)
  
  // 简化的状态管理
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 })
  const [imageLoaded, setImageLoaded] = useState(false)
  
  // 引用
  const containerRef = useRef(null)
  const imageRef = useRef(null)

  // 处理图片拖拽开始
  const handleImageDragStart = (e) => {
    e.preventDefault()
    setIsDragging(true)
    setDragStart({
      x: e.clientX - imageOffset.x,
      y: e.clientY - imageOffset.y
    })
  }

  // 处理图片拖拽移动
  const handleImageDragMove = (e) => {
    if (!isDragging) return
    
    const newOffsetX = e.clientX - dragStart.x
    const newOffsetY = e.clientY - dragStart.y
    
    // 限制移动范围，防止图片移出容器太远
    const maxOffset = 200 // 增加最大偏移量
    const clampedX = Math.max(-maxOffset, Math.min(maxOffset, newOffsetX))
    const clampedY = Math.max(-maxOffset, Math.min(maxOffset, newOffsetY))
    
    setImageOffset({ x: clampedX, y: clampedY })
  }

  const handleMouseMove = (e) => {
    if (isDragging) {
      handleImageDragMove(e)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // 重置设置
  const handleReset = () => {
    setZoom(1)
    setImageOffset({ x: 0, y: 0 })
  }

  // 缩放控制
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 3))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.5))
  }

  const handleConfirm = () => {
    // 计算背景位置百分比
    // 将像素偏移转换为百分比位置
    const containerWidth = 550 // 容器宽度
    const containerHeight = 384 // 容器高度
    
    // 计算背景位置百分比 (50% 是中心，偏移量影响位置)
    const backgroundX = 50 + (imageOffset.x / containerWidth) * 100
    const backgroundY = 50 + (imageOffset.y / containerHeight) * 100
    
    // 返回图片位置信息
    const result = {
      x: Math.max(0, Math.min(100, backgroundX)), // 限制在 0-100% 范围内
      y: Math.max(0, Math.min(100, backgroundY)),
      width: 100, // 使用完整图片
      height: 100,
      cropX: Math.max(0, Math.min(100, backgroundX)), // 为了兼容性
      cropY: Math.max(0, Math.min(100, backgroundY)),
      cropSize: 100, // 使用完整图片尺寸
      imageOffsetX: imageOffset.x,
      imageOffsetY: imageOffset.y,
      scale: zoom
    }
    onCrop(result)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragStart, imageOffset])

  if (!isVisible) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gray-900 rounded-xl p-6 w-full max-w-4xl border border-gray-700 shadow-2xl"
      >
        {/* 头部 */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">图片调整</h2>
            <p className="text-sm text-gray-400">拖拽移动图片，调整显示位置</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-gray-300 hover:text-white hover:bg-gray-800"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              重置
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-gray-300 hover:text-white hover:bg-gray-800"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 主图片区域 */}
          <div className="lg:col-span-3">
            <div className="bg-gray-800 rounded-lg p-4">
              {/* 工具栏 */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Move className="w-5 h-5 text-blue-400" />
                  <span className="text-white font-medium">移动模式</span>
                  <span className="text-xs text-gray-400">拖拽图片调整位置</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleZoomOut}
                    className="text-gray-300 hover:text-white"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-gray-300 min-w-[3rem] text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleZoomIn}
                    className="text-gray-300 hover:text-white"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* 图片显示区域 */}
              <div 
                ref={containerRef}
                className="relative w-full bg-gray-700 rounded border border-gray-600 overflow-hidden mx-auto"
                style={{ 
                  aspectRatio: '550/384',
                  maxHeight: '500px',
                  transform: `scale(${zoom})`,
                  transformOrigin: 'center'
                }}
              >
                {imageSrc && imageSrc.trim() !== '' ? (
                  <img 
                    ref={imageRef}
                    src={imageSrc} 
                    alt="Image Preview"
                    className={`absolute inset-0 w-full h-full object-contain transition-transform duration-200 ${
                      isDragging ? 'cursor-grabbing scale-105' : 'cursor-grab'
                    }`}
                    style={{
                      transform: `translate(${imageOffset.x}px, ${imageOffset.y}px)`,
                      userSelect: 'none',
                      filter: isDragging ? 'brightness(1.1)' : 'none'
                    }}
                    onError={(e) => {
                      console.error('Image failed to load:', imageSrc)
                      e.target.style.display = 'none'
                    }}
                    onLoad={() => {
                      console.log('Image loaded successfully:', imageSrc)
                      setImageLoaded(true)
                    }}
                    onMouseDown={handleImageDragStart}
                    draggable={false}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-600">
                    <div className="text-center text-gray-400">
                      <p className="text-lg font-medium">未选择图片</p>
                      <p className="text-sm">请先选择要调整的图片</p>
                    </div>
                  </div>
                )}
                
                {/* 移动提示 - 移到右下角避免遮挡 */}
                {imageLoaded && (imageOffset.x === 0 && imageOffset.y === 0) && !isDragging && (
                  <div className="absolute bottom-4 right-4 bg-blue-500/20 backdrop-blur-sm rounded px-3 py-2">
                    <div className="flex items-center gap-2 text-blue-300 text-sm">
                      <Move className="w-4 h-4" />
                      <span>拖拽图片移动位置</span>
                    </div>
                  </div>
                )}
                
                {/* 拖拽状态指示器 */}
                {isDragging && (
                  <div className="absolute top-4 left-4 bg-green-500/20 backdrop-blur-sm rounded px-3 py-2">
                    <div className="flex items-center gap-2 text-green-300 text-sm">
                      <Move className="w-4 h-4 animate-pulse" />
                      <span>正在拖拽...</span>
                    </div>
                  </div>
                )}
                
                {/* 实时预览区域指示器 */}
                {imageLoaded && (
                  <div className="absolute inset-0 pointer-events-none">
                    {/* 预览区域边框 */}
                    <div className="absolute inset-0 border-2 border-yellow-400 border-dashed opacity-60"></div>
                    
                    {/* 预览区域标签 */}
                    <div className="absolute top-2 right-2 bg-yellow-400/20 backdrop-blur-sm rounded px-2 py-1">
                      <div className="text-xs text-yellow-300 font-medium">
                        预览区域
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 控制面板 */}
          <div className="space-y-4">
            {/* 位置信息 */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">位置信息</h3>
              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex justify-between">
                  <span>X 偏移:</span>
                  <span>{Math.round(imageOffset.x)}px</span>
                </div>
                <div className="flex justify-between">
                  <span>Y 偏移:</span>
                  <span>{Math.round(imageOffset.y)}px</span>
                </div>
                <div className="flex justify-between">
                  <span>缩放:</span>
                  <span>{Math.round(zoom * 100)}%</span>
                </div>
              </div>
            </div>

            {/* 预览信息 */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">预览效果</h3>
              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex justify-between">
                  <span>背景位置 X:</span>
                  <span>{Math.round(50 + (imageOffset.x / 550) * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>背景位置 Y:</span>
                  <span>{Math.round(50 + (imageOffset.y / 384) * 100)}%</span>
                </div>
                <div className="text-xs text-gray-400 mt-2 p-2 bg-gray-700 rounded">
                  黄色虚线框显示预览区域
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="space-y-3">
              <Button
                onClick={handleConfirm}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3"
              >
                确认调整
              </Button>
              
              {(imageOffset.x !== 0 || imageOffset.y !== 0) && (
                <Button
                  variant="outline"
                  onClick={() => setImageOffset({ x: 0, y: 0 })}
                  className="w-full border-yellow-600 text-yellow-400 hover:bg-yellow-600 hover:text-white"
                >
                  重置位置
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={onCancel}
                className="w-full border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
              >
                取消
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default ImageCropper
