'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Move, RotateCcw } from 'lucide-react'

export default function ImagePositionControls({
  imageOffsetX,
  imageOffsetY,
  selectedImageIndex,
  totalImages,
  onPositionChange,
  onPositionPreview,
}) {
  const [localX, setLocalX] = useState(imageOffsetX)
  const [localY, setLocalY] = useState(imageOffsetY)
  const isDraggingRef = useRef(false)
  const latestPosRef = useRef({ x: imageOffsetX, y: imageOffsetY })
  const pickerRef = useRef(null)

  useEffect(() => {
    if (!isDraggingRef.current) {
      setLocalX(imageOffsetX)
      setLocalY(imageOffsetY)
      latestPosRef.current = { x: imageOffsetX, y: imageOffsetY }
    }
  }, [imageOffsetX, imageOffsetY])

  const getPositionFromEvent = useCallback((e, rect) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    const x = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100))
    const y = Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100))
    return { x, y }
  }, [])

  const handlePickerDown = useCallback((e) => {
    e.preventDefault()
    isDraggingRef.current = true
    const rect = pickerRef.current.getBoundingClientRect()

    const applyPos = (event) => {
      const { x, y } = getPositionFromEvent(event, rect)
      setLocalX(x)
      setLocalY(y)
      latestPosRef.current = { x, y }
      onPositionPreview?.(x, y)
    }

    applyPos(e)

    const handleMove = (moveEvent) => {
      if (!isDraggingRef.current) return
      applyPos(moveEvent)
    }

    const handleUp = () => {
      isDraggingRef.current = false
      onPositionChange(latestPosRef.current.x, latestPosRef.current.y)
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('touchmove', handleMove)
      window.removeEventListener('mouseup', handleUp)
      window.removeEventListener('touchend', handleUp)
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('touchmove', handleMove, { passive: false })
    window.addEventListener('mouseup', handleUp)
    window.addEventListener('touchend', handleUp)
  }, [getPositionFromEvent, onPositionChange])

  const nudge = (axis, delta) => {
    const newX = axis === 'x' ? Math.min(100, Math.max(0, localX + delta)) : localX
    const newY = axis === 'y' ? Math.min(100, Math.max(0, localY + delta)) : localY
    setLocalX(newX)
    setLocalY(newY)
    latestPosRef.current = { x: newX, y: newY }
    onPositionPreview?.(newX, newY)
    onPositionChange(newX, newY)
  }

  const resetCenter = () => {
    setLocalX(50)
    setLocalY(50)
    latestPosRef.current = { x: 50, y: 50 }
    onPositionPreview?.(50, 50)
    onPositionChange(50, 50)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Move className="w-4 h-4 text-pink-400" />
          <span className="text-sm font-medium text-white">
            Focal Point
            <span className="text-gray-400 font-normal ml-1.5">
              — Image {selectedImageIndex + 1} / {totalImages}
            </span>
          </span>
        </div>
        <button
          onClick={resetCenter}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          Center
        </button>
      </div>

      {/* 2D Focal Point Picker */}
      <div>
        <div
          ref={pickerRef}
          onMouseDown={handlePickerDown}
          onTouchStart={handlePickerDown}
          className="relative w-full h-36 bg-gray-700/60 rounded-xl overflow-hidden select-none border border-gray-600 hover:border-gray-500 transition-colors"
          style={{ cursor: 'crosshair', touchAction: 'none' }}
        >
          {/* Rule-of-thirds grid */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/10"></div>
            <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/10"></div>
            <div className="absolute top-1/3 left-0 right-0 h-px bg-white/10"></div>
            <div className="absolute top-2/3 left-0 right-0 h-px bg-white/10"></div>
            {/* Center crosshair */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/5"></div>
            <div className="absolute top-1/2 left-0 right-0 h-px bg-white/5"></div>
          </div>

          {/* Corner labels */}
          <span className="absolute top-1.5 left-2 text-[9px] text-gray-600 pointer-events-none select-none">TL</span>
          <span className="absolute top-1.5 right-2 text-[9px] text-gray-600 pointer-events-none select-none">TR</span>
          <span className="absolute bottom-1.5 left-2 text-[9px] text-gray-600 pointer-events-none select-none">BL</span>
          <span className="absolute bottom-1.5 right-2 text-[9px] text-gray-600 pointer-events-none select-none">BR</span>

          {/* Focal point indicator */}
          <div
            className="absolute pointer-events-none"
            style={{
              left: `${localX}%`,
              top: `${localY}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Crosshair lines */}
            <div className="absolute top-1/2 w-8 h-px bg-white/50" style={{ left: '-1rem' }}></div>
            <div className="absolute left-1/2 h-8 w-px bg-white/50" style={{ top: '-1rem' }}></div>
            {/* Outer ring */}
            <div className="w-5 h-5 rounded-full border-2 border-white shadow-lg shadow-black/50 flex items-center justify-center">
              {/* Inner dot */}
              <div className="w-2 h-2 rounded-full bg-pink-400"></div>
            </div>
          </div>
        </div>
        <p className="text-center text-[11px] text-gray-600 mt-1.5">Click or drag to set focal point</p>
      </div>

      {/* Sliders with nudge buttons */}
      <div className="grid grid-cols-2 gap-3">
        {/* Horizontal */}
        <div className="bg-gray-700/40 rounded-xl p-3 space-y-2.5 border border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Horizontal</span>
            <span className="text-xs font-mono text-pink-300 tabular-nums">{localX.toFixed(1)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={localX}
            onInput={(e) => {
              isDraggingRef.current = true
              const v = parseFloat(e.target.value)
              setLocalX(v)
              latestPosRef.current.x = v
              onPositionPreview?.(v, latestPosRef.current.y)
            }}
            onChange={(e) => {
              isDraggingRef.current = false
              onPositionChange(parseFloat(e.target.value), localY)
            }}
            className="w-full h-1.5 rounded appearance-none bg-gray-600 accent-pink-400"
          />
          <div className="flex justify-between gap-1">
            <button
              onClick={() => nudge('x', -10)}
              className="flex-1 py-1 text-[11px] text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
            >
              ◀◀
            </button>
            <button
              onClick={() => nudge('x', -1)}
              className="flex-1 py-1 text-[11px] text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
            >
              ◀
            </button>
            <button
              onClick={() => nudge('x', 1)}
              className="flex-1 py-1 text-[11px] text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
            >
              ▶
            </button>
            <button
              onClick={() => nudge('x', 10)}
              className="flex-1 py-1 text-[11px] text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
            >
              ▶▶
            </button>
          </div>
        </div>

        {/* Vertical */}
        <div className="bg-gray-700/40 rounded-xl p-3 space-y-2.5 border border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Vertical</span>
            <span className="text-xs font-mono text-pink-300 tabular-nums">{localY.toFixed(1)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={localY}
            onInput={(e) => {
              isDraggingRef.current = true
              const v = parseFloat(e.target.value)
              setLocalY(v)
              latestPosRef.current.y = v
              onPositionPreview?.(latestPosRef.current.x, v)
            }}
            onChange={(e) => {
              isDraggingRef.current = false
              onPositionChange(localX, parseFloat(e.target.value))
            }}
            className="w-full h-1.5 rounded appearance-none bg-gray-600 accent-pink-400"
          />
          <div className="flex justify-between gap-1">
            <button
              onClick={() => nudge('y', -10)}
              className="flex-1 py-1 text-[11px] text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
            >
              ▲▲
            </button>
            <button
              onClick={() => nudge('y', -1)}
              className="flex-1 py-1 text-[11px] text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
            >
              ▲
            </button>
            <button
              onClick={() => nudge('y', 1)}
              className="flex-1 py-1 text-[11px] text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
            >
              ▼
            </button>
            <button
              onClick={() => nudge('y', 10)}
              className="flex-1 py-1 text-[11px] text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
            >
              ▼▼
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
