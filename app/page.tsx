'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [hasRedirected, setHasRedirected] = useState(false)

  useEffect(() => {
    // 防止重复跳转
    if (hasRedirected) return
    
    // 每次访问都显示loading画面，确保用户体验一致
    if (typeof window !== 'undefined') {
      // 清除之前的loading标记，确保每次都是新的流程
      sessionStorage.removeItem('loadingCompleted')
      sessionStorage.removeItem('fromLoading')
      sessionStorage.removeItem('loadingTimestamp')
      
      // 始终跳转到loading页面
      setHasRedirected(true)
      router.replace('/loading')
    }
  }, [router, hasRedirected])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
        <p>Redirecting...</p>
      </div>
    </div>
  )
}
