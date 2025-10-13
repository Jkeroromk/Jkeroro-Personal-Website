'use client'

import React from 'react'
import { motion } from 'framer-motion'

const HomeSection = ({ children, delay = 0.1, className = "" }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={className}
      style={{ overflow: 'visible' }}
    >
      {children}
    </motion.div>
  )
}

export default HomeSection
