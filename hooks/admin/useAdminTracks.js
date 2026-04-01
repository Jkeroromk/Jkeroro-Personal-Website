import { useState } from 'react'
import DataManager from '@/lib/data-manager'

const apiCall = async (url, method, body) => {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
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

export const useAdminTracks = () => {
  const [tracks, setTracks] = useState([])

  const triggerMusicDataChange = async () => {
    if (typeof window === 'undefined') return
    try {
      let tracksData = []
      try {
        const res = await fetch('/api/media/tracks')
        tracksData = res.ok ? await res.json() : DataManager.getInstance().getTracks()
      } catch {
        tracksData = DataManager.getInstance().getTracks()
      }
      window.dispatchEvent(new CustomEvent('musicDataChanged', { detail: { tracks: tracksData } }))
    } catch (error) {
      console.error('触发音乐数据变化事件失败:', error)
    }
  }

  const loadTracks = async () => {
    try {
      const res = await fetch('/api/media/tracks')
      if (res.ok) {
        setTracks(await res.json() || [])
      } else {
        if (res.status !== 500) console.error('[Admin] Failed to load tracks:', res.status)
        setTracks([])
      }
    } catch {
      setTracks([])
    }
  }

  const handleSaveTrack = async (formData, editingItem) => {
    if (!formData.title?.trim()) throw new Error('请填写歌曲标题')
    if (!formData.subtitle?.trim()) throw new Error('请填写艺术家名称')
    if (!formData.src?.trim()) throw new Error('请上传音频文件')

    const isNew = !editingItem || editingItem === 'new'
    const res = await apiCall(
      isNew ? '/api/media/tracks' : `/api/media/tracks/${editingItem.id}`,
      isNew ? 'POST' : 'PATCH',
      { title: formData.title, subtitle: formData.subtitle, src: formData.src, cover: formData.cover || null }
    )
    const saved = await res.json()
    if (isNew) {
      setTracks(prev => [...prev, saved])
    } else {
      setTracks(prev => prev.map(t => t.id === saved.id ? saved : t))
    }
    triggerMusicDataChange()
  }

  const handleDeleteTrack = async (id) => {
    await apiCall(`/api/media/tracks/${id}`, 'DELETE')
    setTracks(prev => prev.filter(t => t.id !== id))
    triggerMusicDataChange()
  }

  const handleReorderTracks = async (dragIndex, dropIndex) => {
    const newTracks = [...(tracks || [])]
    const [dragged] = newTracks.splice(dragIndex, 1)
    newTracks.splice(dropIndex, 0, dragged)
    setTracks(newTracks)
    await Promise.all(
      newTracks.map((track, i) =>
        fetch(`/api/media/tracks/${track.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: i }),
        })
      )
    )
    triggerMusicDataChange()
  }

  const handleTrackImported = (track) => {
    if (track) {
      setTracks(prev => [...(prev || []), track])
      triggerMusicDataChange()
    }
    loadTracks().then(() => triggerMusicDataChange())
  }

  return {
    tracks, setTracks, loadTracks,
    handleSaveTrack, handleDeleteTrack, handleReorderTracks,
    handleTrackImported, triggerMusicDataChange,
  }
}
