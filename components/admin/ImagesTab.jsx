'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Edit2, Trash2, ImageIcon, Plus, GripVertical } from 'lucide-react'
import Image from 'next/image'

const ImagesTab = ({ images, onEdit, onDelete, onAddNew, onReorder }) => {
  const [draggedIndex, setDraggedIndex] = React.useState(null)
  const [dragOverIndex, setDragOverIndex] = React.useState(null)
  const [localImages, setLocalImages] = React.useState(images)

  React.useEffect(() => {
    setLocalImages(images)
  }, [images])

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
    setLocalImages(images)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">Images</h2>
          <p className="text-xs text-zinc-500 mt-0.5">{images.length} image{images.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => onAddNew('image')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Image
        </button>
      </div>

      {/* Empty state */}
      {images.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-white/10 bg-white/[0.02]">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
            <ImageIcon className="w-5 h-5 text-zinc-500" />
          </div>
          <p className="text-sm font-medium text-white mb-1">No images yet</p>
          <p className="text-xs text-zinc-500 mb-4">Upload images to your gallery</p>
          <button
            onClick={() => onAddNew('image')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add first image
          </button>
        </div>
      )}

      {/* Desktop grid */}
      {images.length > 0 && (
        <>
          <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {localImages.map((image, index) => {
                const isDragging = draggedIndex === index
                const isDragOver = dragOverIndex === index
                const originalIndex = images.findIndex(img => img.id === image.id)

                return (
                  <motion.div
                    key={image.id}
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
                      'group relative rounded-xl overflow-hidden border transition-all duration-150 cursor-grab active:cursor-grabbing',
                      isDragging ? 'border-indigo-500/50 ring-1 ring-indigo-500/30' :
                      isDragOver ? 'border-indigo-400/60 ring-1 ring-indigo-400/20 scale-[1.02]' :
                                   'border-white/5 hover:border-white/10 bg-zinc-900',
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
                      {image.src?.trim() ? (
                        <Image
                          src={image.src}
                          alt={image.alt}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          className="object-contain transition-transform duration-300 group-hover:scale-105"
                          unoptimized={image.src.startsWith('/api/file/') || image.src.startsWith('https://')}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-zinc-600" />
                        </div>
                      )}

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={() => onEdit(image, 'image')}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-medium backdrop-blur-sm transition-colors"
                        >
                          <Edit2 className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete(image.id, 'image')}
                          className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-300 backdrop-blur-sm transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="px-3 py-2.5 bg-zinc-900">
                      <p className="text-xs font-medium text-white truncate">{image.alt}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{image.width} × {image.height}</p>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          {/* Mobile list */}
          <div className="md:hidden rounded-xl border border-white/5 bg-zinc-900 overflow-hidden">
            <AnimatePresence mode="popLayout">
              {localImages.map((image, index) => {
                const isDragging = draggedIndex === index
                const isDragOver = dragOverIndex === index
                const originalIndex = images.findIndex(img => img.id === image.id)

                return (
                  <motion.div
                    key={image.id}
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
                      index !== localImages.length - 1 ? 'border-b border-white/5' : '',
                      isDragOver ? 'bg-white/5' : 'hover:bg-white/[0.03]',
                    ].join(' ')}
                  >
                    <GripVertical className="w-4 h-4 text-zinc-700 flex-shrink-0" />
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 relative flex-shrink-0">
                      {image.src?.trim() ? (
                        <Image
                          src={image.src}
                          alt={image.alt}
                          fill
                          sizes="40px"
                          className="object-cover"
                          unoptimized={image.src.startsWith('/api/file/') || image.src.startsWith('https://')}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-4 h-4 text-zinc-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{image.alt}</p>
                      <p className="text-xs text-zinc-500">{image.width} × {image.height}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => onEdit(image, 'image')}
                        className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(image.id, 'image')}
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

export default ImagesTab
