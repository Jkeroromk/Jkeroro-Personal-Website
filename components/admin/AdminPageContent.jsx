'use client'

import React from 'react'
import { useAuth } from '../../auth'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import AdminSidebar from '@/components/admin/AdminSidebar'
import { useAdminData } from '../../hooks/useAdminData'
import MouseTrail from '@/components/effects/mousetrail'
import { AdminToaster } from '@/components/ui/admin-toaster'

// Import admin components
import AdminHeader from '@/components/admin/AdminHeader'
import ImagesTab from '@/components/admin/ImagesTab'
import MusicTab from '@/components/admin/MusicTab'
import ProjectsTab from '@/components/admin/ProjectsTab'
import CommentsTab from '@/components/admin/CommentsTab'
import SupabaseDebugTab from '@/components/admin/SupabaseDebugTab'
import AnniversaryTab from '@/components/admin/AnniversaryTab'
import EditModal from '@/components/admin/modals/EditModal'

const AdminPageContent = () => {
  const { user, isAdmin, loading, logout, isOnline, lastActivity } = useAuth()
  const router = useRouter()
  
  const {
    // 状态
    activeTab,
    setActiveTab,
    images,
    tracks,
    projects,
    apiProjects,
    editingItem,
    setEditingItem,
    uploadedFile,
    setUploadedFile,
    formData,
    setFormData,
    
    // 方法
    handleSave,
    handleEdit,
    handleDelete,
    handleAddNew,
    handleTrackReorder,
    handleImageReorder,
    handleProjectReorder,
    handleAddTrack
  } = useAdminData()

  // 认证检查
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (!isAdmin) {
    router.push('/')
    return null
  }

  return (
    <>
      <MouseTrail />
      <div className="min-h-screen bg-black text-white flex">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <div className="lg:pt-0 pt-16">
            <AdminHeader isOnline={isOnline} lastActivity={lastActivity} />
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-7xl mx-auto"
              >
                {/* Tab Content */}
                {activeTab === 'images' && (
                  <div className="mt-6">
                    <ImagesTab 
                      images={images}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onAddNew={handleAddNew}
                      onReorder={handleImageReorder}
                    />
                  </div>
                )}

                {activeTab === 'music' && (
                  <div className="mt-6">
                    <MusicTab 
                      tracks={tracks}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onAdd={handleAddTrack}
                      onReorder={handleTrackReorder}
                    />
                  </div>
                )}

                {activeTab === 'projects' && (
                  <div className="mt-6">
                    <ProjectsTab 
                      projects={apiProjects}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onAddNew={handleAddNew}
                      onReorder={handleProjectReorder}
                    />
                  </div>
                )}

                {activeTab === 'comments' && (
                  <div className="mt-6">
                    <CommentsTab />
                  </div>
                )}

                {activeTab === 'anniversary' && (
                  <div className="mt-6">
                    <AnniversaryTab />
                  </div>
                )}

                {activeTab === 'supabase' && (
                  <div className="mt-6">
                    <SupabaseDebugTab />
                  </div>
                )}

                <EditModal
                  editingItem={editingItem}
                  activeTab={activeTab}
                  formData={formData}
                  setFormData={setFormData}
                  onClose={() => setEditingItem(null)}
                  onSave={handleSave}
                  uploadedFile={uploadedFile}
                  setUploadedFile={setUploadedFile}
                />
              </motion.div>
            </div>
          </div>
        </div>

        {/* Sidebar Navigation - Right Side */}
        <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={logout} />
      </div>
      <AdminToaster />
    </>
  )
}

export default AdminPageContent
