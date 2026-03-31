'use client'

import React from 'react'
import { useAuth } from '../../auth'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import AdminSidebar from '@/components/admin/AdminSidebar'
import { useAdminData } from '../../hooks/useAdminData'
import MouseTrail from '@/components/effects/mousetrail'
import { AdminToaster } from '@/components/ui/admin-toaster'

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
    handleSave,
    handleEdit,
    handleDelete,
    handleAddNew,
    handleTrackReorder,
    handleImageReorder,
    handleProjectReorder,
    handleAddTrack,
    handleTrackImported,
  } = useAdminData()

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-400">
          <div className="w-5 h-5 border-2 border-zinc-700 border-t-indigo-500 rounded-full animate-spin" />
          <span className="text-sm">Loading...</span>
        </div>
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
      <div className="min-h-screen bg-zinc-950 text-white flex">
        {/* Left Sidebar */}
        <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={logout} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <AdminHeader
            activeTab={activeTab}
            isOnline={isOnline}
            lastActivity={lastActivity}
          />

          <main className="flex-1 overflow-y-auto">
            <div className="px-6 lg:px-8 py-6 max-w-7xl">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'images' && (
                  <ImagesTab
                    images={images}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onAddNew={handleAddNew}
                    onReorder={handleImageReorder}
                  />
                )}
                {activeTab === 'music' && (
                  <MusicTab
                    tracks={tracks}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onAdd={handleAddTrack}
                    onReorder={handleTrackReorder}
                    onImported={handleTrackImported}
                  />
                )}
                {activeTab === 'projects' && (
                  <ProjectsTab
                    projects={apiProjects}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onAddNew={handleAddNew}
                    onReorder={handleProjectReorder}
                  />
                )}
                {activeTab === 'comments'    && <CommentsTab />}
                {activeTab === 'anniversary' && <AnniversaryTab />}
                {activeTab === 'supabase'    && <SupabaseDebugTab />}
              </motion.div>
            </div>
          </main>
        </div>

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
      </div>
      <AdminToaster />
    </>
  )
}

export default AdminPageContent
