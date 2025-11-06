'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Heart } from 'lucide-react'
import { useAnniversaryImages } from '@/hooks/useAnniversaryImages'
import { useImagePosition } from '@/hooks/useImagePosition'
import { anniversaryApi } from '@/lib/api/anniversaryApi'
import AnniversaryPreview from './anniversary/AnniversaryPreview'
import ImagePositionControls from './anniversary/ImagePositionControls'
import ImageList from './anniversary/ImageList'
import ImageUploadSection from './anniversary/ImageUploadSection'

const AnniversaryTab = () => {
  const {
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
  } = useAnniversaryImages()

  const { handlePositionUpdate } = useImagePosition({
    backgroundImages,
    selectedImageIndex,
    imagePositions,
    setImagePositions,
    setImageOffsetX,
    setImageOffsetY,
    positionUpdateTimerRef,
    toast,
  })

  // 处理文件上传
  const handleFileSelect = async (file, filePath) => {
    if (!filePath) {
      toast({
        title: "Upload Error",
        description: "File uploaded but no path returned. Check console for details.",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    try {
      const data = await anniversaryApi.addBackground(filePath)
      
      setBackgroundImages(data.backgroundImages)
      setImagePositions(data.imagePositions)
      
      // 自动选中新上传的图片（最后一张）
      if (data.backgroundImages.length > 0) {
        const newIndex = data.backgroundImages.length - 1
        setSelectedImageIndex(newIndex)
        // 加载新图片的位置
        const newImageUrl = data.backgroundImages[newIndex]
        const newPosition = data.imagePositions[newImageUrl] || { x: 50, y: 50 }
        setImageOffsetX(newPosition.x)
        setImageOffsetY(newPosition.y)
      }
      
      toast({
        title: "Success",
        description: "Background image added successfully",
      })
      
      // 重置上传组件，清空已选择的文件
      setUploadKey(prev => prev + 1)
    } catch (error) {
      console.error('Update error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update background image",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  // 删除单张背景图
  const handleDeleteImage = async (imageUrl) => {
    setUploading(true)
    try {
      const data = await anniversaryApi.deleteBackground(imageUrl)
      
      setBackgroundImages(data.backgroundImages)
      setImagePositions(data.imagePositions)
      
      // 如果删除的是当前选中的图片，调整选中索引
      if (data.backgroundImages.length === 0) {
        setSelectedImageIndex(0)
        setImageOffsetX(50)
        setImageOffsetY(50)
      } else if (selectedImageIndex >= data.backgroundImages.length) {
        const newIndex = data.backgroundImages.length - 1
        setSelectedImageIndex(newIndex)
        // 加载新选中图片的位置
        const newImageUrl = data.backgroundImages[newIndex]
        const newPosition = data.imagePositions[newImageUrl] || { x: 50, y: 50 }
        setImageOffsetX(newPosition.x)
        setImageOffsetY(newPosition.y)
      } else {
        // 如果删除的不是当前选中的，重新加载当前选中图片的位置
        const currentImageUrl = data.backgroundImages[selectedImageIndex]
        const currentPosition = data.imagePositions[currentImageUrl] || { x: 50, y: 50 }
        setImageOffsetX(currentPosition.x)
        setImageOffsetY(currentPosition.y)
      }
      
      toast({
        title: "Success",
        description: "Background image deleted",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete background image",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <Card className="bg-gray-800 border-gray-600">
        <CardContent className="p-6">
          <div className="text-center text-white">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  const currentImageUrl = backgroundImages.length > 0 && selectedImageIndex < backgroundImages.length
    ? backgroundImages[selectedImageIndex]
    : null

  return (
    <Card className="bg-gray-800 border-gray-600">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Heart className="w-5 h-5 mr-2 text-pink-400" />
          Anniversary Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 当前背景图预览 */}
        <div>
          <h3 className="text-white font-semibold mb-3">Preview (匹配首页显示效果)</h3>
          <AnniversaryPreview
            imageUrl={currentImageUrl}
            imageOffsetX={imageOffsetX}
            imageOffsetY={imageOffsetY}
          />
          
          {/* 位置调整控制 */}
          {backgroundImages.length > 0 && (
            <ImagePositionControls
              imageOffsetX={imageOffsetX}
              imageOffsetY={imageOffsetY}
              selectedImageIndex={selectedImageIndex}
              totalImages={backgroundImages.length}
              onPositionChange={handlePositionUpdate}
            />
          )}
        </div>

        {/* 背景图列表 */}
        <div>
          <h3 className="text-white font-semibold mb-3">
            Background Images ({backgroundImages.length})
          </h3>
          <ImageList
            backgroundImages={backgroundImages}
            selectedImageIndex={selectedImageIndex}
            uploading={uploading}
            onSelect={setSelectedImageIndex}
            onDelete={handleDeleteImage}
          />
        </div>

        {/* 上传新背景图 */}
        <ImageUploadSection
          uploading={uploading}
          uploadKey={uploadKey}
          onFileSelect={handleFileSelect}
        />
      </CardContent>
    </Card>
  )
}

export default AnniversaryTab
