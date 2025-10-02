'use client'

import { useState, useEffect } from 'react'

const ClientTimeDisplay = ({ timestamp, fallback = "Just now" }) => {
  const [timeString, setTimeString] = useState(fallback)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    if (timestamp) {
      setTimeString(new Date(timestamp).toLocaleString())
    }
  }, [timestamp])

  // 在客户端挂载前显示fallback，避免hydration错误
  if (!isMounted) {
    return <span>{fallback}</span>
  }

  return <span>{timeString}</span>
}

export default ClientTimeDisplay
