'use client'

import React from 'react'
import { useAuth } from '../../auth'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAdminData } from '../../hooks/useAdminData'
import MouseTrail from '@/components/effects/mousetrail'
import { AdminToaster } from '@/components/ui/admin-toaster'

// Import admin components
import AdminHeader from '@/components/admin/AdminHeader'
import ImagesTab from '@/components/admin/ImagesTab'
import MusicTab from '@/components/admin/MusicTab'
import ProjectsTab from '@/components/admin/ProjectsTab'
import FirebaseDebugTab from '@/components/admin/FirebaseDebugTab'
import EditModal from '@/components/admin/modals/EditModal'

const AdminPageContent = () => {
  const { user, isAdmin, loading, logout } = useAuth()
  const router = useRouter()
  
  const {
    // 状态
    activeTab,
    setActiveTab,
    images,
    tracks,
    projects,
    firebaseProjects,
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
      <div className="min-h-screen bg-black text-white">
        <AdminHeader user={user} onLogout={logout} />
        
        <div className="container mx-auto px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-6xl mx-auto"
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-gray-800 border-gray-600">
                <TabsTrigger 
                  value="images" 
                  className="data-[state=active]:bg-white data-[state=active]:text-black text-gray-300 hover:text-white"
                >
                  Images
                </TabsTrigger>
                <TabsTrigger 
                  value="music" 
                  className="data-[state=active]:bg-white data-[state=active]:text-black text-gray-300 hover:text-white"
                >
                  Music
                </TabsTrigger>
                <TabsTrigger 
                  value="projects" 
                  className="data-[state=active]:bg-white data-[state=active]:text-black text-gray-300 hover:text-white"
                >
                  Projects
                </TabsTrigger>
                <TabsTrigger 
                  value="firebase" 
                  className="data-[state=active]:bg-white data-[state=active]:text-black text-gray-300 hover:text-white"
                >
                  Firebase
                </TabsTrigger>
              </TabsList>

              <TabsContent value="images" className="mt-6">
                <ImagesTab 
                  images={images}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onAddNew={handleAddNew}
                  onReorder={handleImageReorder}
                />
              </TabsContent>

              <TabsContent value="music" className="mt-6">
                <MusicTab 
                  tracks={tracks}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onAdd={handleAddTrack}
                  onReorder={handleTrackReorder}
                />
              </TabsContent>

              <TabsContent value="projects" className="mt-6">
                <ProjectsTab 
                  projects={firebaseProjects}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onAddNew={handleAddNew}
                />
              </TabsContent>

              <TabsContent value="firebase" className="mt-6">
                <FirebaseDebugTab />
              </TabsContent>
            </Tabs>

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
      <AdminToaster />
    </>
  )
}

export default AdminPageContent
