import { useState } from 'react'
import DataManager from '@/lib/data-manager'
import { getAuthHeaders } from '@/lib/auth-client'

const apiCall = async (url, method, body) => {
  const authHeaders = await getAuthHeaders()
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(
      data.error || data.message ||
      (res.status === 500 ? '服务器错误，请稍后重试' : `操作失败 (${res.status})`)
    )
  }
  return res
}

export const useAdminImages = () => {
  const [images, setImages] = useState([])

  const loadImages = async () => {
    try {
      const res = await fetch('/api/media/images')
      if (res.ok) {
        setImages(await res.json() || [])
      } else {
        if (res.status !== 500) console.error('[Admin] Failed to load images:', res.status)
        setImages(DataManager.getInstance().getImages() || [])
      }
    } catch {
      setImages(DataManager.getInstance().getImages() || [])
    }
  }

  const handleSaveImage = async (formData, editingItem) => {
    if (!formData.alt?.trim()) throw new Error('请填写图片描述 (Alt Text)')
    if (!formData.src?.trim()) throw new Error('请上传图片文件')

    const isNew = !editingItem || editingItem === 'new'
    await apiCall(
      isNew ? '/api/media/images' : `/api/media/images/${editingItem.id}`,
      isNew ? 'POST' : 'PATCH',
      {
        src: formData.src,
        alt: formData.alt,
        width: formData.width,
        height: formData.height,
        imageOffsetX: formData.imageOffsetX ?? 50,
        imageOffsetY: formData.imageOffsetY ?? 50,
        ...(isNew ? { priority: false } : {}),
      }
    )
    setTimeout(() => loadImages(), 300)
  }

  const handleDeleteImage = async (id) => {
    await apiCall(`/api/media/images/${id}`, 'DELETE')
    await loadImages()
  }

  const handleReorderImages = async (dragIndex, dropIndex) => {
    const newImages = [...(images || [])]
    const [dragged] = newImages.splice(dragIndex, 1)
    newImages.splice(dropIndex, 0, dragged)
    setImages(newImages)
    await Promise.all(
      newImages.map((image, i) =>
        fetch(`/api/media/images/${image.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: i }),
        })
      )
    )
  }

  return {
    images, setImages, loadImages,
    handleSaveImage, handleDeleteImage, handleReorderImages,
  }
}
