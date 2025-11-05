'use client'

import { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Eye } from 'lucide-react'
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog'
import WorldMapDialog from '@/components/effects/worldMap'

const ViewerStats = () => {
  const [viewerCount, setViewerCount] = useState(0)
  const [viewerError, setViewerError] = useState(null)
  const [mapOpen, setMapOpen] = useState(false)

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
        console.error('Error tracking visitor:', error)
      }
    }

    // Fetch current view count
    const fetchViewCount = async () => {
      try {
        const response = await fetch('/api/stats/view')
        if (response.ok) {
          const data = await response.json()
          setViewerCount(data.count)
          setViewerError(null)
        } else {
          throw new Error('Failed to fetch view count')
        }
      } catch (error) {
        console.error('Error fetching view count:', error)
        setViewerError('Error loading viewers')
      }
    }

    // Only increment if not tracked in the last hour
    if (shouldTrack) {
      trackAndIncrement()
    } else {
      // Just fetch the current count
      fetchViewCount()
    }
    
    // Poll for updates every 2 minutes (to see other users' views)
    const interval = setInterval(fetchViewCount, 120000) // 每2分钟更新一次
    return () => clearInterval(interval)
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
