/**
 * useApiArray Hook
 * React Hook for fetching array data from API
 * 
 * Usage:
 * const { data, error, loading, refetch } = useApiArray<Image>('/api/media/images')
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchArray, ApiError } from '@/lib/api-client'

export interface UseApiArrayResult<T> {
  data: T[]
  error: ApiError | null
  loading: boolean
  refetch: () => Promise<void>
}

export function useApiArray<T>(
  path: string | null,
  options?: RequestInit
): UseApiArrayResult<T> {
  const [data, setData] = useState<T[]>([])
  const [error, setError] = useState<ApiError | null>(null)
  const [loading, setLoading] = useState(true)
  const optionsRef = useRef(options)
  const lastPathRef = useRef<string | null>(null)

  // 更新 options ref，但不触发重新请求
  useEffect(() => {
    optionsRef.current = options
  }, [options])

  const fetchData = useCallback(async () => {
    if (!path) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const result = await fetchArray<T>(path, optionsRef.current)

    setData(result.data)
    setError(result.error)
    setLoading(false)
  }, [path])

  // 只在 path 改变时重新请求，避免频繁请求
  useEffect(() => {
    // 如果 path 没变，不重复请求
    if (lastPathRef.current === path) {
      return
    }
    
    lastPathRef.current = path
    fetchData()
  }, [path, fetchData])

  return {
    data,
    error,
    loading,
    refetch: fetchData,
  }
}

