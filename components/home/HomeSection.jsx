'use client'

import React from 'react'
import { motion } from 'framer-motion'

const HomeSection = ({ children, delay = 0.1, className = "" }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px 0px" }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      style={{ overflow: 'visible' }}
    >
      {children}
    </motion.div>
  )
}

export default HomeSection
