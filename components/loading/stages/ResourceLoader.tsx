/**
 * ResourceLoader Component
 * 静态资源加载器
 */

import { useEffect } from 'react'

interface ResourceLoaderProps {
  onProgress: (progress: number) => void
}

const homeResources = [
  '/pfp.webp',
  '/me.webp',
  '/static/car.png',
  '/static/car.webp',
  '/static/glow.png',
  '/header.webp',
  '/background.mp4',
]

export default function ResourceLoader({ onProgress }: ResourceLoaderProps) {
  useEffect(() => {
    let loadedCount = 0
    const totalResources = homeResources.length

    const onResourceLoaded = () => {
      loadedCount++
      const progress = (loadedCount / totalResources) * 40 // 资源占40%
      onProgress(progress)
    }

    // 预加载静态资源
    homeResources.forEach((src) => {
      const timeout = setTimeout(() => {
        onResourceLoaded()
      }, 5000) // 每个资源5秒超时

      if (src.endsWith('.webp') || src.endsWith('.png') || src.endsWith('.jpg')) {
        const img = new Image()
        img.onload = () => {
          clearTimeout(timeout)
          onResourceLoaded()
        }
        img.onerror = () => {
          clearTimeout(timeout)
          onResourceLoaded()
        }
        img.src = src
        // 添加 fetchpriority 提示浏览器优先加载
        if (src === '/me.webp' || src === '/pfp.webp') {
          img.fetchPriority = 'high'
        }
      } else if (src.endsWith('.mp4')) {
        const video = document.createElement('video')
        video.oncanplay = () => {
          clearTimeout(timeout)
          onResourceLoaded()
        }
        video.onerror = () => {
          clearTimeout(timeout)
          onResourceLoaded()
        }
        video.src = src
        video.preload = 'metadata'
      }
    })
  }, [onProgress])

  return null
}

