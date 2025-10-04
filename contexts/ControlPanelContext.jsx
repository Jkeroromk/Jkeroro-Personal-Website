'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

const ControlPanelContext = createContext()

export const useControlPanel = () => {
  const context = useContext(ControlPanelContext)
  if (!context) {
    throw new Error('useControlPanel must be used within a ControlPanelProvider')
  }
  return context
}

export const ControlPanelProvider = ({ children }) => {
  const [guiParams, setGuiParams] = useState({
    basePointSize: 0.35,
    brightness: 0.35,
    displacementStrength: 3.0,
    glowSize: 0.12,
    glowAlpha: 0.3,
    decayRate: 0.08,
    cameraZ: 20
  })

  // 在客户端挂载后根据屏幕尺寸调整参数
  useEffect(() => {
    const isMobile = window.innerWidth <= 768
    if (isMobile) {
      setGuiParams(prev => ({
        ...prev,
        basePointSize: 0.5,
        brightness: 0.9,
        displacementStrength: 3.0
      }))
    }
  }, [])

  const handleParamChange = (param, value) => {
    setGuiParams(prev => ({ ...prev, [param]: value }))
  }

  return (
    <ControlPanelContext.Provider value={{
      guiParams,
      handleParamChange
    }}>
      {children}
    </ControlPanelContext.Provider>
  )
}
