'use client'

import { useState, useEffect, useRef } from 'react'

export default function ImagePositionControls({
  imageOffsetX,
  imageOffsetY,
  selectedImageIndex,
  totalImages,
  onPositionChange,
}) {
  // 本地状态用于拖动时的即时显示
  const [localX, setLocalX] = useState(imageOffsetX)
  const [localY, setLocalY] = useState(imageOffsetY)
  const isDraggingRef = useRef(false)
  const updateTimerRef = useRef(null)

  // 当外部值变化时同步本地状态（但不影响拖动中）
  useEffect(() => {
    if (!isDraggingRef.current) {
      setLocalX(imageOffsetX)
      setLocalY(imageOffsetY)
    }
  }, [imageOffsetX, imageOffsetY])

  // 处理拖动中的更新（只更新本地显示，不调用 API）
  const handleInput = (axis, value) => {
    isDraggingRef.current = true
    const numValue = parseFloat(value)
    
    if (axis === 'x') {
      setLocalX(numValue)
    } else {
      setLocalY(numValue)
    }
  }

  // 处理拖动结束（调用 API 更新）
  const handleChange = (axis, value) => {
    const numValue = parseFloat(value)
    
    // 清除之前的定时器
    if (updateTimerRef.current) {
      clearTimeout(updateTimerRef.current)
    }

    // 延迟更新，确保拖动完全结束
    updateTimerRef.current = setTimeout(() => {
      isDraggingRef.current = false
      if (axis === 'x') {
        onPositionChange(numValue, localY)
      } else {
        onPositionChange(localX, numValue)
      }
    }, 100)
  }

  // 清理定时器
  useEffect(() => {
    return () => {
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current)
      }
    }
  }, [])

  return (
    <div className="mt-4 space-y-3">
      <div className="mb-2">
        <p className="text-sm text-gray-400">
          调整位置 (当前预览: Image {selectedImageIndex + 1} / {totalImages})
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Horizontal Position: {localX.toFixed(1)}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={localX}
          onInput={(e) => handleInput('x', e.target.value)}
          onChange={(e) => handleChange('x', e.target.value)}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Vertical Position: {localY.toFixed(1)}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={localY}
          onInput={(e) => handleInput('y', e.target.value)}
          onChange={(e) => handleChange('y', e.target.value)}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>
    </div>
  )
}

