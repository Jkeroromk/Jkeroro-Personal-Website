/**
 * useTracks Hook
 * 管理音乐曲目数据
 */

import { useState, useEffect } from 'react'
import { useApiArray } from './useApiArray'
import { Track } from '@/types/api'
import DataManager, { MusicTrack } from '@/lib/data-manager'
import { getRealtimeClient } from '@/lib/realtime-client'

// 将 MusicTrack 转换为 Track
function convertToTrack(musicTrack: MusicTrack): Track {
  return {
    ...musicTrack,
    order: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

export function useTracks() {
  const [dataManager] = useState(() => DataManager.getInstance())
  const { data: apiTracks, loading: apiLoading, error, refetch } = useApiArray<Track>(
    '/api/media/tracks'
  )
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  
  // 初始化：立即使用缓存数据（不等待 API）
  useEffect(() => {
    if (typeof window === 'undefined') return

    const cachedTracks = dataManager.getTracks()
    if (cachedTracks && cachedTracks.length > 0) {
      // 将 MusicTrack[] 转换为 Track[]
      const tracks = cachedTracks.map(convertToTrack)
      setTracks(tracks)
      setLoading(false) // 有缓存数据，立即停止 loading
    } else {
      // 没有缓存数据，等待 API 加载
      if (!apiLoading && apiTracks) {
        setLoading(false)
      }
    }
  }, [dataManager, apiLoading, apiTracks])

  // 更新 API 数据（后台更新，不阻塞 UI）
  useEffect(() => {
    if (apiTracks && apiTracks.length > 0) {
      setTracks(apiTracks)
      dataManager.saveTracks(apiTracks)
      setLoading(false) // API 数据加载完成，停止 loading
    } else if (!apiLoading && apiTracks && apiTracks.length === 0) {
      // API 加载完成但没有数据，停止 loading
      setLoading(false)
    }
  }, [apiTracks, apiLoading, dataManager])

  // 实时更新
  useEffect(() => {
    if (typeof window === 'undefined') return

    const realtimeClient = getRealtimeClient()
    const unsubscribe = realtimeClient.subscribe('tracks', (tracksData: Track[]) => {
      setTracks(tracksData)
      dataManager.saveTracks(tracksData)
      setLoading(false)
    })

    return () => {
      unsubscribe()
    }
  }, [dataManager])

  return { tracks, loading, error, refetch }
}

