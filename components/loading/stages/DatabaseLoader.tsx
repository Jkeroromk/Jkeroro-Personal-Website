/**
 * DatabaseLoader Component
 * 数据库数据加载器
 */

import { useEffect } from 'react'
import DataManager from '@/lib/data-manager'

interface DatabaseLoaderProps {
  onProgress: (progress: number) => void
}

export default function DatabaseLoader({ onProgress }: DatabaseLoaderProps) {
  useEffect(() => {
    const loadDatabaseData = async () => {
      try {
        const dataManager = DataManager.getInstance()

        // 并行加载所有数据库数据
        const [imagesResponse, projectsResponse, countriesResponse, viewCountResponse] =
          await Promise.allSettled([
            fetch('/api/media/images').catch(() => ({ ok: false, json: () => [] })),
            fetch('/api/media/projects').catch(() => ({ ok: false, json: () => [] })),
            fetch('/api/stats/countries').catch(() => ({ ok: false, json: () => [] })),
            fetch('/api/stats/view').catch(() => ({ ok: false, json: () => ({ count: 0 }) })),
          ])

        let loadedCount = 0

        // 处理图片数据
        if (imagesResponse.status === 'fulfilled' && imagesResponse.value.ok) {
          try {
            const images = await imagesResponse.value.json()
            if (images && Array.isArray(images)) {
              dataManager.saveImages(images)
              loadedCount++
            }
          } catch {
            // 静默处理错误
          }
        }

        // 处理项目数据
        if (projectsResponse.status === 'fulfilled' && projectsResponse.value.ok) {
          try {
            const projects = await projectsResponse.value.json()
            if (projects && Array.isArray(projects)) {
              dataManager.saveProjects(projects)
              loadedCount++
            }
          } catch {
            // 静默处理错误
          }
        }

        // 处理国家数据
        if (countriesResponse.status === 'fulfilled' && countriesResponse.value.ok) {
          try {
            const countries = await countriesResponse.value.json()
            if (countries && Array.isArray(countries)) {
              dataManager.saveCountries(countries)
              loadedCount++
            }
          } catch {
            // 静默处理错误
          }
        }

        // 处理 viewer count 数据
        if (viewCountResponse.status === 'fulfilled' && viewCountResponse.value.ok) {
          try {
            const viewData = await viewCountResponse.value.json()
            if (viewData && typeof viewData.count === 'number') {
              localStorage.setItem('jkeroro-view-count', JSON.stringify(viewData))
            }
          } catch {
            // 静默处理错误
          }
        }

        // 更新进度（至少加载了1个就算成功）
        const progress = loadedCount >= 1 ? 20 : 10
        onProgress(progress)
      } catch {
        // 静默处理错误，至少给一些进度
        onProgress(10)
      }
    }

    loadDatabaseData()
  }, [onProgress])

  return null
}

