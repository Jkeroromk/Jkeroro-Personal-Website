/**
 * useAnniversaryData Hook
 * 管理纪念日数据
 */

import { useState, useEffect } from 'react'
import { useApiObject } from './useApiObject'
import { AnniversarySettings } from '@/types/api'

export function useAnniversaryData() {
  const { data, loading, error, refetch } = useApiObject<AnniversarySettings>(
    '/api/anniversary/background'
  )
  const [backgroundImages, setBackgroundImages] = useState<string[]>([])
  const [imagePositions, setImagePositions] = useState<
    Record<string, { x: number; y: number }>
  >({})

  useEffect(() => {
    if (data) {
      const images = Array.isArray(data.backgroundImages)
        ? data.backgroundImages
        : []
      const positions =
        data.imagePositions && typeof data.imagePositions === 'object'
          ? (data.imagePositions as Record<string, { x: number; y: number }>)
          : {}

      setBackgroundImages(images)
      setImagePositions(positions)
    }
  }, [data])

  return {
    backgroundImages,
    imagePositions,
    loading,
    error,
    refetch,
  }
}

