/**
 * useLoadingStages Hook
 * 管理加载阶段的 Hook
 */

import { useState, useCallback, useRef } from 'react'

export interface LoadingProgress {
  resources: number // 0-40
  scripts: number   // 0-20
  music: number     // 0-20
  database: number  // 0-20
  total: number     // 0-100
}

export function useLoadingStages() {
  const [progress, setProgress] = useState<LoadingProgress>({
    resources: 0,
    scripts: 0,
    music: 0,
    database: 0,
    total: 0,
  })
  const [musicReady, setMusicReady]     = useState(false)
  const [isCompleted, setIsCompleted]   = useState(false)

  // 用 ref 避免 stale closure：updateProgress 不依赖 state，直接读 ref
  const progressRef    = useRef<Omit<LoadingProgress, 'total'>>({ resources: 0, scripts: 0, music: 0, database: 0 })
  const musicReadyRef  = useRef(false)
  const isCompletedRef = useRef(false)

  const updateProgress = useCallback(() => {
    const { resources, scripts, music, database } = progressRef.current
    const total = Math.min(100, resources + scripts + music + database)

    setProgress({ ...progressRef.current, total })

    if (total >= 80 && musicReadyRef.current && !isCompletedRef.current) {
      isCompletedRef.current = true
      setIsCompleted(true)
    }
  }, [])

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
      musicReadyRef.current = true
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
