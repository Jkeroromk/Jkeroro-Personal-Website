import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import DataManager from '@/lib/data-manager'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { firestore } from '../firebase'

export const useAdminData = () => {
  const { toast } = useToast()
  const [dataManager] = useState(() => DataManager.getInstance())
  
  // 状态管理
  const [activeTab, setActiveTab] = useState('images')
  const [images, setImages] = useState([])
  const [tracks, setTracks] = useState([])
  const [projects, setProjects] = useState([])
  const [firebaseProjects, setFirebaseProjects] = useState([])
  const [editingItem, setEditingItem] = useState(null)
  const [uploadedFile, setUploadedFile] = useState(null)

  // 表单状态
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    src: '',
    alt: '',
    width: 550,
    height: 384,
    description: '',
    link: '',
    category: 'personal',
    cropX: 50,
    cropY: 50,
    cropSize: 100,
    imageOffsetX: 0,
    imageOffsetY: 0,
    scale: 1
  })

  // 触发音乐数据变化事件的辅助函数
  const triggerMusicDataChange = () => {
    if (typeof window !== 'undefined') {
      const tracksData = dataManager.getTracks()
      window.dispatchEvent(new CustomEvent('musicDataChanged', {
        detail: { tracks: tracksData }
      }))
    }
  }

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      try {
        // 加载本地数据
        const imagesData = dataManager.getImages()
        const tracksData = dataManager.getTracks()
        const projectsData = dataManager.getProjects()
        
        setImages(imagesData)
        setTracks(tracksData)
        setProjects(projectsData)

        // 加载 Firebase 项目数据
        if (firestore) {
          const querySnapshot = await getDocs(collection(firestore, "carouselItems"))
          const firebaseData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          setFirebaseProjects(firebaseData)
        }
      } catch (error) {
        console.error('加载数据失败:', error)
        toast({
          title: "加载失败",
          description: "无法加载数据，请刷新页面重试",
          variant: "destructive"
        })
      }
    }

    loadData()
  }, [dataManager, toast])

  // 检查 Firebase 连接状态
  useEffect(() => {
    if (!firestore) {
      toast({
        title: "Firebase 连接警告",
        description: "Firebase 未正确初始化，项目功能可能受限",
        variant: "destructive"
      })
    }
  }, [toast])

  // 处理保存
  const handleSave = async () => {
    try {
      if (!formData.title.trim()) {
        toast({
          title: "验证失败",
          description: "请填写标题",
          variant: "destructive"
        })
        return
      }

      if (activeTab === 'projects' && !formData.description.trim()) {
        toast({
          title: "验证失败", 
          description: "请填写项目描述",
          variant: "destructive"
        })
        return
      }

      // 过滤 undefined 值
      const filterUndefinedValues = (obj) => {
        const filtered = {}
        for (const [key, value] of Object.entries(obj)) {
          if (value !== undefined && value !== null) {
            filtered[key] = value
          }
        }
        return filtered
      }

      if (!editingItem) {
        // 新增项目
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
          triggerMusicDataChange()
        } else if (activeTab === 'projects') {
          // 检查 Firebase 连接
          if (!firestore) {
            throw new Error('Firebase not initialized. Please check your environment variables.')
          }

          const projectData = filterUndefinedValues({
            title: formData.title,
            description: formData.description,
            image: formData.src,
            link: formData.link,
            category: formData.category,
            cropX: formData.cropX,
            cropY: formData.cropY,
            cropSize: formData.cropSize,
            imageOffsetX: formData.imageOffsetX,
            imageOffsetY: formData.imageOffsetY,
            scale: formData.scale
          })

          await addDoc(collection(firestore, "carouselItems"), projectData)
        }
      } else {
        // 更新项目
        if (activeTab === 'images') {
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
          triggerMusicDataChange()
        } else if (editingItem && activeTab === 'projects') {
          // 检查 Firebase 连接
          if (!firestore) {
            throw new Error('Firebase not initialized. Please check your environment variables.')
          }

          const updateData = filterUndefinedValues({
            title: formData.title,
            description: formData.description,
            image: formData.src,
            link: formData.link,
            category: formData.category,
            cropX: formData.cropX,
            cropY: formData.cropY,
            cropSize: formData.cropSize,
            imageOffsetX: formData.imageOffsetX,
            imageOffsetY: formData.imageOffsetY,
            scale: formData.scale
          })

          await updateDoc(doc(firestore, "carouselItems", editingItem), updateData)
        }
      }

      // 重新加载数据
      const imagesData = dataManager.getImages()
      const tracksData = dataManager.getTracks()
      const projectsData = dataManager.getProjects()
      
      setImages(imagesData)
      setTracks(tracksData)
      setProjects(projectsData)

      // 重新加载 Firebase 项目数据
      if (firestore) {
        const querySnapshot = await getDocs(collection(firestore, "carouselItems"))
        const firebaseData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setFirebaseProjects(firebaseData)
      }

      // 重置表单
      setFormData({
        title: '',
        subtitle: '',
        src: '',
        alt: '',
        width: 550,
        height: 384,
        description: '',
        link: '',
        category: 'personal',
        cropX: 50,
        cropY: 50,
        cropSize: 100,
        imageOffsetX: 0,
        imageOffsetY: 0,
        scale: 1
      })
      setEditingItem(null)
      setUploadedFile(null)

      toast({
        title: "保存成功",
        description: "数据已成功保存",
      })

    } catch (error) {
      console.error('保存失败:', error)
      
      let errorMessage = "保存失败，请重试"
      if (error.message.includes('Firebase connection failed')) {
        errorMessage = "Firebase 连接失败，请检查网络连接"
      } else if (error.message.includes('Permission denied')) {
        errorMessage = "权限不足，请检查 Firebase 配置"
      } else if (error.message.includes('Network error')) {
        errorMessage = "网络错误，请检查网络连接"
      }

      toast({
        title: "保存失败",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }

  // 处理编辑
  const handleEdit = (item, type) => {
    if (type === 'image') {
      setFormData({
        title: '',
        subtitle: '',
        src: item.src,
        alt: item.alt,
        width: item.width,
        height: item.height,
        description: '',
        link: '',
        category: 'personal',
        cropX: 50,
        cropY: 50,
        cropSize: 100,
        imageOffsetX: 0,
        imageOffsetY: 0,
        scale: 1
      })
    } else if (type === 'track') {
      setFormData({
        title: item.title,
        subtitle: item.subtitle,
        src: item.src,
        alt: '',
        width: 550,
        height: 384,
        description: '',
        link: '',
        category: 'personal',
        cropX: 50,
        cropY: 50,
        cropSize: 100,
        imageOffsetX: 0,
        imageOffsetY: 0,
        scale: 1
      })
    } else if (type === 'project') {
      setFormData({
        title: item.title,
        subtitle: '',
        src: item.image,
        alt: '',
        width: 550,
        height: 384,
        description: item.description,
        link: item.link,
        category: item.category || 'personal',
        cropX: item.cropX || 50,
        cropY: item.cropY || 50,
        cropSize: item.cropSize || 100,
        imageOffsetX: item.imageOffsetX || 0,
        imageOffsetY: item.imageOffsetY || 0,
        scale: item.scale || 1
      })
    }
    setEditingItem(item.id)
  }

  // 处理删除
  const handleDelete = async (id, type) => {
    try {
      switch (type) {
        case 'image':
          dataManager.deleteImage(id)
          break
        case 'track':
          dataManager.deleteTrack(id)
          triggerMusicDataChange()
          break
        case 'project':
          // 从Firebase删除项目
          await deleteDoc(doc(firestore, "carouselItems", id))
          break
      }

      // 重新加载数据
      const imagesData = dataManager.getImages()
      const tracksData = dataManager.getTracks()
      const projectsData = dataManager.getProjects()
      
      setImages(imagesData)
      setTracks(tracksData)
      setProjects(projectsData)

      // 重新加载 Firebase 项目数据
      if (firestore) {
        const querySnapshot = await getDocs(collection(firestore, "carouselItems"))
        const firebaseData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setFirebaseProjects(firebaseData)
      }

      toast({
        title: "删除成功",
        description: "项目已成功删除",
      })

    } catch (error) {
      console.error('删除失败:', error)
      toast({
        title: "删除失败",
        description: "删除失败，请重试",
        variant: "destructive"
      })
    }
  }

  // 处理添加新项目
  const handleAddNew = () => {
    setFormData({
      title: '',
      subtitle: '',
      src: '',
      alt: '',
      width: 550,
      height: 384,
      description: '',
      link: '',
      category: 'personal',
      cropX: 50,
      cropY: 50,
      cropSize: 100,
      imageOffsetX: 0,
      imageOffsetY: 0,
      scale: 1
    })
    setEditingItem(null)
    setUploadedFile(null)
  }

  // 处理音乐拖拽排序
  const handleTrackReorder = (dragIndex, dropIndex) => {
    try {
      const newTracks = [...tracks]
      const draggedTrack = newTracks[dragIndex]
      
      // 移除拖拽的项目
      newTracks.splice(dragIndex, 1)
      // 在目标位置插入
      newTracks.splice(dropIndex, 0, draggedTrack)
      
      // 保存新的顺序
      dataManager.saveTracks(newTracks)
      
      // 更新本地状态
      setTracks(newTracks)
      
      // 触发自定义事件，通知其他组件数据已变化
      triggerMusicDataChange()
      
      toast({
        title: "Success",
        description: "Track order updated successfully",
      })
    } catch (error) {
      console.error('Reorder error:', error)
      toast({
        title: "Error",
        description: `Failed to reorder tracks: ${error.message}`,
        variant: "destructive"
      })
    }
  }

  // 处理添加新音乐轨道
  const handleAddTrack = () => {
    setFormData({
      title: '',
      subtitle: '',
      src: '',
      alt: '',
      width: 550,
      height: 384,
      description: '',
      link: '',
      category: 'personal',
      cropX: 50,
      cropY: 50,
      cropSize: 100,
      imageOffsetX: 0,
      imageOffsetY: 0,
      scale: 1
    })
    setEditingItem(null)
    setUploadedFile(null)
  }

  return {
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
    handleAddTrack
  }
}
