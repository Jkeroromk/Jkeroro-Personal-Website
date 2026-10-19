'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '../ui/button'
import { Eye, X } from 'lucide-react'
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel } from '@/components/ui/alert-dialog'
import { getRealtimeClient } from '@/lib/realtime-client'
import DataManager from '@/lib/data-manager'

// 延迟加载访客地图，仅在弹窗打开时加载
const WorldMapDialog = dynamic(() => import('@/components/effects/worldMap'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-[420px] gap-3">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full border border-[#3a3a38]" />
        <div
          className="absolute inset-0 rounded-full border border-transparent animate-spin"
          style={{ borderTopColor: '#f4f4f2', animationDuration: '1.5s' }}
        />
      </div>
      <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-[#8a8a86]">Loading map</p>
    </div>
  ),
})

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
        // 并行执行：记录访客位置 + 增加访问计数
        const [, viewResponse] = await Promise.all([
          fetch('/api/stats/countries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          }),
          fetch('/api/stats/view', { method: 'POST' }),
        ])

        if (viewResponse.ok) {
          const data = await viewResponse.json()
          setViewerCount(data.count)
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
      <AlertDialogContent className="block w-[calc(100vw-24px)] max-w-[560px] max-h-[90dvh] overflow-y-auto overscroll-contain [color-scheme:dark] [scrollbar-width:thin] [scrollbar-color:#3a3a38_transparent] p-0 gap-0 rounded-[14px] sm:rounded-[14px] bg-[#0c0c0d] text-[#f4f4f2] border border-[#202020] shadow-2xl">
        <div className="flex items-center justify-between gap-3 px-[18px] pt-4">
          <AlertDialogTitle className="font-mono text-[11px] font-semibold tracking-[0.18em] uppercase">
            Audience Map
          </AlertDialogTitle>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-[7px] font-mono text-[11px] tracking-[0.08em] text-[#8a8a86]">
              <i className="w-1.5 h-1.5 rounded-full bg-[#9fd8a4] animate-pulse motion-reduce:animate-none" />
              LIVE
            </span>
            <AlertDialogCancel
              aria-label="Close"
              className="mt-0 sm:mt-0 h-7 w-7 p-0 rounded-full border border-[#202020] bg-transparent text-[#8a8a86] hover:bg-[#141415] hover:text-[#f4f4f2]"
            >
              <X className="h-3.5 w-3.5" />
            </AlertDialogCancel>
          </div>
        </div>
        <AlertDialogDescription className="sr-only">
          Where visitors to this site come from, by country.
        </AlertDialogDescription>
        <WorldMapDialog />
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default ViewerStats
