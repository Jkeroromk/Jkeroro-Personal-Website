import { useState } from 'react'
import DataManager from '@/lib/data-manager'
import { getAuthHeaders } from '@/lib/auth-client'

const filterDefined = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null))

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

export const useAdminProjects = () => {
  const [projects, setProjects] = useState([])
  const [apiProjects, setApiProjects] = useState([])

  const loadProjects = async () => {
    setProjects(DataManager.getInstance().getProjects())
    try {
      let res = await fetch('/api/media/projects')
      if (!res.ok && res.status === 500) {
        await new Promise(r => setTimeout(r, 1000))
        res = await fetch('/api/media/projects')
      }
      if (res.ok) {
        setApiProjects(await res.json() || [])
      } else {
        if (res.status !== 500) console.error('[Admin] Failed to load projects:', res.status)
        setApiProjects([])
      }
    } catch {
      setApiProjects([])
    }
  }

  const handleSaveProject = async (formData, editingItem) => {
    if (!formData.title?.trim()) throw new Error('请填写项目标题')
    if (!formData.description?.trim()) throw new Error('请填写项目描述')

    const isNew = !editingItem || editingItem === 'new'
    await apiCall(
      isNew ? '/api/media/projects' : `/api/media/projects/${editingItem.id}`,
      isNew ? 'POST' : 'PATCH',
      filterDefined({
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
        scale: formData.scale,
        pinned: Boolean(formData.pinned),
      })
    )
    setTimeout(() => loadProjects(), 300)
  }

  const handleDeleteProject = async (id) => {
    await apiCall(`/api/media/projects/${id}`, 'DELETE')
    await loadProjects()
  }

  const handleReorderProjects = async (dragIndex, dropIndex) => {
    const prev = [...(apiProjects || [])]
    const moved = [...prev]
    const [dragged] = moved.splice(dragIndex, 1)
    moved.splice(dropIndex, 0, dragged)
    const next = moved.map((item, i) => ({ ...item, order: i }))
    setApiProjects(next)
    // 只更新 order 不对的那几条；一定要带登录 token，否则接口 401、刷新后顺序会变回去
    const changed = next
      .map((item, i) => ({ item, i }))
      .filter(({ item, i }) => prev.find((p) => p.id === item.id)?.order !== i)
    try {
      await Promise.all(changed.map(({ item, i }) => apiCall(`/api/media/projects/${item.id}`, 'PATCH', { order: i })))
    } catch (err) {
      console.error('[reorder] failed, reverting', err)
      setApiProjects(prev)
      await loadProjects?.().catch(() => {})
      alert(`排序没保存成功：${err.message || err}`)
      return
    }
  }

  // 置顶 / 取消置顶：先在界面上改，接口失败再改回去
  const handleTogglePin = async (project) => {
    const pinned = !project.pinned
    const prev = [...(apiProjects || [])]
    const next = prev
      .map((p) => (p.id === project.id ? { ...p, pinned } : p))
      .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || (a.order ?? 0) - (b.order ?? 0))
    setApiProjects(next)
    try {
      await apiCall(`/api/media/projects/${project.id}`, 'PATCH', { pinned })
    } catch (err) {
      console.error('[pin] failed, reverting', err)
      setApiProjects(prev)
      alert(`置顶没保存成功：${err.message || err}`)
    }
  }

  return {
    projects, apiProjects, loadProjects,
    handleSaveProject, handleDeleteProject, handleReorderProjects, handleTogglePin,
  }
}
