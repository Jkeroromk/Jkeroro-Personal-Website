'use client'

import { useEffect, useState } from 'react'
import { getRealtimeClient } from '@/lib/realtime-client'
import DataManager from '@/lib/data-manager'
import type { Project } from '@/types/api'

/**
 * 首页作品列表：先用本地缓存秒出，再从 API 拉最新，之后通过实时订阅跟着后台改动更新。
 * 原来写在 tabs.jsx 的 carousel 里，抽出来给作品区 ProjectIndex 用。
 */
export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    const dataManager = DataManager.getInstance()

    const cached = dataManager.getProjects() as unknown as Project[]
    if (cached && cached.length > 0) {
      setProjects(cached)
      setLoaded(true)
    }

    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/media/projects')
        if (!response.ok) throw new Error('Failed to fetch projects')
        const items: Project[] = await response.json()
        if (cancelled) return
        setProjects(items)
        setError(null)
        dataManager.saveProjects(items as never)
      } catch (err) {
        console.error('Error fetching projects:', err)
        if (cancelled) return
        // API 失败时有缓存就继续用缓存，不报错
        if (!(cached && cached.length > 0)) {
          const message = err instanceof Error ? err.message : 'Unknown error'
          setError('Failed to load projects: ' + message)
        }
      } finally {
        if (!cancelled) setLoaded(true)
      }
    }

    fetchProjects()

    const unsubscribe = getRealtimeClient().subscribe('projects', (items) => {
      setProjects(items as Project[])
      setError(null)
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  return { projects, error, loaded }
}
