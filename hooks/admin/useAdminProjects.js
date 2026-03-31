import { useState } from 'react'
import DataManager from '@/lib/data-manager'

const filterDefined = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null))

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
      })
    )
    setTimeout(() => loadProjects(), 300)
  }

  const handleDeleteProject = async (id) => {
    await apiCall(`/api/media/projects/${id}`, 'DELETE')
    await loadProjects()
  }

  const handleReorderProjects = async (dragIndex, dropIndex) => {
    const newProjects = [...(apiProjects || [])]
    const [dragged] = newProjects.splice(dragIndex, 1)
    newProjects.splice(dropIndex, 0, dragged)
    setApiProjects(newProjects)
    await Promise.all(
      newProjects.map((project, i) =>
        fetch(`/api/media/projects/${project.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: i }),
        })
      )
    )
  }

  return {
    projects, apiProjects, loadProjects,
    handleSaveProject, handleDeleteProject, handleReorderProjects,
  }
}
