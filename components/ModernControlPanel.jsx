'use client'

import React, { useState, useRef, useEffect } from 'react'

const ModernControlPanel = ({ params, onParamChange, isVisible, onToggle }) => {
  const [language, setLanguage] = useState('en')
  const [localParams, setLocalParams] = useState(params)
  const timeoutRef = useRef(null)

  // Sync local params with props
  useEffect(() => {
    setLocalParams(params)
  }, [params])

  // Debounced parameter change handler
  const handleParamChangeDebounced = (param, value) => {
    // Update local state immediately for responsive UI
    setLocalParams(prev => ({ ...prev, [param]: value }))
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    // Set new timeout for actual parameter update
    timeoutRef.current = setTimeout(() => {
      onParamChange(param, value)
    }, 16) // ~60fps
  }
  
  const translations = {
    zh: {
      title: '3D 控制面板',
      visual: '视觉效果',
      camera: '相机控制',
      pointSize: '粒子大小',
      brightness: '亮度',
      displacement: '位移强度',
      glowSize: '光晕大小',
      glowAlpha: '光晕透明度',
      decayRate: '衰减率',
      distance: '距离',
      reset: '重置',
      close: '关闭'
    },
    en: {
      title: '3D Control Panel',
      visual: 'Visual Effects',
      camera: 'Camera Controls',
      pointSize: 'Point Size',
      brightness: 'Brightness',
      displacement: 'Displacement',
      glowSize: 'Glow Size',
      glowAlpha: 'Glow Alpha',
      decayRate: 'Decay Rate',
      distance: 'Distance',
      reset: 'Reset',
      close: 'Close'
    }
  }
  
  const t = translations[language]
  
  const handleReset = () => {
    const defaultParams = {
      basePointSize: window.innerWidth <= 768 ? 0.5 : 0.35,
      brightness: window.innerWidth <= 768 ? 0.9 : 0.35,
      displacementStrength: window.innerWidth <= 768 ? 3 : 3.0,
      glowSize: 0.12,
      glowAlpha: 0.3,
      decayRate: 0.025,
      cameraZ: 20
    }
    
    // Update local state immediately
    setLocalParams(defaultParams)
    
    // Update parent state
    Object.keys(defaultParams).forEach(key => {
      onParamChange(key, defaultParams[key])
    })
  }
  
  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed top-4 right-4 z-50 bg-white/5 text-white w-10 h-10 rounded-full hover:bg-white/10 transition-all duration-300 hover:scale-105 active:scale-95 border border-white/20 flex items-center justify-center"
        style={{ backdropFilter: 'blur(20px)' }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
        </svg>
      </button>
    )
  }
  
  return (
    <div className="fixed top-4 right-4 z-50 w-56 max-w-[calc(100vw-2rem)] max-h-[50vh] bg-white/5 text-white rounded-xl p-2 overflow-y-auto modern-scrollbar animate-in slide-in-from-right-4 duration-300 border border-white/20" style={{ backdropFilter: 'blur(20px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">{t.title}</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
            className="px-1 py-0.5 text-xs bg-white/10 rounded-md hover:bg-white/20 transition-colors"
          >
            {language === 'zh' ? 'EN' : '中文'}
          </button>
          <button
            onClick={onToggle}
            className="p-1 hover:bg-white/10 rounded-md transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Visual Effects Tab */}
      <div className="mb-6">
        <h4 className="text-xs font-medium mb-2 text-cyan-300">{t.visual}</h4>
        
        <div className="space-y-2">
          {/* Point Size */}
          <div>
            <label className="block text-xs text-gray-200 mb-1">{t.pointSize}</label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={localParams.basePointSize}
              onChange={(e) => handleParamChangeDebounced('basePointSize', parseFloat(e.target.value))}
              className="w-full h-0.5 bg-white/10 rounded-full appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #9ca3af 0%, #9ca3af ${(localParams.basePointSize - 0.1) / 0.9 * 100}%, rgba(255,255,255,0.1) ${(localParams.basePointSize - 0.1) / 0.9 * 100}%, rgba(255,255,255,0.1) 100%)`
              }}
            />
            <div className="text-xs text-gray-300 mt-0.5">{localParams.basePointSize.toFixed(2)}</div>
          </div>
          
          {/* Brightness */}
          <div>
            <label className="block text-xs text-gray-200 mb-1">{t.brightness}</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={localParams.brightness}
              onChange={(e) => handleParamChangeDebounced('brightness', parseFloat(e.target.value))}
              className="w-full h-0.5 bg-white/10 rounded-full appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #9ca3af 0%, #9ca3af ${params.brightness * 100}%, rgba(255,255,255,0.1) ${params.brightness * 100}%, rgba(255,255,255,0.1) 100%)`
              }}
            />
            <div className="text-xs text-gray-300 mt-0.5">{localParams.brightness.toFixed(2)}</div>
          </div>
          
          {/* Displacement */}
          <div>
            <label className="block text-xs text-gray-200 mb-1">{t.displacement}</label>
            <input
              type="range"
              min="0"
              max="5"
              step="0.1"
              value={localParams.displacementStrength}
              onChange={(e) => handleParamChangeDebounced('displacementStrength', parseFloat(e.target.value))}
              className="w-full h-0.5 bg-white/10 rounded-full appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #9ca3af 0%, #9ca3af ${params.displacementStrength / 5 * 100}%, rgba(255,255,255,0.1) ${params.displacementStrength / 5 * 100}%, rgba(255,255,255,0.1) 100%)`
              }}
            />
            <div className="text-xs text-gray-300 mt-0.5">{localParams.displacementStrength.toFixed(1)}</div>
          </div>
          
          {/* Glow Size */}
          <div>
            <label className="block text-xs text-gray-200 mb-1">{t.glowSize}</label>
            <input
              type="range"
              min="0.05"
              max="0.3"
              step="0.01"
              value={localParams.glowSize}
              onChange={(e) => handleParamChangeDebounced('glowSize', parseFloat(e.target.value))}
              className="w-full h-0.5 bg-white/10 rounded-full appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #9ca3af 0%, #9ca3af ${(localParams.glowSize - 0.05) / 0.25 * 100}%, rgba(255,255,255,0.1) ${(params.glowSize - 0.05) / 0.25 * 100}%, rgba(255,255,255,0.1) 100%)`
              }}
            />
            <div className="text-xs text-gray-300 mt-0.5">{localParams.glowSize.toFixed(2)}</div>
          </div>
          
          {/* Glow Alpha */}
          <div>
            <label className="block text-xs text-gray-200 mb-1">{t.glowAlpha}</label>
            <input
              type="range"
              min="0.1"
              max="0.5"
              step="0.05"
              value={localParams.glowAlpha}
              onChange={(e) => handleParamChangeDebounced('glowAlpha', parseFloat(e.target.value))}
              className="w-full h-0.5 bg-white/10 rounded-full appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #9ca3af 0%, #9ca3af ${(localParams.glowAlpha - 0.1) / 0.4 * 100}%, rgba(255,255,255,0.1) ${(params.glowAlpha - 0.1) / 0.4 * 100}%, rgba(255,255,255,0.1) 100%)`
              }}
            />
            <div className="text-xs text-gray-300 mt-0.5">{localParams.glowAlpha.toFixed(2)}</div>
          </div>
          
          {/* Decay Rate */}
          <div>
            <label className="block text-xs text-gray-200 mb-1">{t.decayRate}</label>
            <input
              type="range"
              min="0.01"
              max="0.1"
              step="0.005"
              value={localParams.decayRate}
              onChange={(e) => handleParamChangeDebounced('decayRate', parseFloat(e.target.value))}
              className="w-full h-0.5 bg-white/10 rounded-full appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #9ca3af 0%, #9ca3af ${(localParams.decayRate - 0.01) / 0.09 * 100}%, rgba(255,255,255,0.1) ${(params.decayRate - 0.01) / 0.09 * 100}%, rgba(255,255,255,0.1) 100%)`
              }}
            />
            <div className="text-xs text-gray-300 mt-0.5">{localParams.decayRate.toFixed(3)}</div>
          </div>
        </div>
      </div>
      
      {/* Camera Controls Tab */}
      <div className="mb-6">
        <h4 className="text-xs font-medium mb-2 text-emerald-300">{t.camera}</h4>
        
        <div>
          <label className="block text-xs text-gray-200 mb-1">{t.distance}</label>
          <input
            type="range"
            min="5"
            max="30"
            step="0.1"
            value={params.cameraZ}
            onChange={(e) => onParamChange('cameraZ', parseFloat(e.target.value))}
            className="w-full h-0.5 bg-white/10 rounded-full appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #9ca3af 0%, #9ca3af ${(localParams.cameraZ - 5) / 25 * 100}%, rgba(255,255,255,0.1) ${(params.cameraZ - 5) / 25 * 100}%, rgba(255,255,255,0.1) 100%)`
            }}
          />
          <div className="text-xs text-gray-300 mt-0.5">{localParams.cameraZ.toFixed(1)}</div>
        </div>
      </div>
      
      {/* Reset Button */}
      <button
        onClick={handleReset}
        className="w-full py-1 px-2 bg-red-500/20 hover:bg-red-500/30 text-white rounded-lg transition-colors font-medium text-xs border border-red-500/30"
      >
        {t.reset}
      </button>
      
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 0 0 1px rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .slider::-moz-range-thumb {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 0 1px rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  )
}

export default ModernControlPanel
