/**
 * useLoadingStages Hook
 * 管理加载阶段的 Hook
 */

import { useState, useCallback, useRef } from 'react'
import DataManager from '@/lib/data-manager'

export interface LoadingProgress {
  resources: number // 0-40
  scripts: number // 0-20
  music: number // 0-20
  database: number // 0-20
  total: number // 0-100
}

export function useLoadingStages() {
  const [progress, setProgress] = useState<LoadingProgress>({
    resources: 0,
    scripts: 0,
    music: 0,
    database: 0,
    total: 0,
  })
  const [musicReady, setMusicReady] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const progressRef = useRef<LoadingProgress>(progress)

  const updateProgress = useCallback(() => {
    const total = Math.min(
      100,
      progressRef.current.resources +
        progressRef.current.scripts +
        progressRef.current.music +
        progressRef.current.database
    )

    setProgress({
      ...progressRef.current,
      total,
    })

    // 检查是否完成（需要音乐加载完成）
    if (total >= 80 && musicReady && !isCompleted) {
      setIsCompleted(true)
    }
  }, [musicReady, isCompleted])

  const setResourceProgress = useCallback((value: number) => {
    progressRef.current.resources = Math.min(40, Math.max(0, value))
    updateProgress()
  }, [updateProgress])

  const setScriptProgress = useCallback((value: number) => {
    progressRef.current.scripts = Math.min(20, Math.max(0, value))
    updateProgress()
  }, [updateProgress])

  const setMusicProgress = useCallback((value: number) => {
    progressRef.current.music = Math.min(20, Math.max(0, value))
    if (value >= 20) {
      setMusicReady(true)
    }
    updateProgress()
  }, [updateProgress])

  const setDatabaseProgress = useCallback((value: number) => {
    progressRef.current.database = Math.min(20, Math.max(0, value))
    updateProgress()
  }, [updateProgress])

  return {
    progress,
    musicReady,
    isCompleted,
    setResourceProgress,
    setScriptProgress,
    setMusicProgress,
    setDatabaseProgress,
  }
}

