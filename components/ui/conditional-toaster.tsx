"use client"

import { usePathname } from "next/navigation"
import { Toaster } from "@/components/ui/toaster"

export function ConditionalToaster() {
  const pathname = usePathname()
  
  // 在 admin 页面不显示全局 toast
  if (pathname?.startsWith('/admin')) {
    return null
  }
  
  return <Toaster />
}
