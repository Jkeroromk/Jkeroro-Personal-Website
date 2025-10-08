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

  // 获取标签颜色的辅助函数（与 tabs.jsx 保持一致）
  const getCategoryColor = (category) => {
    switch (category) {
      case 'personal':
        return 'bg-purple-600/20 border-purple-500 text-purple-600';
      case 'work':
        return 'bg-green-600/20 border-green-500 text-green-600';
      case 'school':
        return 'bg-blue-600/20 border-blue-500 text-blue-600';
      default:
        return 'bg-gray-600/20 border-gray-500 text-gray-400';
    }
  };

  const handleFileSelect = (file, filePath) => {
    setUploadedFile(file)
    const imagePath = filePath || `/uploads/${file.name}`
    // 确保路径正确编码
    const encodedPath = encodeURI(imagePath)
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
        className={`bg-gray-900 rounded-lg p-6 w-full border border-gray-700 ${
          activeTab === 'projects' ? 'max-w-6xl' : 'max-w-md'
        }`}
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
                  Upload Audio File
                </label>
                <FileUpload
                  type="audio"
                  onFileSelect={(file, filePath) => {
                    setUploadedFile(file)
                    setFormData({...formData, src: filePath || `/uploads/${file.name}`})
                  }}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Supported formats: MP3, WAV, OGG, M4A (Recommended: 2-5MB per file)
                </p>
                <div className="mt-2 p-2 bg-blue-900/20 border border-blue-700/30 rounded text-xs text-blue-300">
                  <p className="font-medium mb-1">💡 Performance Tips:</p>
                  <ul className="space-y-1 text-blue-200">
                    <li>• Keep individual files under 5MB</li>
                    <li>• Total music library under 25MB</li>
                    <li>• Use MP3 format for best compatibility</li>
                    <li>• Consider 3-5 songs for optimal loading</li>
                  </ul>
                </div>
              </div>
              
              {/* 音频预览 */}
              {formData.src && (
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Audio Preview
                  </label>
                  <audio 
                    controls 
                    className="w-full"
                    src={formData.src}
                    preload="metadata"
                  >
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Track Title *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Enter track title"
                  className="bg-gray-800 border-gray-600 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Artist Name *
                </label>
                <Input
                  value={formData.subtitle}
                  onChange={(e) => setFormData({...formData, subtitle: e.target.value})}
                  placeholder="Enter artist name"
                  className="bg-gray-800 border-gray-600 text-white"
                  required
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 左侧：图片上传和预览 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Upload Project Image
                  </label>
                  <FileUpload
                    type="image"
                    onFileSelect={handleFileSelect}
                  />
                  {formData.src && (
                    <div className="mt-4">
                      <div className="text-xs text-gray-400 mb-2 text-center">
                        预览效果 (匹配轮播图显示)
                      </div>
                      <div 
                        className="relative w-full rounded-lg border border-gray-600 overflow-hidden shadow-lg"
                        style={{
                          aspectRatio: '550/384', // 匹配carousel桌面端比例
                          backgroundImage: (formData.src && formData.src.trim() !== '') ? `url("${encodeURI(formData.src)}")` : 'none',
                          backgroundSize: 'cover',
                          backgroundPosition: formData.cropX !== undefined && formData.cropY !== undefined ? `${formData.cropX}% ${formData.cropY}%` : (formData.imagePosition || 'center'),
                          backgroundRepeat: 'no-repeat',
                          backgroundColor: (formData.src && formData.src.trim() !== '') ? 'transparent' : '#1f2937'
                        }}
                      >
                        {/* 背景遮罩 - 模拟carousel效果 */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-all duration-300"></div>
                        
                        {/* 裁剪信息显示 */}
                        {formData.cropX !== undefined && formData.cropY !== undefined && (
                          <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm rounded px-2 py-1">
                            <div className="text-xs text-white">
                              <div>位置: ({Math.round(formData.cropX)}, {Math.round(formData.cropY)})</div>
                              <div>大小: {Math.round(formData.cropSize || 100)}%</div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setTempImageSrc(formData.src)
                            setShowCropper(true)
                          }}
                          className="flex-1 border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
                        >
                          {formData.cropX !== undefined ? '重新调整' : '调整图片'}
                        </Button>
                        {formData.cropX !== undefined && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                cropX: undefined,
                                cropY: undefined,
                                cropSize: undefined
                              }))
                            }}
                            className="border-gray-600 text-gray-400 hover:bg-gray-600 hover:text-white"
                          >
                            重置调整
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-2 text-center">
                        拖拽移动图片调整显示位置
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 右侧：项目信息表单 */}
              <div className="space-y-4">
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
                    className="bg-gray-800 border-gray-600 text-white min-h-[100px]"
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
                  <div className="space-y-3">
                    {/* 预设标签 */}
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: 'personal', label: 'Personal' },
                        { value: 'work', label: 'Work' },
                        { value: 'school', label: 'School' }
                      ].map((tag) => (
                        <button
                          key={tag.value}
                          type="button"
                          onClick={() => setFormData({...formData, category: tag.value})}
                          className={`px-3 py-1.5 rounded-md border-l-2 text-xs font-medium transition-all duration-200 ${
                            formData.category === tag.value
                              ? getCategoryColor(tag.value)
                              : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          {tag.label}
                        </button>
                      ))}
                    </div>
                    
                    {/* 自定义输入 */}
                    <div className="flex gap-2">
                      <Input
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        placeholder="Custom category..."
                        className="bg-gray-800 border-gray-600 text-white flex-1"
                      />
                      <span className={`px-2 py-0.5 border-l-2 text-xs font-light tracking-wide uppercase self-center ${getCategoryColor(formData.category)}`}>
                        {formData.category || 'none'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
