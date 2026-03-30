'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Image,
  Music,
  FolderKanban,
  MessageSquare,
  Heart,
  Database,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const menuItems = [
  { id: 'images',      label: 'Images',      icon: Image,          category: 'Content' },
  { id: 'music',       label: 'Music',       icon: Music,          category: 'Content' },
  { id: 'projects',    label: 'Projects',    icon: FolderKanban,   category: 'Content' },
  { id: 'comments',    label: 'Comments',    icon: MessageSquare,  category: 'Content' },
  { id: 'anniversary', label: 'Anniversary', icon: Heart,          category: 'Content' },
  { id: 'supabase',    label: 'Database',    icon: Database,       category: 'System' },
]

export default function AdminSidebar({ activeTab, onTabChange, onLogout }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024)
    checkDesktop()
    window.addEventListener('resize', checkDesktop)
    return () => window.removeEventListener('resize', checkDesktop)
  }, [])

  const handleTabClick = (tabId) => {
    onTabChange(tabId)
    setIsMobileOpen(false)
  }

  const contentGroups = {
    Content: menuItems.filter(i => i.category === 'Content'),
    System:  menuItems.filter(i => i.category === 'System'),
  }

  const SidebarContent = () => (
    <div className="h-full flex flex-col">
      {/* Brand */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center">
            <LayoutDashboard className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-white tracking-wide">Admin</span>
        </div>
        <button
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden p-1.5 rounded-md hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {Object.entries(contentGroups).map(([group, items]) => (
          <div key={group}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
              {group}
            </p>
            <div className="space-y-0.5">
              {items.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 group",
                      isActive
                        ? "bg-indigo-500/10 text-indigo-400"
                        : "text-zinc-400 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <Icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-300")} />
                    <span className="font-medium">{item.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400"
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/5 flex-shrink-0">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile toggle */}
      {!isMobileOpen && (
        <button
          onClick={() => setIsMobileOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-zinc-900 border border-white/10 rounded-lg text-white hover:bg-zinc-800 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: isDesktop ? 0 : (isMobileOpen ? 0 : '-100%') }}
        transition={{ type: 'spring', damping: 30, stiffness: 250 }}
        className="fixed lg:sticky top-0 left-0 h-screen w-56 bg-zinc-950 border-r border-white/5 z-40 flex-shrink-0"
      >
        <SidebarContent />
      </motion.aside>
    </>
  )
}
