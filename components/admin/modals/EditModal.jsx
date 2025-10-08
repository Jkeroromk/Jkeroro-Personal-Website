'use client'

import React from 'react'
import ImageEditModal from './ImageEditModal'
import MusicEditModal from './MusicEditModal'
import ProjectEditModal from './ProjectEditModal'

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
  // 根据 activeTab 渲染相应的编辑模态框
  switch (activeTab) {
    case 'images':
      return (
        <ImageEditModal
          editingItem={editingItem}
          formData={formData}
          setFormData={setFormData}
          onClose={onClose}
          onSave={onSave}
          uploadedFile={uploadedFile}
          setUploadedFile={setUploadedFile}
        />
      )
    case 'music':
      return (
        <MusicEditModal
          editingItem={editingItem}
          formData={formData}
          setFormData={setFormData}
          onClose={onClose}
          onSave={onSave}
          uploadedFile={uploadedFile}
          setUploadedFile={setUploadedFile}
        />
      )
    case 'projects':
      return (
        <ProjectEditModal
          editingItem={editingItem}
          formData={formData}
          setFormData={setFormData}
          onClose={onClose}
          onSave={onSave}
          uploadedFile={uploadedFile}
          setUploadedFile={setUploadedFile}
        />
      )
    default:
      return null
  }
}

export default EditModal
