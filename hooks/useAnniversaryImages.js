import { useState, useEffect, useRef } from 'react'
import { useToast } from '@/hooks/use-toast'

export const useAnniversaryImages = () => {
  const [backgroundImages, setBackgroundImages] = useState([])
  const [imagePositions, setImagePositions] = useState({})
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [imageOffsetX, setImageOffsetX] = useState(50)
  const [imageOffsetY, setImageOffsetY] = useState(50)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadKey, setUploadKey] = useState(0)
  const positionUpdateTimerRef = useRef(null)
  const { toast } = useToast()

  // 获取当前背景图列表和位置
  useEffect(() => {
    const fetchBackground = async () => {
      try {
        const response = await fetch('/api/anniversary/background')
        if (response.ok) {
          const data = await response.json()
          const images = Array.isArray(data.backgroundImages) ? data.backgroundImages : []
          const positions = data.imagePositions || {}
          setBackgroundImages(images)
          setImagePositions(positions)
          
          // 如果有图片，确保选中的索引有效，并加载选中图片的位置
          if (images.length > 0) {
            if (selectedImageIndex >= images.length) {
              setSelectedImageIndex(0)
            }
            // 加载当前选中图片的位置
            const currentImageUrl = images[selectedImageIndex]
            const currentPosition = positions[currentImageUrl] || { x: 50, y: 50 }
            setImageOffsetX(currentPosition.x)
            setImageOffsetY(currentPosition.y)
          }
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load background images",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    fetchBackground()
  }, [toast])

  // 当选择不同图片时，加载该图片的位置
  useEffect(() => {
    if (backgroundImages.length > 0 && selectedImageIndex < backgroundImages.length) {
      const currentImageUrl = backgroundImages[selectedImageIndex]
      const currentPosition = imagePositions[currentImageUrl] || { x: 50, y: 50 }
      setImageOffsetX(currentPosition.x)
      setImageOffsetY(currentPosition.y)
    }
  }, [selectedImageIndex, backgroundImages, imagePositions])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (positionUpdateTimerRef.current) {
        clearTimeout(positionUpdateTimerRef.current)
      }
    }
  }, [])

  return {
    backgroundImages,
    setBackgroundImages,
    imagePositions,
    setImagePositions,
    selectedImageIndex,
    setSelectedImageIndex,
    imageOffsetX,
    setImageOffsetX,
    imageOffsetY,
    setImageOffsetY,
    loading,
    uploading,
    setUploading,
    uploadKey,
    setUploadKey,
    positionUpdateTimerRef,
    toast,
  }
}

