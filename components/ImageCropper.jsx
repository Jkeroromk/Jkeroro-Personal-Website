'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ImageCropper = ({ 
  imageSrc, 
  onCrop, 
  onCancel, 
  isVisible 
}) => {
  console.log('ImageCropper received imageSrc:', imageSrc)
  const [cropData, setCropData] = useState({
    x: 25,
    y: 25,
    width: 50,
    height: 23.3, // 锁定为carousel比例 (550×256px = 2.15:1)
    scale: 1,
    offsetX: 0,
    offsetY: 0
  })
  
  
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState(null)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const containerRef = useRef(null)

  const handleCropStart = (e) => {
    e.preventDefault()
    setIsDragging(true)
    const rect = containerRef.current.getBoundingClientRect()
    const currentX = (cropData.x / 100) * rect.width
    const currentY = (cropData.y / 100) * rect.height
    setDragStart({
      x: e.clientX - currentX,
      y: e.clientY - currentY
    })
  }

  const handleResizeStart = (e, handle) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    setResizeHandle(handle)
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      width: cropData.width,
      height: cropData.height,
      x: cropData.x,
      y: cropData.y
    })
  }

  const handleMouseMove = (e) => {
    if (isDragging) {
      const rect = containerRef.current.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      const newX = Math.max(0, Math.min(100 - cropData.width, (mouseX / rect.width) * 100))
      const newY = Math.max(0, Math.min(100 - cropData.height, (mouseY / rect.height) * 100))
      setCropData(prev => ({ ...prev, x: newX, y: newY }))
    } else if (isResizing && resizeHandle) {
      const rect = containerRef.current.getBoundingClientRect()
      const deltaX = (e.clientX - dragStart.x) / rect.width * 100
      const deltaY = (e.clientY - dragStart.y) / rect.height * 100
      
      let newData = { ...cropData }
      const carouselRatio = 256 / 550 // 锁定carousel比例
      
      switch (resizeHandle) {
        case 'nw': // 左上角
          newData.x = Math.max(0, dragStart.x + deltaX)
          newData.y = Math.max(0, dragStart.y + deltaY)
          newData.width = Math.max(10, dragStart.width - deltaX)
          newData.height = newData.width * carouselRatio // 保持比例
          break
        case 'ne': // 右上角
          newData.y = Math.max(0, dragStart.y + deltaY)
          newData.width = Math.max(10, dragStart.width + deltaX)
          newData.height = newData.width * carouselRatio // 保持比例
          break
        case 'sw': // 左下角
          newData.x = Math.max(0, dragStart.x + deltaX)
          newData.width = Math.max(10, dragStart.width - deltaX)
          newData.height = newData.width * carouselRatio // 保持比例
          break
        case 'se': // 右下角
          newData.width = Math.max(10, dragStart.width + deltaX)
          newData.height = newData.width * carouselRatio // 保持比例
          break
      }
      
      // 确保不超出边界
      if (newData.x + newData.width > 100) {
        newData.width = 100 - newData.x
        newData.height = newData.width * carouselRatio
      }
      if (newData.y + newData.height > 100) {
        newData.height = 100 - newData.y
        newData.width = newData.height / carouselRatio
      }
      
      setCropData(newData)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setIsResizing(false)
    setResizeHandle(null)
  }

  const handleReset = () => {
    setCropData({
      x: 25,
      y: 25,
      width: 50,
      height: 23.3, // 锁定为carousel比例
      scale: 1,
      offsetX: 0,
      offsetY: 0
    })
  }

  const handleConfirm = () => {
    onCrop(cropData)
  }

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, isResizing, dragStart, cropData, resizeHandle])

  if (!isVisible) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gray-900 rounded-lg p-6 w-full max-w-4xl border border-gray-700"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Crop Image</h2>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-gray-300 hover:text-white"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-gray-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* 裁剪区域 */}
          <div className="w-full">
            <div 
              ref={containerRef}
              className="relative w-full bg-gray-800 rounded border border-gray-600 overflow-hidden"
              style={{ aspectRatio: '550/256' }} // 匹配carousel移动端比例，桌面端会自动调整
            >
              {imageSrc ? (
                <img 
                  src={imageSrc} 
                  alt="Crop Preview"
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => {
                    console.error('Image failed to load:', imageSrc)
                    e.target.style.display = 'none'
                  }}
                  onLoad={() => {
                    console.log('Image loaded successfully:', imageSrc)
                  }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                  <div className="text-center text-gray-400">
                    <p className="text-lg font-medium">No Image Selected</p>
                    <p className="text-sm">Please select an image to crop</p>
                  </div>
                </div>
              )}
              
              {/* 裁剪框 */}
              <div 
                className="absolute border-2 border-blue-500 bg-blue-500/20 cursor-move"
                style={{
                  left: `${cropData.x}%`,
                  top: `${cropData.y}%`,
                  width: `${cropData.width}%`,
                  height: `${cropData.height}%`
                }}
                onMouseDown={handleCropStart}
              >
                {/* 四个角的调整控制点 */}
                <div 
                  className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 border border-white cursor-nw-resize"
                  onMouseDown={(e) => handleResizeStart(e, 'nw')}
                />
                <div 
                  className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border border-white cursor-ne-resize"
                  onMouseDown={(e) => handleResizeStart(e, 'ne')}
                />
                <div 
                  className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 border border-white cursor-sw-resize"
                  onMouseDown={(e) => handleResizeStart(e, 'sw')}
                />
                <div 
                  className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border border-white cursor-se-resize"
                  onMouseDown={(e) => handleResizeStart(e, 'se')}
                />
              </div>
            </div>
          </div>

          {/* 控制面板 */}
          <div className="w-full space-y-4">
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Crop Size: {Math.round(cropData.width)}%
              </label>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={cropData.width}
                onChange={(e) => {
                  const newWidth = parseInt(e.target.value)
                  const carouselRatio = 256 / 550
                  setCropData(prev => ({ 
                    ...prev, 
                    width: newWidth,
                    height: newWidth * carouselRatio
                  }))
                }}
                className="w-full"
              />
              <p className="text-xs text-gray-400 mt-1">
                Size locked to carousel ratio (550×256px)
              </p>
            </div>

            <div className="pt-4 border-t border-gray-700">
              <div className="flex gap-2">
                <Button
                  onClick={handleConfirm}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Confirm Crop
                </Button>
                <Button
                  variant="outline"
                  onClick={onCancel}
                  className="flex-1 border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default ImageCropper
