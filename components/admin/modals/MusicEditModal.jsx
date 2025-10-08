'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import FileUpload from '@/components/ui/FileUpload'

const MusicEditModal = ({ 
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
            {editingItem === 'new' ? 'Add New' : 'Edit'} Track
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
              Upload Audio File
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

export default MusicEditModal
