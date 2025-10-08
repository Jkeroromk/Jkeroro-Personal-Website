'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Save, X } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import FileUpload from '@/components/ui/FileUpload'

const ImageEditModal = ({ 
  editingItem, 
  formData, 
  setFormData, 
  onClose, 
  onSave,
  uploadedFile,
  setUploadedFile 
}) => {
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
        className="bg-gray-900 rounded-lg p-3 sm:p-6 w-full border border-gray-700 max-h-[90vh] overflow-y-auto max-w-md"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-white">
            {editingItem === 'new' ? 'Add New' : 'Edit'} Image
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
              Upload Image
            </label>
            <FileUpload
              type="image"
              onFileSelect={(file, filePath) => {
                setUploadedFile(file)
                setFormData({...formData, src: filePath || `/uploads/${file.name}`})
              }}
            />
            
            {/* 图片预览和位置调整 */}
            {formData.src && formData.src.trim() !== '' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Image Preview & Position
                </label>
                <div className="relative w-full aspect-[4/3] sm:aspect-[550/384] rounded-lg border border-gray-600 overflow-hidden bg-gray-800">
                  {formData.src ? (
                    <>
                      <Image
                        src={formData.src}
                        alt={formData.alt || 'Preview'}
                        fill
                        className="object-cover"
                        style={{
                          objectPosition: `${formData.imageOffsetX || 50}% ${formData.imageOffsetY || 50}%`
                        }}
                        onError={(e) => {
                          console.error('Image load error:', formData.src, e)
                          e.target.style.display = 'none'
                          if (e.target.nextSibling) {
                            e.target.nextSibling.style.display = 'flex'
                          }
                        }}
                        unoptimized={formData.src.startsWith('/api/file/') || formData.src.startsWith('https://')}
                      />
                      <div 
                        className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-800"
                        style={{ display: 'none' }}
                      >
                        <div className="text-center">
                          <div className="text-sm">Failed to load image</div>
                          <div className="text-xs text-gray-500 mt-1">Path: {formData.src}</div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <div className="text-sm">No image selected</div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* 位置调整控制 */}
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Horizontal Position: {formData.imageOffsetX || 50}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={formData.imageOffsetX || 50}
                      onChange={(e) => setFormData({...formData, imageOffsetX: parseInt(e.target.value)})}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Vertical Position: {formData.imageOffsetY || 50}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={formData.imageOffsetY || 50}
                      onChange={(e) => setFormData({...formData, imageOffsetY: parseInt(e.target.value)})}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData({...formData, imageOffsetX: 50, imageOffsetY: 50})}
                      className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                    >
                      Center
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData({...formData, imageOffsetX: 0, imageOffsetY: 0})}
                      className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                    >
                      Top Left
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData({...formData, imageOffsetX: 100, imageOffsetY: 100})}
                      className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                    >
                      Bottom Right
                    </Button>
                  </div>
                </div>
              </div>
            )}
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

export default ImageEditModal
