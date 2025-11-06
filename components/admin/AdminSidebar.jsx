'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Image, 
  Music, 
  FolderKanban, 
  MessageSquare, 
  Heart, 
  Database,
  Menu,
  X,
  ChevronRight,
  LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'

const menuItems = [
  {
    id: 'images',
    label: 'Images',
    icon: Image,
    category: 'Content'
  },
  {
    id: 'music',
    label: 'Music',
    icon: Music,
    category: 'Content'
  },
  {
    id: 'projects',
    label: 'Projects',
    icon: FolderKanban,
    category: 'Content'
  },
  {
    id: 'comments',
    label: 'Comments',
    icon: MessageSquare,
    category: 'Content'
  },
  {
    id: 'anniversary',
    label: 'Anniversary',
    icon: Heart,
    category: 'Content'
  },
  {
    id: 'supabase',
    label: 'Database',
    icon: Database,
    category: 'System'
  },
]

export default function AdminSidebar({ activeTab, onTabChange, onLogout }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState({
    Content: true,
    System: true,
  })

  // Check if desktop on mount
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024)
    }
    checkDesktop()
    window.addEventListener('resize', checkDesktop)
    return () => window.removeEventListener('resize', checkDesktop)
  }, [])

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  const categories = {
    Content: menuItems.filter(item => item.category === 'Content'),
    System: menuItems.filter(item => item.category === 'System'),
  }

  const handleTabClick = (tabId) => {
    onTabChange(tabId)
    setIsMobileOpen(false)
  }

  const SidebarContent = () => (
    <div className="h-full flex flex-col">
      {/* Header with close button on mobile */}
      <div className="p-6 border-b border-gray-700 flex items-center justify-between">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white">Admin Panel</h2>
          <p className="text-sm text-gray-400 mt-1 hidden lg:block">Manage your content</p>
        </div>
        {/* Close button - only show on mobile */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden p-2 hover:bg-gray-800 rounded-lg transition-colors"
          aria-label="Close menu"
        >
          <X className="w-5 h-5 text-gray-400 hover:text-white" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {Object.entries(categories).map(([category, items]) => (
          <div key={category}>
            <button
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors"
            >
              <span>{category}</span>
              <ChevronRight
                className={cn(
                  "w-4 h-4 transition-transform",
                  expandedCategories[category] && "rotate-90"
                )}
              />
            </button>
            {expandedCategories[category] && (
              <div className="mt-2 space-y-1">
                {items.map((item) => {
                  const Icon = item.icon
                  const isActive = activeTab === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabClick(item.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                        isActive
                          ? "bg-white text-black font-medium"
                          : "text-gray-300 hover:bg-gray-800 hover:text-white"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Menu Button - Only show when sidebar is closed */}
      {!isMobileOpen && (
        <button
          onClick={() => setIsMobileOpen(true)}
          className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-gray-800 rounded-lg text-white hover:bg-gray-700 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      )}

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isDesktop ? 0 : (isMobileOpen ? 0 : '100%'),
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={cn(
          "fixed lg:sticky top-0 right-0 h-screen w-64 bg-gray-900 border-l border-gray-700 z-40"
        )}
      >
        <SidebarContent />
      </motion.aside>
    </>
  )
}

