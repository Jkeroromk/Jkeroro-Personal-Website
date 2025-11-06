import { useCallback } from 'react'
import { anniversaryApi } from '@/lib/api/anniversaryApi'

export const useImagePosition = ({
  backgroundImages,
  selectedImageIndex,
  imagePositions,
  setImagePositions,
  setImageOffsetX,
  setImageOffsetY,
  positionUpdateTimerRef,
  toast,
}) => {
  const handlePositionUpdate = useCallback(async (x, y) => {
    // 清除之前的定时器
    if (positionUpdateTimerRef.current) {
      clearTimeout(positionUpdateTimerRef.current)
    }

    // 设置新的定时器，500ms 后执行更新
    positionUpdateTimerRef.current = setTimeout(async () => {
      if (backgroundImages.length === 0 || selectedImageIndex >= backgroundImages.length) {
        return
      }

      const currentImageUrl = backgroundImages[selectedImageIndex]
      
      try {
        const data = await anniversaryApi.updatePosition(currentImageUrl, x, y)
        
        // 更新位置数据
        if (data.imagePositions) {
          setImagePositions(data.imagePositions)
          // 更新当前选中图片的位置显示
          const currentImageUrl = backgroundImages[selectedImageIndex]
          const currentPosition = data.imagePositions[currentImageUrl] || { x: 50, y: 50 }
          setImageOffsetX(currentPosition.x)
          setImageOffsetY(currentPosition.y)
        }
      } catch (error) {
        console.error('Position update error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        
        // 如果是数据库列不存在的错误，显示友好提示
        if (errorMessage.includes('column') || errorMessage.includes('does not exist') || errorMessage.includes('image_offset')) {
          toast({
            title: "Database Migration Required",
            description: "Please run the SQL migration to add position columns. Check scripts/add-image-positions-column.sql",
            variant: "destructive",
          })
          return
        }
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      }
    }, 500)
  }, [backgroundImages, selectedImageIndex, imagePositions, setImagePositions, setImageOffsetX, setImageOffsetY, positionUpdateTimerRef, toast])

  return { handlePositionUpdate }
}

