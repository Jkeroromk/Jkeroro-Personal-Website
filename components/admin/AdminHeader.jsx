'use client'

import React from 'react'
import { Image, Music, FolderKanban, MessageSquare, Heart, Database } from 'lucide-react'

const tabMeta = {
  images:      { label: 'Images',      icon: Image },
  music:       { label: 'Music',       icon: Music },
  projects:    { label: 'Projects',    icon: FolderKanban },
  comments:    { label: 'Comments',    icon: MessageSquare },
  anniversary: { label: 'Anniversary', icon: Heart },
  supabase:    { label: 'Database',    icon: Database },
}

const AdminHeader = ({ activeTab, isOnline, lastActivity }) => {
  const meta = tabMeta[activeTab] || tabMeta.images
  const Icon = meta.icon

  return (
    <header className="flex items-center justify-between h-16 px-6 lg:px-8 border-b border-white/5 flex-shrink-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 pl-10 lg:pl-0">
        <span className="text-xs text-zinc-500">Dashboard</span>
        <span className="text-zinc-700">/</span>
        <div className="flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-sm font-medium text-white">{meta.label}</span>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2">
        <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
        <span className="text-xs text-zinc-500">
          {isOnline ? 'Online' : lastActivity ? `Last active ${lastActivity}` : 'Offline'}
        </span>
      </div>
    </header>
  )
}

export default AdminHeader
