/**
 * useApi Hook
 * React Hook for fetching single resource from API
 * 
 * Usage:
 * const { data, error, loading, refetch } = useApi<Comment>('/api/comments/123')
 */

import { useState, useEffect, useCallback } from 'react'
import { apiRequest, ApiError } from '@/lib/api-client'

export interface UseApiResult<T> {
  data: T | null
  error: ApiError | null
  loading: boolean
  refetch: () => Promise<void>
}

export function useApi<T>(
  path: string | null,
  options?: RequestInit
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!path) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const result = await apiRequest<T>(path, options)

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

