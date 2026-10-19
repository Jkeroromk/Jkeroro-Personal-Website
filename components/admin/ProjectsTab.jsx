'use client'

import React from 'react'
import { SortableList, SortableItem, SortableHandle } from '@/components/admin/Sortable'
import { Edit2, Trash2, FolderKanban, Plus, GripVertical, ExternalLink, Pin } from 'lucide-react'
import Image from 'next/image'

const categoryStyles = {
  personal: 'bg-violet-500/10 text-violet-400 border border-violet-500/20',
  work:      'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  school:    'bg-sky-500/10 text-sky-400 border border-sky-500/20',
}

// 置顶按钮：置顶的项目在首页永远排在最前面
const PinButton = ({ project, onTogglePin, className = '' }) => (
  <button
    type="button"
    onPointerDown={(e) => e.stopPropagation()}
    onClick={(e) => {
      e.stopPropagation()
      onTogglePin?.(project)
    }}
    title={project.pinned ? 'Unpin' : 'Pin to top'}
    aria-label={project.pinned ? `Unpin ${project.title}` : `Pin ${project.title} to top`}
    aria-pressed={Boolean(project.pinned)}
    className={`transition-colors ${
      project.pinned
        ? 'text-amber-300 bg-amber-400/15 hover:bg-amber-400/25'
        : 'text-zinc-400 hover:text-white hover:bg-white/10'
    } ${className}`}
  >
    <Pin className={`w-3.5 h-3.5 ${project.pinned ? 'fill-current' : ''}`} />
  </button>
)

const PinnedChip = () => (
  <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md font-medium bg-amber-400/10 text-amber-300 border border-amber-400/20">
    <Pin className="w-2.5 h-2.5 fill-current" />
    Pinned
  </span>
)

const ProjectsTab = ({ projects, onEdit, onDelete, onAddNew, onReorder, onTogglePin }) => {
  const pinnedCount = projects.filter((p) => p.pinned).length
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">Projects</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            {projects.length} project{projects.length !== 1 ? 's' : ''}
            {pinnedCount > 0 && ` · ${pinnedCount} pinned`} · pinned projects always show first on the homepage
          </p>
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
          <SortableList
            items={projects}
            getKey={(project) => project.id}
            onReorder={onReorder}
            axis="grid"
            className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {(project) => {
                const catStyle = categoryStyles[project.category] || 'bg-zinc-700/30 text-zinc-400 border border-zinc-600/20'
                return (
                  <SortableItem
                    key={project.id}
                    id={project.id}
                    dragFromAnywhere
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="group relative rounded-xl overflow-hidden border border-white/5 hover:border-white/10 bg-zinc-900 transition-colors"
                    draggingClassName="!border-indigo-500/60 ring-1 ring-indigo-500/30"
                  >
                    {/* Drag handle */}
                    <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <div className="p-1 rounded bg-black/60 backdrop-blur-sm">
                        <GripVertical className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>

                    {/* 置顶按钮：已置顶的一直显示，没置顶的鼠标移上来才显示 */}
                    <div className={`absolute top-2 right-2 z-20 transition-opacity ${project.pinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                      <PinButton project={project} onTogglePin={onTogglePin} className="p-1.5 rounded-md backdrop-blur-sm bg-black/50" />
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
                          draggable={false}
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
                        <span className="flex items-center gap-1.5">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${catStyle}`}>
                            {project.category}
                          </span>
                          {project.pinned && <PinnedChip />}
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
                  </SortableItem>
                )
              }}
          </SortableList>

          {/* Mobile list */}
          <SortableList
            items={projects}
            getKey={(project) => project.id}
            onReorder={onReorder}
            axis="y"
            className="md:hidden rounded-xl border border-white/5 bg-zinc-900 divide-y divide-white/5"
          >
            {(project) => {
                const catStyle = categoryStyles[project.category] || 'bg-zinc-700/30 text-zinc-400 border border-zinc-600/20'
                return (
                  <SortableItem
                    key={project.id}
                    id={project.id}
                    className="flex items-center gap-3 px-4 py-3 bg-zinc-900 first:rounded-t-xl last:rounded-b-xl"
                    draggingClassName="!bg-zinc-800 rounded-xl ring-1 ring-indigo-500/40"
                  >
                    <SortableHandle className="-ml-1 p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-white/5 flex-shrink-0">
                      <GripVertical className="w-4 h-4" />
                    </SortableHandle>
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
                        {project.pinned && <PinnedChip />}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <PinButton project={project} onTogglePin={onTogglePin} className="p-1.5 rounded-md" />
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
                  </SortableItem>
                )
              }}
          </SortableList>
        </>
      )}
    </div>
  )
}

export default ProjectsTab
