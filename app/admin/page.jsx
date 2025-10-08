'use client'

import React from 'react'
import { AuthProvider } from '../../auth'
import AdminPageContent from '@/components/admin/AdminPageContent'

const AdminPage = () => {
  return (
    <AuthProvider>
      <AdminPageContent />
    </AuthProvider>
  )
}

export default AdminPage