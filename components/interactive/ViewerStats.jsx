'use client'

import { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Eye } from 'lucide-react'
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog'
import WorldMapDialog from '@/components/effects/worldMap'
import { getRealtimeClient } from '@/lib/realtime-client'
import DataManager from '@/lib/data-manager'

const ViewerStats = () => {
  const [viewerCount, setViewerCount] = useState(0)
  const [viewerError, setViewerError] = useState(null)
  const [mapOpen, setMapOpen] = useState(false)

  // 预加载国家数据（在组件挂载时）
  useEffect(() => {
    const dataManager = DataManager.getInstance()
    
    // 如果缓存中没有数据或已过期，预加载
    const cachedCountries = dataManager.getCountries()
    if (!cachedCountries || cachedCountries.length === 0) {
      // 静默预加载，不阻塞 UI
      fetch('/api/stats/countries')
        .then(response => response.json())
        .then(data => {
          dataManager.saveCountries(data)
        })
        .catch(error => {
          // 静默处理错误
        })
    }
  }, [])

  // Track visitor location and increment view count (once per hour per visitor)
  useEffect(() => {
    // Check if we've already tracked in the last hour (using localStorage for persistence)
    const lastTracked = localStorage.getItem('viewerTrackedTime')
    const now = Date.now()
    const oneHour = 60 * 60 * 1000 // 1小时
    
    // 如果上次记录时间超过1小时，或者没有记录，则允许计数
    const shouldTrack = !lastTracked || (now - parseInt(lastTracked)) > oneHour
    
    const trackAndIncrement = async () => {
      try {
        // Track visitor location
        await fetch('/api/stats/countries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })

        // Increment view count
        const response = await fetch('/api/stats/view', {
          method: 'POST',
        })
        
        if (response.ok) {
          const data = await response.json()
          setViewerCount(data.count)
          // Mark as tracked with current timestamp
          localStorage.setItem('viewerTrackedTime', now.toString())
        }
      } catch (error) {
        // 静默处理错误
      }
    }

    // Fetch current view count
    const fetchViewCount = async () => {
      try {
        // 先使用缓存数据立即显示
        const cachedViewCount = localStorage.getItem('jkeroro-view-count')
        if (cachedViewCount) {
          try {
            const cachedData = JSON.parse(cachedViewCount)
            if (cachedData && typeof cachedData.count === 'number') {
              setViewerCount(cachedData.count)
              setViewerError(null)
            }
          } catch (e) {
            // 静默处理缓存解析错误
          }
        }

        // 然后异步获取最新数据
        const response = await fetch('/api/stats/view')
        
        if (response.ok) {
          const data = await response.json()
          setViewerCount(data.count)
          setViewerError(null)
          // 更新缓存
          localStorage.setItem('jkeroro-view-count', JSON.stringify(data))
        } else {
          throw new Error(`Failed to fetch view count: ${response.status}`)
        }
      } catch (error) {
        // 如果 API 失败，保持使用缓存数据（如果有）
        if (!localStorage.getItem('jkeroro-view-count')) {
        setViewerError('Error loading viewers')
        }
      }
    }

    // Only increment if not tracked in the last hour
    if (shouldTrack) {
      trackAndIncrement()
    } else {
      // Just fetch the current count
      fetchViewCount()
    }
    
    // 使用 Supabase Realtime 监听 view_count 表变化（实时更新）
    const realtimeClient = getRealtimeClient()
    const unsubscribe = realtimeClient.subscribe('view_count', (data) => {
      if (data && typeof data.count === 'number') {
        setViewerCount(data.count)
        setViewerError(null)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  return (
    <AlertDialog open={mapOpen} onOpenChange={setMapOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" className="text-white hover:text-black">
          <Eye /> {viewerError ? "N/A" : viewerCount} Viewers
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-black text-white border border-gray-400 shadow-lg scale-[0.9] sm:scale-[1]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base font-semibold">Audience Map</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-300">
            View the geographic distribution of your audience across the world.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <WorldMapDialog />
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-black text-white hover:bg-red-400">Close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default ViewerStats
