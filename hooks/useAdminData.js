import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import DataManager from '@/lib/data-manager'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore'
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
  const triggerMusicDataChange = async () => {
    if (typeof window !== 'undefined') {
      try {
        let tracksData = []
        
        if (firestore) {
          // 从 Firebase 获取最新数据
          const tracksRef = collection(firestore, 'tracks')
          const q = query(tracksRef, orderBy('order', 'asc'))
          const tracksSnapshot = await getDocs(q)
          tracksData = tracksSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
        } else {
          // 降级到本地数据
          tracksData = dataManager.getTracks()
        }
        
        window.dispatchEvent(new CustomEvent('musicDataChanged', {
          detail: { tracks: tracksData }
        }))
      } catch (error) {
        console.error('触发音乐数据变化事件失败:', error)
        console.error('错误详情:', {
          message: error?.message,
          code: error?.code,
          stack: error?.stack
        })
      }
    }
  }

  // 加载数据函数
  const loadData = async () => {
    try {
      // 加载本地数据（仅用于项目数据）
      const projectsData = dataManager.getProjects()
      setProjects(projectsData)

      // 加载 Firebase 数据
      if (firestore) {
        // 加载 Firebase 图片数据
        const imagesRef = collection(firestore, "images")
        const imagesSnapshot = await getDocs(imagesRef)
        const firebaseImages = imagesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        
        // 按order字段排序，如果没有order字段则按创建时间排序
        const sortedImages = firebaseImages.sort((a, b) => {
          if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order
          } else if (a.order !== undefined) {
            return -1
          } else if (b.order !== undefined) {
            return 1
          } else {
            // 如果都没有order字段，按创建时间排序
            const aTime = new Date(a.createdAt || 0).getTime()
            const bTime = new Date(b.createdAt || 0).getTime()
            return aTime - bTime
          }
        })
        
        setImages(sortedImages)

        // 加载 Firebase 项目数据
        const projectsSnapshot = await getDocs(collection(firestore, "carouselItems"))
        const firebaseProjects = projectsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setFirebaseProjects(firebaseProjects)

        // 加载 Firebase 音乐数据
        const tracksRef = collection(firestore, 'tracks')
        const q = query(tracksRef, orderBy('order', 'asc'))
        const tracksSnapshot = await getDocs(q)
        const firebaseTracks = tracksSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setTracks(firebaseTracks)
      } else {
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

  // 检查 Firebase 连接状态
  useEffect(() => {
    const testFirebaseConnection = async () => {
      if (!firestore) {
        console.error('Firebase 未初始化')
        toast({
          title: "Firebase 连接警告",
          description: "Firebase 未正确初始化，某些功能可能不可用",
          variant: "destructive"
        })
        return
      }

      try {
        // 测试 Firebase 连接
        const testRef = collection(firestore, 'tracks')
        const testSnapshot = await getDocs(testRef)
      } catch (error) {
        console.error('Firebase 连接测试失败:', error)
        toast({
          title: "Firebase 连接失败",
          description: `无法连接到 Firebase: ${error?.message || '未知错误'}`,
          variant: "destructive"
        })
      }
    }

    testFirebaseConnection()
  }, [toast])

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
          // 检查 Firebase 连接
          if (!firestore) {
            throw new Error('Firebase not initialized. Please check your environment variables.')
          }

          // 获取当前图片数量来确定顺序
          const imagesRef = collection(firestore, 'images')
          const imagesSnapshot = await getDocs(imagesRef)
          const order = imagesSnapshot.size

          const imageData = {
            src: formData.src,
            alt: formData.alt,
            width: formData.width,
            height: formData.height,
            imageOffsetX: formData.imageOffsetX || 50,
            imageOffsetY: formData.imageOffsetY || 50,
            order: order,
            priority: false,
            createdAt: new Date().toISOString()
          }
          
          console.log('Saving image data to Firebase:', imageData)

          // 保存到 Firebase
          await addDoc(collection(firestore, 'images'), imageData)
          
          // 重新加载数据以更新管理面板显示
          loadData()
          
          // 触发图片数据变化事件，通知其他组件更新
          // 添加小延迟确保数据已保存到 Firestore
          // 注意：不再触发全局事件，避免影响其他页面
        } else if (activeTab === 'music') {
          // 检查 Firebase 连接
          if (!firestore) {
            throw new Error('Firebase not initialized. Please check your environment variables.')
          }


          // 获取当前轨道数量来确定顺序
          const tracksRef = collection(firestore, 'tracks')
          const tracksSnapshot = await getDocs(tracksRef)
          const order = tracksSnapshot.size

          const trackData = {
            title: formData.title,
            subtitle: formData.subtitle,
            src: formData.src,
            order: order,
            createdAt: new Date().toISOString()
          }


          // 保存到 Firebase
          const docRef = await addDoc(collection(firestore, 'tracks'), trackData)
          
          // 重新加载数据以更新管理面板显示
          setTimeout(() => {
            loadData()
            triggerMusicDataChange()
          }, 100)
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
          // 检查 Firebase 连接
          if (!firestore) {
            throw new Error('Firebase not initialized. Please check your environment variables.')
          }

          // 更新 Firebase 中的图片
          await updateDoc(doc(firestore, 'images', editingItem.id), {
            src: formData.src,
            alt: formData.alt,
            width: formData.width,
            height: formData.height,
            imageOffsetX: formData.imageOffsetX || 50,
            imageOffsetY: formData.imageOffsetY || 50,
            updatedAt: new Date().toISOString()
          })
          
          // 重新加载数据以更新管理面板显示
          loadData()
          
          // 触发图片数据变化事件，通知其他组件更新
          // 添加小延迟确保数据已保存到 Firestore
          // 注意：不再触发全局事件，避免影响其他页面
        } else if (editingItem && activeTab === 'music') {
          // 检查 Firebase 连接
          if (!firestore) {
            throw new Error('Firebase not initialized. Please check your environment variables.')
          }

          // 更新 Firebase 中的轨道
          await updateDoc(doc(firestore, 'tracks', editingItem.id), {
            title: formData.title,
            subtitle: formData.subtitle,
            src: formData.src,
            updatedAt: new Date().toISOString()
          })
          
          // 重新加载数据以更新管理面板显示
          loadData()
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

          await updateDoc(doc(firestore, "carouselItems", editingItem.id), updateData)
        }
      }

      // 重新加载数据
      if (firestore) {
        // 重新加载 Firebase 数据
        await loadData()
      } else {
        // 降级到本地数据
        const imagesData = dataManager.getImages()
        const projectsData = dataManager.getProjects()
        
        setImages(imagesData)
        setProjects(projectsData)
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
      
      
      if (errorMsg.includes('Firebase connection failed') || errorMsg.includes('Firebase not initialized')) {
        errorMessage = "Firebase 连接失败，请检查网络连接"
      } else if (errorMsg.includes('Permission denied') || errorMsg.includes('permission-denied')) {
        errorMessage = "权限不足，请检查 Firebase 配置"
      } else if (errorMsg.includes('Network error') || errorMsg.includes('network')) {
        errorMessage = "网络错误，请检查网络连接"
      } else if (errorMsg.includes('Missing or insufficient permissions')) {
        errorMessage = "权限不足，请检查 Firebase 安全规则"
      } else if (errorMsg.includes('Firestore')) {
        errorMessage = "Firestore 错误，请检查数据库配置"
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
      switch (type) {
        case 'image':
          // 检查 Firebase 连接
          if (!firestore) {
            throw new Error('Firebase not initialized. Please check your environment variables.')
          }

          // 从 Firebase 删除图片
          await deleteDoc(doc(firestore, 'images', id))
          // 重新加载数据以更新管理面板显示
          loadData()
          
          // 触发图片数据变化事件，通知其他组件更新
          // 添加小延迟确保数据已保存到 Firestore
          // 注意：不再触发全局事件，避免影响其他页面
          break
        case 'track':
          // 检查 Firebase 连接
          if (!firestore) {
            throw new Error('Firebase not initialized. Please check your environment variables.')
          }

          // 从 Firebase 删除轨道
          await deleteDoc(doc(firestore, 'tracks', id))
          // 重新加载数据以更新管理面板显示
          loadData()
          triggerMusicDataChange()
          break
        case 'project':
          // 从Firebase删除项目
          await deleteDoc(doc(firestore, "carouselItems", id))
          break
      }

      // 重新加载数据
      const imagesData = dataManager.getImages()
      // 音乐数据现在从 Firebase 加载，这里不再需要
      const projectsData = dataManager.getProjects()
      
      setImages(imagesData)
      // 音乐数据现在从 Firebase 加载，这里不再需要
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
    setEditingItem('new')
    setUploadedFile(null)
  }

  // 处理音乐拖拽排序
  const handleTrackReorder = async (dragIndex, dropIndex) => {
    try {
      // 检查 Firebase 连接
      if (!firestore) {
        throw new Error('Firebase not initialized. Please check your environment variables.')
      }

      const newTracks = [...(tracks || [])]
      const draggedTrack = newTracks[dragIndex]
      
      // 移除拖拽的项目
      newTracks.splice(dragIndex, 1)
      // 在目标位置插入
      newTracks.splice(dropIndex, 0, draggedTrack)
      
      // 更新 Firebase 中每个轨道的顺序
      const updatePromises = newTracks.map((track, index) => {
        return updateDoc(doc(firestore, 'tracks', track.id), {
          order: index
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
      // 检查 Firebase 连接
      if (!firestore) {
        throw new Error('Firebase not initialized. Please check your environment variables.')
      }

      const newImages = [...(images || [])]
      const draggedImage = newImages[dragIndex]
      
      // 移除拖拽的项目
      newImages.splice(dragIndex, 1)
      // 在目标位置插入
      newImages.splice(dropIndex, 0, draggedImage)
      
      // 更新 Firebase 中每个图片的顺序
      const updatePromises = newImages.map((image, index) => {
        return updateDoc(doc(firestore, 'images', image.id), {
          order: index
        })
      })
      
      await Promise.all(updatePromises)
      
      // 更新本地状态
      setImages(newImages)
      
      // 注意：不再触发全局事件，避免影响其他页面
      // album组件会通过Firebase实时监听自动更新
      
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
  }
}
