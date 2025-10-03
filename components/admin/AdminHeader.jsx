'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Settings, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

const AdminHeader = ({ onLogout }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center">
            <Settings className="w-8 h-8 mr-3" />
            Admin Dashboard
          </h1>
          <p className="text-gray-400 mt-2">
            Manage your website content, images, and music
          </p>
        </div>
        <Button
          onClick={onLogout}
          variant="outline"
          className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </motion.div>
  )
}

export default AdminHeader
