'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // 检查是否已经完成过loading流程
    if (typeof window !== 'undefined') {
      const hasCompletedLoading = sessionStorage.getItem('loadingCompleted')
      const permCookie = document.cookie.includes('perm=')
      
      // 清除旧的loading标记，确保每次都是新的流程
      sessionStorage.removeItem('loadingCompleted')
      sessionStorage.removeItem('fromLoading')
      sessionStorage.removeItem('loadingTimestamp')
      
      if (hasCompletedLoading && permCookie) {
        // 如果已经完成过loading且有权限cookie，直接跳转到home
        router.replace('/home')
      } else {
        // 否则跳转到loading页面
        router.replace('/loading')
      }
    }
  }, [router])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
        <p>Redirecting...</p>
      </div>
    </div>
  )
}
