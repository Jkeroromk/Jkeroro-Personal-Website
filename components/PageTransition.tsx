'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface PageTransitionProps {
  children: ReactNode
  className?: string
}

const PageTransition = ({ children, className = '' }: PageTransitionProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ 
        duration: 0.6, 
        ease: [0.25, 0.46, 0.45, 0.94] // 自定义缓动曲线
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default PageTransition
