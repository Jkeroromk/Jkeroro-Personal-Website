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
import AlbumSyncCard from './AlbumSyncCard'

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

  // 批量上传完成：一次请求把所有新照片加进去，然后选中第一张新的方便调位置
  const handleBulkSave = async (uploaded) => {
    setUploading(true)
    try {
      const before = backgroundImages.length
      const data = await anniversaryApi.addBackgrounds(uploaded.map((u) => u.src))
      setBackgroundImages(data.backgroundImages)
      setImagePositions(data.imagePositions)
      if (data.backgroundImages.length > before) {
        const newIndex = before
        setSelectedImageIndex(newIndex)
        const pos = data.imagePositions[data.backgroundImages[newIndex]] || { x: 50, y: 50 }
        setImageOffsetX(pos.x)
        setImageOffsetY(pos.y)
      }
      toast({ title: 'Success', description: `加了 ${uploaded.length} 张照片` })
    } finally {
      setUploading(false)
    }
  }

  // iCloud 相簿同步完，重新拿一次背景图列表
  const reloadBackgrounds = async () => {
    try {
      const data = await anniversaryApi.getBackground()
      setBackgroundImages(data.backgroundImages)
      setImagePositions(data.imagePositions)
      if (selectedImageIndex >= data.backgroundImages.length) setSelectedImageIndex(0)
    } catch (err) {
      console.error('reload anniversary backgrounds failed', err)
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
    <div className="space-y-6">
      <AlbumSyncCard target="anniversary" label="纪念日轮播" onSynced={reloadBackgrounds} />
      <Card className="bg-gray-800 border-gray-600">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Heart className="w-5 h-5 mr-2 text-pink-400" />
            Anniversary Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* 左右分栏布局 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 左侧：预览和位置控制 */}
            <div className="space-y-4">
              <div>
                <h3 className="text-white font-semibold mb-3 text-sm">Preview</h3>
                <AnniversaryPreview
                  imageUrl={currentImageUrl}
                  imageOffsetX={imageOffsetX}
                  imageOffsetY={imageOffsetY}
                />
              </div>
              
              {/* 位置调整控制 */}
              {backgroundImages.length > 0 && (
                <div className="mt-4">
                  <ImagePositionControls
                    imageOffsetX={imageOffsetX}
                    imageOffsetY={imageOffsetY}
                    selectedImageIndex={selectedImageIndex}
                    totalImages={backgroundImages.length}
                    onPositionChange={handlePositionUpdate}
                    onPositionPreview={(x, y) => { setImageOffsetX(x); setImageOffsetY(y) }}
                  />
                </div>
              )}
            </div>

            {/* 右侧：图片列表和上传 */}
            <div className="space-y-4">
              {/* 上传新背景图 */}
              <div>
                <h3 className="text-white font-semibold mb-3 text-sm">Upload Photos</h3>
                <ImageUploadSection
                  uploading={uploading}
                  onBulkSave={handleBulkSave}
                />
              </div>

              {/* 背景图列表 */}
              <div>
                <h3 className="text-white font-semibold mb-3 text-sm">
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
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AnniversaryTab
