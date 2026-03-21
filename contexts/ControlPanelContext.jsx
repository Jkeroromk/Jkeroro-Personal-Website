'use client'

import React, { createContext, useContext, useState } from 'react'

const ControlPanelContext = createContext()

export const useControlPanel = () => {
  const context = useContext(ControlPanelContext)
  if (!context) {
    throw new Error('useControlPanel must be used within a ControlPanelProvider')
  }
  return context
}

const getDefaultParams = () => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768
  return {
    basePointSize: isMobile ? 0.9 : 0.35,
    brightness: isMobile ? 1.2 : 0.35,
    displacementStrength: 3.0,
    glowSize: 0.12,
    glowAlpha: 0.3,
    decayRate: 0.08,
    cameraZ: 20
  }
}

export const ControlPanelProvider = ({ children }) => {
  const [guiParams, setGuiParams] = useState(getDefaultParams)

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
