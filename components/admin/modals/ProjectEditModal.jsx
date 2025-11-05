'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Save, X } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import FileUpload from '@/components/ui/FileUpload'

const ProjectEditModal = ({ 
  editingItem, 
  formData, 
  setFormData, 
  onClose, 
  onSave,
  uploadedFile,
  setUploadedFile 
}) => {
  // 获取标签颜色的辅助函数（与 tabs.jsx 保持一致）
  const getCategoryColor = (category) => {
    switch (category) {
      case 'personal':
        return 'bg-purple-700/30 border-purple-600 text-purple-800';
      case 'work':
        return 'bg-green-700/30 border-green-600 text-green-800';
      case 'school':
        return 'bg-blue-700/30 border-blue-600 text-blue-800';
      default:
        return 'bg-gray-700/30 border-gray-600 text-gray-800';
    }
  };

  if (!editingItem) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gray-900 rounded-lg p-3 sm:p-6 w-full border border-gray-700 max-h-[90vh] overflow-y-auto max-w-2xl"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-white">
            {editingItem === 'new' ? 'Add New' : 'Edit'} Project
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-10 w-10 sm:h-8 sm:w-8"
          >
            <X className="w-5 h-5 sm:w-4 sm:h-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Upload Project Image
            </label>
            <FileUpload
              type="image"
              onFileSelect={(file, filePath) => {
                setUploadedFile(file)
                setFormData({...formData, src: filePath || `/uploads/${file.name}`})
              }}
            />
            
            {/* 图片预览和位置调整 */}
            {formData.src && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Image Preview & Position (匹配 Carousel 显示效果)
                </label>
                {/* 模拟 carousel 卡片容器 - 适配 modal 宽度 */}
                <div className="w-full max-w-[550px] mx-auto bg-white bg-opacity-80 border-2 border-black rounded-3xl overflow-hidden">
                  {/* 图片区域 - 与 carousel 完全一致的尺寸和比例 */}
                  <div className="relative w-full" style={{ aspectRatio: '550/384' }}>
                    <div className="absolute inset-0 overflow-hidden bg-gray-800">
                      {formData.src ? (
                        <>
                          <Image
                            src={formData.src}
                            alt={formData.title || 'Preview'}
                            fill
                            className="object-cover"
                            style={{
                              objectPosition: `${formData.cropX ?? 50}% ${formData.cropY ?? 50}%`
                            }}
                            unoptimized={formData.src.startsWith('/api/file/') || formData.src.startsWith('https://')}
                          />
                          {/* 渐变遮罩 - 与 carousel 一致 */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <div className="text-center">
                            <div className="text-sm">No image selected</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* 文字内容区域预览（简化版） */}
                  <div className="p-4 bg-white bg-opacity-80">
                    <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                  </div>
                </div>
                
                {/* 位置调整控制 */}
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Horizontal Position: {formData.cropX || 50}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={formData.cropX || 50}
                      onChange={(e) => setFormData({...formData, cropX: parseInt(e.target.value)})}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Vertical Position: {formData.cropY || 50}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={formData.cropY || 50}
                      onChange={(e) => {
                        const newValue = parseInt(e.target.value);
                        setFormData({...formData, cropY: newValue});
                      }}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
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
              className="bg-gray-800 border-gray-600 text-white h-8 sm:h-10"
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
              className="bg-gray-800 border-gray-600 text-white min-h-[60px] sm:min-h-[100px]"
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
              className="bg-gray-800 border-gray-600 text-white h-8 sm:h-10"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Category
            </label>
            <div className="space-y-2 lg:space-y-3">
              {/* 预设标签 */}
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {[
                  { value: 'personal', label: 'Personal' },
                  { value: 'work', label: 'Work' },
                  { value: 'school', label: 'School' }
                ].map((tag) => (
                  <button
                    key={tag.value}
                    type="button"
                    onClick={() => setFormData({...formData, category: tag.value})}
                    className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md border-l-2 text-xs font-medium transition-all duration-200 ${
                      formData.category === tag.value
                        ? getCategoryColor(tag.value)
                        : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  placeholder="Custom category..."
                  className="bg-gray-800 border-gray-600 text-white flex-1 h-8 sm:h-10"
                />
                <span className={`px-2 py-0.5 border-l-2 text-xs font-light tracking-wide uppercase self-center ${getCategoryColor(formData.category)}`}>
                  {formData.category || 'none'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6">
          <Button
            onClick={onSave}
            className="flex-1 bg-white text-black hover:bg-gray-200 h-12 sm:h-10"
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-red-600 text-red-400 hover:bg-red-600 hover:text-white h-12 sm:h-10"
          >
            Cancel
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default ProjectEditModal
