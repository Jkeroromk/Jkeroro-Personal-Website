'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import FileUpload from '@/components/FileUpload'
import ImageCropper from '@/components/ImageCropper'

const EditModal = ({ 
  editingItem, 
  activeTab, 
  formData, 
  setFormData, 
  onClose, 
  onSave,
  uploadedFile,
  setUploadedFile 
}) => {
  const [showCropper, setShowCropper] = useState(false)
  const [tempImageSrc, setTempImageSrc] = useState('')

  const handleFileSelect = (file, filePath) => {
    console.log('File selected:', file)
    console.log('File path:', filePath)
    setUploadedFile(file)
    const imagePath = filePath || `/uploads/${file.name}`
    console.log('Setting tempImageSrc to:', imagePath)
    // 确保路径正确编码
    const encodedPath = encodeURI(imagePath)
    console.log('Encoded path:', encodedPath)
    setTempImageSrc(encodedPath)
    setShowCropper(true)
  }

  const handleCropConfirm = (cropData) => {
    setFormData(prev => ({
      ...prev,
      src: tempImageSrc,
      cropX: cropData.x,
      cropY: cropData.y,
      cropSize: cropData.width,
      imageScale: cropData.scale,
      imageOffsetX: cropData.offsetX,
      imageOffsetY: cropData.offsetY
    }))
    setShowCropper(false)
  }

  const handleCropCancel = () => {
    setShowCropper(false)
    setTempImageSrc('')
    setUploadedFile(null)
  }

  if (!editingItem) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gray-900 rounded-lg p-6 w-full max-w-md border border-gray-700"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">
            {editingItem === 'new' ? 'Add New' : 'Edit'} {activeTab.slice(0, -1)}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-4">
          {activeTab === 'images' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Upload Image
                </label>
                <FileUpload
                  type="image"
                  onFileSelect={(file, filePath) => {
                    setUploadedFile(file)
                    setFormData({...formData, src: filePath || `/uploads/${file.name}`})
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Alt Text
                </label>
                <Input
                  value={formData.alt}
                  onChange={(e) => setFormData({...formData, alt: e.target.value})}
                  placeholder="Image description"
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Width
                  </label>
                  <Input
                    type="number"
                    value={formData.width}
                    onChange={(e) => setFormData({...formData, width: parseInt(e.target.value)})}
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Height
                  </label>
                  <Input
                    type="number"
                    value={formData.height}
                    onChange={(e) => setFormData({...formData, height: parseInt(e.target.value)})}
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
              </div>
            </>
          )}

          {activeTab === 'music' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Upload Audio
                </label>
                <FileUpload
                  type="audio"
                  onFileSelect={(file, filePath) => {
                    setUploadedFile(file)
                    setFormData({...formData, src: filePath || `/uploads/${file.name}`})
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Title
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Track title"
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Subtitle
                </label>
                <Input
                  value={formData.subtitle}
                  onChange={(e) => setFormData({...formData, subtitle: e.target.value})}
                  placeholder="Artist name"
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Audio Source (or manual path)
                </label>
                <Input
                  value={formData.src}
                  onChange={(e) => setFormData({...formData, src: e.target.value})}
                  placeholder="/path/to/audio.mp3"
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
            </>
          )}

          {activeTab === 'projects' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Upload Project Image
                </label>
                <FileUpload
                  type="image"
                  onFileSelect={handleFileSelect}
                />
                {formData.src && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-400 mb-2 text-center">
                      Preview (matches carousel display)
                    </div>
                    <div 
                      className="relative w-full h-64 sm:h-80 rounded border border-gray-600 overflow-hidden"
                      style={{
                        backgroundImage: formData.src ? `url("${encodeURI(formData.src)}")` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: formData.cropX !== undefined && formData.cropY !== undefined ? `${formData.cropX}% ${formData.cropY}%` : (formData.imagePosition || 'center'),
                        backgroundRepeat: 'no-repeat',
                        backgroundColor: formData.src ? 'transparent' : '#1f2937'
                      }}
                    >
                      {/* 背景遮罩 - 模拟carousel效果 */}
                      <div className="absolute inset-0 bg-black/20 transition-all duration-300"></div>
                    </div>
                    <div className="mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setTempImageSrc(formData.src)
                          setShowCropper(true)
                        }}
                        className="w-full border-gray-600 text-black hover:bg-gray-800 hover:text-white"
                      >
                        🔧 Re-adjust Image Crop
                      </Button>
                      <p className="text-xs text-gray-400 mt-1 text-center">
                        Crop area is locked to carousel display size (550×256px)
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Title
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Project title"
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Project description"
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Link
                </label>
                <Input
                  value={formData.link}
                  onChange={(e) => setFormData({...formData, link: e.target.value})}
                  placeholder="https://example.com"
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category
                </label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  placeholder="web, mobile, design, etc."
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
            </>
          )}
        </div>

        <div className="flex gap-4 mt-6">
          <Button
            onClick={onSave}
            className="flex-1 bg-white text-black hover:bg-gray-200"
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
          >
            Cancel
          </Button>
        </div>
      </motion.div>
      
      {/* 图片裁剪器 */}
      <ImageCropper
        imageSrc={tempImageSrc}
        onCrop={handleCropConfirm}
        onCancel={handleCropCancel}
        isVisible={showCropper}
      />
    </motion.div>
  )
}

export default EditModal
