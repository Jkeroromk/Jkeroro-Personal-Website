/**
 * useApiObject Hook
 * React Hook for fetching object data from API
 * 
 * Usage:
 * const { data, error, loading, refetch } = useApiObject<ViewCount>('/api/stats/view')
 */

import { useState, useEffect, useCallback } from 'react'
import { fetchObject, ApiError } from '@/lib/api-client'

export interface UseApiObjectResult<T> {
  data: T | null
  error: ApiError | null
  loading: boolean
  refetch: () => Promise<void>
}

export function useApiObject<T extends object>(
  path: string | null,
  options?: RequestInit
): UseApiObjectResult<T> {
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

    const result = await fetchObject<T>(path, options)

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

