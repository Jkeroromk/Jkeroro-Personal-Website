'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Settings } from 'lucide-react'

const AdminHeader = ({ isOnline, lastActivity }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 px-4 sm:px-6 lg:px-8 pt-6 border-b border-gray-800"
    >
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center">
          <Settings className="w-6 h-6 lg:w-8 lg:h-8 mr-3" />
          Admin Dashboard
        </h1>
        <p className="text-sm lg:text-base text-gray-400 mt-2">
          Manage your website content, images, and music
          {!isOnline && lastActivity && (
            <span className="ml-2 text-yellow-400">
              • Last active: {lastActivity}
            </span>
          )}
        </p>
      </div>
    </motion.div>
  )
}

export default AdminHeader
