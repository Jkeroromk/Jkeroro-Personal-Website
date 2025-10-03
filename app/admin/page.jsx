'use client'

import React, { useState, useEffect } from 'react'
import { useAuth, AuthProvider } from '../../auth'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import DataManager from '@/lib/data-manager'
import MouseTrail from '@/components/mousetrail'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { firestore } from '../../firebase'

// Import admin components
import AdminHeader from '@/components/admin/AdminHeader'
import ImagesTab from '@/components/admin/ImagesTab'
import MusicTab from '@/components/admin/MusicTab'
import ProjectsTab from '@/components/admin/ProjectsTab'
import EditModal from '@/components/admin/EditModal'

const AdminPageContent = () => {
  const { user, isAdmin, loading, logout } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  
  // 状态管理
  const [activeTab, setActiveTab] = useState('images')
  const [images, setImages] = useState([])
  const [tracks, setTracks] = useState([])
  const [projects, setProjects] = useState([])
  const [firebaseProjects, setFirebaseProjects] = useState([])
  const [editingItem, setEditingItem] = useState(null)
  const [dataManager] = useState(() => DataManager.getInstance())
  const [uploadedFile, setUploadedFile] = useState(null)

  // 表单状态
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    src: '',
    alt: '',
    width: 550,
    height: 400,
    description: '',
    link: '',
    category: 'personal'
  })

  // 检查管理员权限
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.replace('/')
    }
  }, [user, isAdmin, loading, router])

  // 加载数据
  useEffect(() => {
    if (isAdmin) {
      loadData()
    }
  }, [isAdmin])

  const loadData = async () => {
    try {
      setImages(dataManager.getImages())
      setTracks(dataManager.getTracks())
      setProjects(dataManager.getProjects())
      
      // 加载Firebase项目
      const querySnapshot = await getDocs(collection(firestore, "carouselItems"))
      const firebaseProjectsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setFirebaseProjects(firebaseProjectsData)
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive"
      })
    }
  }

  const handleSave = async () => {
    try {
      if (editingItem === 'new') {
        // 添加新项目
        if (activeTab === 'images') {
          dataManager.addImage({
            src: formData.src,
            alt: formData.alt,
            width: formData.width,
            height: formData.height,
            priority: false
          })
        } else if (activeTab === 'music') {
          dataManager.addTrack({
            title: formData.title,
            subtitle: formData.subtitle,
            src: formData.src
          })
        } else if (activeTab === 'projects') {
          // 添加到Firebase
          await addDoc(collection(firestore, "carouselItems"), {
            title: formData.title,
            description: formData.description,
            image: formData.src,
            link: formData.link,
            category: formData.category
          })
        }
      } else {
        // 更新现有项目
        if (editingItem && activeTab === 'images') {
          dataManager.updateImage(editingItem, {
            src: formData.src,
            alt: formData.alt,
            width: formData.width,
            height: formData.height
          })
        } else if (editingItem && activeTab === 'music') {
          dataManager.updateTrack(editingItem, {
            title: formData.title,
            subtitle: formData.subtitle,
            src: formData.src
          })
        } else if (editingItem && activeTab === 'projects') {
          // 更新Firebase项目
          await updateDoc(doc(firestore, "carouselItems", editingItem), {
            title: formData.title,
            description: formData.description,
            image: formData.src,
            link: formData.link,
            category: formData.category
          })
        }
      }
      
      // 重新加载数据
      loadData()
      
      toast({
        title: "Success",
        description: "Data saved successfully"
      })
      setEditingItem(null)
      setFormData({
        title: '',
        subtitle: '',
        src: '',
        alt: '',
        width: 550,
        height: 400,
        description: '',
        link: '',
        category: 'personal'
      })
    } catch (error) {
      console.error('Error saving data:', error)
      toast({
        title: "Error",
        description: "Failed to save data",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (id, type) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        switch (type) {
          case 'image':
            dataManager.deleteImage(id)
            break
          case 'track':
            dataManager.deleteTrack(id)
            break
          case 'project':
            // 从Firebase删除项目
            await deleteDoc(doc(firestore, "carouselItems", id))
            break
        }
        // 重新加载数据
        loadData()
        toast({
          title: "Deleted",
          description: "Item deleted successfully"
        })
      } catch (error) {
        console.error('Error deleting item:', error)
        toast({
          title: "Error",
          description: "Failed to delete item",
          variant: "destructive"
        })
      }
    }
  }

  const handleEdit = (item, type) => {
    setEditingItem(item.id)
    setFormData({
      title: item.title || '',
      subtitle: item.subtitle || '',
      src: item.src || item.image || '',
      alt: item.alt || '',
      width: item.width || 550,
      height: item.height || 400,
      description: item.description || '',
      link: item.link || '',
      category: item.category || 'personal'
    })
  }

  const handleAddNew = (type) => {
    setEditingItem('new')
    setFormData({
      title: '',
      subtitle: '',
      src: '',
      alt: '',
      width: 550,
      height: 400,
      description: '',
      link: '',
      category: 'personal'
    })
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.replace('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || !isAdmin) {
    return null
  }

  return (
    <>
      <MouseTrail />
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-7xl mx-auto">
          <AdminHeader onLogout={handleLogout} />

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-800 border border-gray-700 relative overflow-hidden">
              <TabsTrigger 
                value="images" 
                className="relative z-10 text-white data-[state=active]:text-black transition-all duration-300 ease-in-out"
              >
                Images
              </TabsTrigger>
              <TabsTrigger 
                value="music" 
                className="relative z-10 text-white data-[state=active]:text-black transition-all duration-300 ease-in-out"
              >
                Music
              </TabsTrigger>
              <TabsTrigger 
                value="projects" 
                className="relative z-10 text-white data-[state=active]:text-black transition-all duration-300 ease-in-out"
              >
                Projects
              </TabsTrigger>
              
              {/* 动态滑动条 */}
              <div 
                className="absolute top-0 h-full bg-white rounded-md transition-all duration-300 ease-in-out z-0"
                style={{
                  width: '33.333%',
                  left: activeTab === 'images' ? '0%' : activeTab === 'music' ? '33.333%' : '66.666%'
                }}
              />
            </TabsList>

            <TabsContent value="images" className="mt-6">
              <ImagesTab 
                images={images}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </TabsContent>

            <TabsContent value="music" className="mt-6">
              <MusicTab 
                tracks={tracks}
                onEdit={handleEdit}
                onDelete={handleDelete}
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
        </div>
      </div>
    </>
  )
}

const AdminPage = () => {
  return (
    <AuthProvider>
      <AdminPageContent />
    </AuthProvider>
  )
}

export default AdminPage