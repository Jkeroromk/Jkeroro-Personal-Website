/**
 * useApiArray Hook
 * React Hook for fetching array data from API
 * 
 * Usage:
 * const { data, error, loading, refetch } = useApiArray<Image>('/api/media/images')
 */

import { useState, useEffect, useCallback } from 'react'
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

  const fetchData = useCallback(async () => {
    if (!path) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const result = await fetchArray<T>(path, options)

    setData(result.data)
    setError(result.error)
    setLoading(false)
  }, [path, options])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    error,
    loading,
    refetch: fetchData,
  }
}

