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
    const res = await apiCall(
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
    // 立即更新本地 state，不依赖缓存失效
    const saved = await res.json()
    if (isNew) {
      setImages(prev => [...(prev || []), saved])
    } else {
      setImages(prev => (prev || []).map(img => img.id === saved.id ? saved : img))
    }
  }

  const handleDeleteImage = async (id) => {
    await apiCall(`/api/media/images/${id}`, 'DELETE')
    await loadImages()
  }

  const handleReorderImages = async (dragIndex, dropIndex) => {
    const prev = [...(images || [])]
    const moved = [...prev]
    const [dragged] = moved.splice(dragIndex, 1)
    moved.splice(dropIndex, 0, dragged)
    const next = moved.map((item, i) => ({ ...item, order: i }))
    setImages(next)
    // 只更新 order 不对的那几条；一定要带登录 token，否则接口 401、刷新后顺序会变回去
    const changed = next
      .map((item, i) => ({ item, i }))
      .filter(({ item, i }) => prev.find((p) => p.id === item.id)?.order !== i)
    try {
      await Promise.all(changed.map(({ item, i }) => apiCall(`/api/media/images/${item.id}`, 'PATCH', { order: i })))
    } catch (err) {
      console.error('[reorder] failed, reverting', err)
      setImages(prev)
      await loadImages?.().catch(() => {})
      alert(`排序没保存成功：${err.message || err}`)
      return
    }
  }

  return {
    images, setImages, loadImages,
    handleSaveImage, handleDeleteImage, handleReorderImages,
  }
}
