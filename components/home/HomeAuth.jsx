'use client'

import React, { useEffect } from 'react'
import { AuthProvider } from '../../auth'

// 以前这里会检查「是不是从 loading 页跳过来的」，不是就踢回 /。
// 现在首页和开场在同一个页面，不需要这个检查了，只保留登录状态和回到顶部。
const HomeAuth = ({ children }) => {
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    } catch {
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }
  }, [])

  return <AuthProvider>{children}</AuthProvider>
}

export default HomeAuth
