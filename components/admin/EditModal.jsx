'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import FileUpload from '@/components/FileUpload'

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
                  onFileSelect={(file) => {
                    setUploadedFile(file)
                    setFormData({...formData, src: `/uploads/${file.name}`})
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
                  onFileSelect={(file) => {
                    setUploadedFile(file)
                    setFormData({...formData, src: `/uploads/${file.name}`})
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
                  onFileSelect={(file) => {
                    setUploadedFile(file)
                    setFormData({...formData, src: `/uploads/${file.name}`})
                  }}
                />
                {formData.src && (
                  <div className="mt-2">
                    <img 
                      src={formData.src} 
                      alt="Preview" 
                      className="w-full h-32 object-cover rounded border border-gray-600"
                    />
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
    </motion.div>
  )
}

export default EditModal
