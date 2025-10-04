'use client'

import React from 'react'
import { motion } from 'framer-motion'
import MouseTrail from '@/components/mousetrail'
import Interact from '@/components/interact'
import NavigationBar from '@/components/NavigationBar'
import { ControlPanelProvider } from '@/contexts/ControlPanelContext'

const HomeLayout = ({ children }) => {
  // 确保页面滚动到顶部
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0)
    }
  }, [])

  return (
    <ControlPanelProvider>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="min-h-screen"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          onAnimationComplete={() => {
            // 确保MouseTrail在动画完成后初始化
            setTimeout(() => {
              // 确保在客户端环境运行
              if (typeof window === 'undefined') return
              
              // 使用记录的鼠标位置或屏幕中心
              const mouseX = window.lastMouseX || window.innerWidth / 2;
              const mouseY = window.lastMouseY || window.innerHeight / 2;
              
              const event = new MouseEvent('mousemove', {
                clientX: mouseX,
                clientY: mouseY
              });
              window.dispatchEvent(event);
            }, 100);
          }}
        >
          <MouseTrail/>
          <Interact/>
          <NavigationBar/>
        </motion.div>
        
        {children}
      </motion.div>
    </ControlPanelProvider>
  )
}

export default HomeLayout
