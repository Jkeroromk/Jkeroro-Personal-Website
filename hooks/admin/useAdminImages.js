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
    // Caption 可以不填：首页没 caption 的照片就不显示那行小字
    if (!formData.src?.trim()) throw new Error('请上传图片文件')

    const isNew = !editingItem || editingItem === 'new'
    const res = await apiCall(
      isNew ? '/api/media/images' : `/api/media/images/${editingItem.id}`,
      isNew ? 'POST' : 'PATCH',
      {
        src: formData.src,
        alt: (formData.alt || '').trim(),
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

  // 批量上传完的照片一次性写进数据库。按顺序一张张建（并发建会抢同一个 order），
  // placement 为 'start' 时新照片排到最前面，原来的整体往后挪。
  const handleBulkAddImages = async (uploaded, { placement = 'end' } = {}) => {
    const current = [...(images || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    const base = placement === 'start' ? 0 : current.reduce((m, img) => Math.max(m, img.order ?? 0), -1) + 1

    const created = []
    for (let i = 0; i < uploaded.length; i++) {
      const u = uploaded[i]
      const res = await apiCall('/api/media/images', 'POST', {
        src: u.src,
        alt: u.caption || '',
        width: u.width,
        height: u.height,
        order: base + i,
        priority: false,
        imageOffsetX: 50,
        imageOffsetY: 50,
      })
      created.push(await res.json())
    }

    if (placement === 'start') {
      const shifted = current.map((img, i) => ({ ...img, order: uploaded.length + i }))
      const changed = shifted.filter((img, i) => current[i].order !== img.order)
      await Promise.all(changed.map((img) => apiCall(`/api/media/images/${img.id}`, 'PATCH', { order: img.order })))
      setImages([...created, ...shifted])
    } else {
      setImages([...current, ...created])
    }
  }

  // 换一张照片：位置、caption 不变，只换图，取景位置回到居中
  const handleReplaceImage = async (id, { src, width, height }) => {
    const res = await apiCall(`/api/media/images/${id}`, 'PATCH', {
      src, width, height, imageOffsetX: 50, imageOffsetY: 50,
    })
    const saved = await res.json()
    setImages((prev) => (prev || []).map((img) => (img.id === saved.id ? saved : img)))
    return saved
  }

  // NAS 管的格子「换一张」：网站只做标记，家里 NAS 一分钟内推一张新的上来。
  // 这里每 4 秒看一次图片有没有变，最多等 2 分钟。block=true 时当前这张以后不再出现。
  const handleRotateImage = async (id, { block = false } = {}) => {
    const before = (images || []).find((img) => img.id === id)?.src
    await apiCall(`/api/media/images/${id}/rotate`, 'POST', { block })
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 4000))
      const res = await fetch('/api/media/images', { cache: 'no-store' })
      if (!res.ok) continue
      const list = await res.json()
      const now = list.find((img) => img.id === id)
      if (now && now.src !== before) {
        setImages(list)
        return now
      }
    }
    throw new Error('NAS 还没响应，可能没开机或者容器没在跑；它下次上线会自动换')
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
    handleBulkAddImages, handleReplaceImage, handleRotateImage,
  }
}
