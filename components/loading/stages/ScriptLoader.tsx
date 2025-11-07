/**
 * ScriptLoader Component
 * 脚本加载检查器
 */

import { useEffect } from 'react'

interface ScriptLoaderProps {
  onProgress: (progress: number) => void
}

export default function ScriptLoader({ onProgress }: ScriptLoaderProps) {
  useEffect(() => {
    const checkScriptsLoaded = () => {
      if (
        typeof window !== 'undefined' &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).THREE &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).THREE.PerspectiveCamera
      ) {
        onProgress(20)
      } else {
        setTimeout(checkScriptsLoaded, 200)
      }
    }

    checkScriptsLoaded()
  }, [onProgress])

  return null
}

