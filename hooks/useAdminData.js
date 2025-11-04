import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import DataManager from '@/lib/data-manager'
// No longer using Firebase - using API instead

export const useAdminData = () => {
  const { toast } = useToast()
  const [dataManager] = useState(() => DataManager.getInstance())
  
  // 状态管理
  const [activeTab, setActiveTab] = useState('images')
  const [images, setImages] = useState([])
  const [tracks, setTracks] = useState([])
  const [projects, setProjects] = useState([])
  const [apiProjects, setApiProjects] = useState([])
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
  const triggerMusicDataChange = async () => {
    if (typeof window !== 'undefined') {
      try {
        let tracksData = []
        
        try {
          // 从 API 获取最新数据
          const response = await fetch('/api/media/tracks')
          if (response.ok) {
            tracksData = await response.json()
          } else {
            // 降级到本地数据
            tracksData = dataManager.getTracks()
          }
        } catch (error) {
          // 降级到本地数据
          tracksData = dataManager.getTracks()
        }
        
        window.dispatchEvent(new CustomEvent('musicDataChanged', {
          detail: { tracks: tracksData }
        }))
      } catch (error) {
        console.error('触发音乐数据变化事件失败:', error)
      }
    }
  }

  // 加载数据函数
  const loadData = async () => {
    try {
      // 加载本地数据（仅用于项目数据，作为备用）
      const projectsData = dataManager.getProjects()
      setProjects(projectsData)

      // 从 API 加载数据
      try {
        // 加载图片数据
        const imagesResponse = await fetch('/api/media/images')
        if (imagesResponse.ok) {
          const imagesData = await imagesResponse.json()
          setImages(imagesData)
        } else {
          // 降级到本地数据
          const imagesData = dataManager.getImages()
          setImages(imagesData)
        }

        // 加载项目数据
        const projectsResponse = await fetch('/api/media/projects')
        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json()
          setApiProjects(projectsData)
        }

        // 加载音乐数据
        const tracksResponse = await fetch('/api/media/tracks')
        if (tracksResponse.ok) {
          const tracksData = await tracksResponse.json()
          setTracks(tracksData)
        }
      } catch (apiError) {
        console.error('API 加载失败，使用本地数据:', apiError)
        // 降级到本地数据
        const imagesData = dataManager.getImages()
        setImages(imagesData)
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

  // 初始加载数据
  useEffect(() => {
    loadData()
  }, [dataManager, toast])

  // API 连接会在使用时自动处理错误，不需要单独的连接检查

  // 处理保存
  const handleSave = async () => {
    try {
      // 根据不同类型进行不同的验证
      if (activeTab === 'images') {
        if (!formData.alt.trim()) {
          toast({
            title: "验证失败",
            description: "请填写图片描述 (Alt Text)",
            variant: "destructive"
          })
          return
        }
        if (!formData.src.trim()) {
          toast({
            title: "验证失败",
            description: "请上传图片文件",
            variant: "destructive"
          })
          return
        }
      } else if (activeTab === 'music') {
        if (!formData.title.trim()) {
          toast({
            title: "验证失败",
            description: "请填写歌曲标题",
            variant: "destructive"
          })
          return
        }
        if (!formData.subtitle.trim()) {
          toast({
            title: "验证失败",
            description: "请填写艺术家名称",
            variant: "destructive"
          })
          return
        }
        if (!formData.src.trim()) {
          toast({
            title: "验证失败",
            description: "请上传音频文件",
            variant: "destructive"
          })
          return
        }
      } else if (activeTab === 'projects') {
        if (!formData.title.trim()) {
          toast({
            title: "验证失败",
            description: "请填写项目标题",
            variant: "destructive"
          })
          return
        }
        if (!formData.description.trim()) {
          toast({
            title: "验证失败", 
            description: "请填写项目描述",
            variant: "destructive"
          })
          return
        }
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

      if (!editingItem || editingItem === 'new') {
        // 新增项目
        if (activeTab === 'images') {
          const imageData = {
            src: formData.src,
            alt: formData.alt,
            width: formData.width,
            height: formData.height,
            imageOffsetX: formData.imageOffsetX || 50,
            imageOffsetY: formData.imageOffsetY || 50,
            priority: false,
          }

          const response = await fetch('/api/media/images', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(imageData),
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to create image')
          }

          await loadData()
        } else if (activeTab === 'music') {
          const trackData = {
            title: formData.title,
            subtitle: formData.subtitle,
            src: formData.src,
          }

          const response = await fetch('/api/media/tracks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(trackData),
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to create track')
          }

          setTimeout(() => {
            loadData()
            triggerMusicDataChange()
          }, 100)
        } else if (activeTab === 'projects') {
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

          const response = await fetch('/api/media/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(projectData),
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to create project')
          }

          await loadData()
        }
      } else {
        // 更新项目
        if (activeTab === 'images') {
          const updateData = {
            src: formData.src,
            alt: formData.alt,
            width: formData.width,
            height: formData.height,
            imageOffsetX: formData.imageOffsetX || 50,
            imageOffsetY: formData.imageOffsetY || 50,
          }

          const response = await fetch(`/api/media/images/${editingItem.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData),
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to update image')
          }

          await loadData()
        } else if (editingItem && activeTab === 'music') {
          const updateData = {
            title: formData.title,
            subtitle: formData.subtitle,
            src: formData.src,
          }

          const response = await fetch(`/api/media/tracks/${editingItem.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData),
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to update track')
          }

          await loadData()
          triggerMusicDataChange()
        } else if (editingItem && activeTab === 'projects') {
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

          const response = await fetch(`/api/media/projects/${editingItem.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData),
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to update project')
          }

          await loadData()
        }
      }

      // 重新加载数据
      await loadData()

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
      console.error('错误详情:', {
        message: error?.message,
        code: error?.code,
        stack: error?.stack,
        activeTab: activeTab,
        formData: formData,
        errorType: typeof error,
        errorConstructor: error?.constructor?.name
      })
      
      let errorMessage = "保存失败，请重试"
      let errorMsg = ''
      
      // 尝试多种方式获取错误信息
      if (error?.message) {
        errorMsg = error.message
      } else if (error?.toString) {
        errorMsg = error.toString()
      } else if (typeof error === 'string') {
        errorMsg = error
      } else {
        errorMsg = '未知错误'
      }
      
      
      if (errorMsg.includes('Network error') || errorMsg.includes('network') || errorMsg.includes('fetch')) {
        errorMessage = "网络错误，请检查网络连接"
      } else if (errorMsg.includes('Permission denied') || errorMsg.includes('permission-denied') || errorMsg.includes('401') || errorMsg.includes('403')) {
        errorMessage = "权限不足，请检查认证状态"
      } else if (errorMsg.includes('Failed to') || errorMsg.includes('500')) {
        errorMessage = "服务器错误，请稍后重试"
      } else if (errorMsg.includes('请填写完整的歌曲信息')) {
        errorMessage = errorMsg
      }

      toast({
        title: "保存失败",
        description: `${errorMessage}${errorMsg ? ` (${errorMsg})` : ''}`,
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
        imageOffsetX: item.imageOffsetX || 50,
        imageOffsetY: item.imageOffsetY || 50,
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
    setEditingItem(item)
  }

  // 处理删除
  const handleDelete = async (id, type) => {
    try {
      let endpoint = ''
      switch (type) {
        case 'image':
          endpoint = `/api/media/images/${id}`
          break
        case 'track':
          endpoint = `/api/media/tracks/${id}`
          break
        case 'project':
          endpoint = `/api/media/projects/${id}`
          break
        default:
          throw new Error('Invalid type')
      }

      const response = await fetch(endpoint, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete')
      }

      // 重新加载数据
      await loadData()

      if (type === 'track') {
        triggerMusicDataChange()
      }

      toast({
        title: "删除成功",
        description: "项目已成功删除",
      })

    } catch (error) {
      console.error('删除失败:', error)
      toast({
        title: "删除失败",
        description: error.message || "删除失败，请重试",
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
    setEditingItem('new')
    setUploadedFile(null)
  }

  // 处理音乐拖拽排序
  const handleTrackReorder = async (dragIndex, dropIndex) => {
    try {
      const newTracks = [...(tracks || [])]
      const draggedTrack = newTracks[dragIndex]
      
      // 移除拖拽的项目
      newTracks.splice(dragIndex, 1)
      // 在目标位置插入
      newTracks.splice(dropIndex, 0, draggedTrack)
      
      // 更新 API 中每个轨道的顺序
      const updatePromises = newTracks.map((track, index) => {
        return fetch(`/api/media/tracks/${track.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: index }),
        })
      })
      
      await Promise.all(updatePromises)
      
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

  // 处理图片拖拽排序
  const handleImageReorder = async (dragIndex, dropIndex) => {
    try {
      const newImages = [...(images || [])]
      const draggedImage = newImages[dragIndex]
      
      // 移除拖拽的项目
      newImages.splice(dragIndex, 1)
      // 在目标位置插入
      newImages.splice(dropIndex, 0, draggedImage)
      
      // 更新 API 中每个图片的顺序
      const updatePromises = newImages.map((image, index) => {
        return fetch(`/api/media/images/${image.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: index }),
        })
      })
      
      await Promise.all(updatePromises)
      
      // 更新本地状态
      setImages(newImages)
      
      toast({
        title: "Success",
        description: "Image order updated successfully",
      })
    } catch (error) {
      console.error('Image reorder error:', error)
      toast({
        title: "Error",
        description: `Failed to reorder images: ${error.message}`,
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
    setEditingItem('new') // 设置为 'new' 来打开编辑模态框
    setUploadedFile(null)
  }

  return {
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
    handleAddTrack
  }
}
