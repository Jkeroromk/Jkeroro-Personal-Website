import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useAdminTracks } from './admin/useAdminTracks'
import { useAdminImages } from './admin/useAdminImages'
import { useAdminProjects } from './admin/useAdminProjects'

const DEFAULT_FORM = {
  title: '', subtitle: '', src: '', alt: '',
  width: 550, height: 384,
  description: '', link: '', category: 'personal',
  cropX: 50, cropY: 50, cropSize: 100,
  imageOffsetX: 0, imageOffsetY: 0, scale: 1,
}

export const useAdminData = () => {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('images')
  const [editingItem, setEditingItem] = useState(null)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [formData, setFormData] = useState(DEFAULT_FORM)

  const trackHook = useAdminTracks()
  const imageHook = useAdminImages()
  const projectHook = useAdminProjects()

  useEffect(() => {
    imageHook.loadImages()
    trackHook.loadTracks()
    projectHook.loadProjects()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const resetForm = () => {
    setFormData(DEFAULT_FORM)
    setEditingItem(null)
    setUploadedFile(null)
  }

  const handleSave = async () => {
    try {
      if (activeTab === 'images')   await imageHook.handleSaveImage(formData, editingItem)
      else if (activeTab === 'music')    await trackHook.handleSaveTrack(formData, editingItem)
      else if (activeTab === 'projects') await projectHook.handleSaveProject(formData, editingItem)
      resetForm()
      toast({ title: '保存成功', description: '数据已成功保存' })
    } catch (error) {
      console.error('保存失败:', error)
      toast({ title: '保存失败', description: error?.message || '保存失败，请重试', variant: 'destructive' })
    }
  }

  const handleEdit = (item, type) => {
    if (type === 'image') {
      setFormData({
        ...DEFAULT_FORM,
        src: item.src, alt: item.alt,
        width: item.width, height: item.height,
        imageOffsetX: item.imageOffsetX ?? 50,
        imageOffsetY: item.imageOffsetY ?? 50,
      })
    } else if (type === 'track') {
      setFormData({ ...DEFAULT_FORM, title: item.title, subtitle: item.subtitle, src: item.src })
    } else if (type === 'project') {
      setFormData({
        ...DEFAULT_FORM,
        title: item.title, description: item.description,
        src: item.image, link: item.link,
        category: item.category || 'personal',
        cropX: item.cropX ?? 50, cropY: item.cropY ?? 50, cropSize: item.cropSize ?? 100,
        imageOffsetX: item.imageOffsetX ?? 0, imageOffsetY: item.imageOffsetY ?? 0,
        scale: item.scale ?? 1,
      })
    }
    setEditingItem(item)
  }

  const handleDelete = async (id, type) => {
    try {
      if (type === 'image')   await imageHook.handleDeleteImage(id)
      else if (type === 'track')   await trackHook.handleDeleteTrack(id)
      else if (type === 'project') await projectHook.handleDeleteProject(id)
      toast({ title: '删除成功', description: '项目已成功删除' })
    } catch (error) {
      toast({ title: '删除失败', description: error?.message || '删除失败，请重试', variant: 'destructive' })
    }
  }

  const handleAddNew = () => { setFormData(DEFAULT_FORM); setEditingItem('new'); setUploadedFile(null) }
  const handleAddTrack = () => { setFormData(DEFAULT_FORM); setEditingItem('new'); setUploadedFile(null) }

  return {
    activeTab, setActiveTab,
    images: imageHook.images,
    tracks: trackHook.tracks,
    projects: projectHook.projects,
    apiProjects: projectHook.apiProjects,
    editingItem, setEditingItem,
    uploadedFile, setUploadedFile,
    formData, setFormData,
    handleSave, handleEdit, handleDelete, handleAddNew,
    handleTrackReorder: trackHook.handleReorderTracks,
    handleImageReorder: imageHook.handleReorderImages,
    handleProjectReorder: projectHook.handleReorderProjects,
    handleAddTrack,
    handleTrackImported: trackHook.handleTrackImported,
  }
}
