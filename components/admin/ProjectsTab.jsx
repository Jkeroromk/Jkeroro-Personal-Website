'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Edit2, Trash2, FolderKanban, Plus, GripVertical, ExternalLink } from 'lucide-react'
import Image from 'next/image'

const categoryStyles = {
  personal: 'bg-violet-500/10 text-violet-400 border border-violet-500/20',
  work:      'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  school:    'bg-sky-500/10 text-sky-400 border border-sky-500/20',
}

const ProjectsTab = ({ projects, onEdit, onDelete, onAddNew, onReorder }) => {
  const [draggedIndex, setDraggedIndex] = React.useState(null)
  const [dragOverIndex, setDragOverIndex] = React.useState(null)
  const [localProjects, setLocalProjects] = React.useState(projects)

  React.useEffect(() => {
    setLocalProjects(projects)
  }, [projects])

  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('text/plain', index.toString())
    e.dataTransfer.effectAllowed = 'move'
    const ghost = document.createElement('div')
    ghost.style.cssText = 'position:absolute;top:-9999px;width:80px;height:80px;background:rgba(99,102,241,0.2);border:2px dashed #6366f1;border-radius:8px;'
    document.body.appendChild(ghost)
    e.dataTransfer.setDragImage(ghost, 40, 40)
    setTimeout(() => document.body.contains(ghost) && document.body.removeChild(ghost), 0)
    setDraggedIndex(index)
    e.currentTarget.style.opacity = '0.4'
  }

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1'
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    if (index !== draggedIndex && draggedIndex !== null) setDragOverIndex(index)
  }

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setDragOverIndex(null)
  }

  const handleDrop = (e, dropIndex) => {
    e.preventDefault()
    e.stopPropagation()
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'))
    if (dragIndex !== dropIndex && dragIndex !== null && onReorder) onReorder(dragIndex, dropIndex)
    setDraggedIndex(null)
    setDragOverIndex(null)
    setLocalProjects(projects)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">Projects</h2>
          <p className="text-xs text-zinc-500 mt-0.5">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => onAddNew('project')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Project
        </button>
      </div>

      {/* Empty state */}
      {projects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-white/10 bg-white/[0.02]">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
            <FolderKanban className="w-5 h-5 text-zinc-500" />
          </div>
          <p className="text-sm font-medium text-white mb-1">No projects yet</p>
          <p className="text-xs text-zinc-500 mb-4">Showcase your work</p>
          <button
            onClick={() => onAddNew('project')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add first project
          </button>
        </div>
      )}

      {/* Desktop grid */}
      {projects.length > 0 && (
        <>
          <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {localProjects.map((project, index) => {
                const isDragging = draggedIndex === index
                const isDragOver = dragOverIndex === index
                const originalIndex = projects.findIndex(p => p.id === project.id)
                const catStyle = categoryStyles[project.category] || 'bg-zinc-700/30 text-zinc-400 border border-zinc-600/20'

                return (
                  <motion.div
                    key={project.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: isDragging ? 0.4 : 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.15 }}
                    draggable
                    onDragStart={(e) => handleDragStart(e, originalIndex)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, originalIndex)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, originalIndex)}
                    className={[
                      'group relative rounded-xl overflow-hidden border transition-all duration-150 cursor-grab active:cursor-grabbing bg-zinc-900',
                      isDragging ? 'border-indigo-500/50 ring-1 ring-indigo-500/30' :
                      isDragOver ? 'border-indigo-400/60 ring-1 ring-indigo-400/20 scale-[1.02]' :
                                   'border-white/5 hover:border-white/10',
                    ].join(' ')}
                  >
                    {/* Drag handle */}
                    <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="p-1 rounded bg-black/60 backdrop-blur-sm">
                        <GripVertical className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>

                    {/* Image */}
                    <div className="relative aspect-square bg-zinc-800/50">
                      {project.image?.trim() ? (
                        <Image
                          src={project.image}
                          alt={project.title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          className="object-contain transition-transform duration-300 group-hover:scale-105"
                          unoptimized={project.image.startsWith('/api/file/') || project.image.startsWith('https://')}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FolderKanban className="w-8 h-8 text-zinc-600" />
                        </div>
                      )}

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={() => onEdit(project, 'project')}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-medium backdrop-blur-sm transition-colors"
                        >
                          <Edit2 className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete(project.id, 'project')}
                          className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-300 backdrop-blur-sm transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="px-3 py-2.5">
                      <p className="text-xs font-semibold text-white truncate mb-1">{project.title}</p>
                      <p className="text-[10px] text-zinc-500 line-clamp-2 mb-2">{project.description}</p>
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${catStyle}`}>
                          {project.category}
                        </span>
                        {project.link && (
                          <a
                            href={project.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-zinc-500 hover:text-indigo-400 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          {/* Mobile list */}
          <div className="md:hidden rounded-xl border border-white/5 bg-zinc-900 overflow-hidden">
            <AnimatePresence mode="popLayout">
              {localProjects.map((project, index) => {
                const isDragging = draggedIndex === index
                const isDragOver = dragOverIndex === index
                const originalIndex = projects.findIndex(p => p.id === project.id)
                const catStyle = categoryStyles[project.category] || 'bg-zinc-700/30 text-zinc-400 border border-zinc-600/20'

                return (
                  <motion.div
                    key={project.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isDragging ? 0.4 : 1 }}
                    exit={{ opacity: 0 }}
                    draggable
                    onDragStart={(e) => handleDragStart(e, originalIndex)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, originalIndex)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, originalIndex)}
                    className={[
                      'flex items-center gap-3 px-4 py-3 transition-colors cursor-grab',
                      index !== localProjects.length - 1 ? 'border-b border-white/5' : '',
                      isDragOver ? 'bg-white/5' : 'hover:bg-white/[0.03]',
                    ].join(' ')}
                  >
                    <GripVertical className="w-4 h-4 text-zinc-700 flex-shrink-0" />
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 relative flex-shrink-0">
                      {project.image?.trim() ? (
                        <Image
                          src={project.image}
                          alt={project.title}
                          fill
                          sizes="40px"
                          className="object-contain"
                          unoptimized={project.image.startsWith('/api/file/') || project.image.startsWith('https://')}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FolderKanban className="w-4 h-4 text-zinc-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{project.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${catStyle}`}>
                          {project.category}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => onEdit(project, 'project')}
                        className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(project.id, 'project')}
                        className="p-1.5 rounded-md text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  )
}

export default ProjectsTab
