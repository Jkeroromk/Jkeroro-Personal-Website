'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Edit2, Trash2, Music2, Plus, GripVertical, AlertTriangle, Youtube } from 'lucide-react'
import YoutubeImportModal from '@/components/admin/modals/YoutubeImportModal'

const MusicTab = ({ tracks, onEdit, onDelete, onAdd, onReorder, onImported }) => {
  const [draggedIndex, setDraggedIndex] = React.useState(null)
  const [dragOverIndex, setDragOverIndex] = React.useState(null)
  const [showYoutubeModal, setShowYoutubeModal] = React.useState(false)

  const getFileSizeEstimate = (src) => {
    const fileName = src.split('/').pop() || ''
    if (fileName.includes('Everybody')) return '4.9 MB'
    if (fileName.includes('Leessang')) return '5.4 MB'
    if (fileName.includes('ReawakeR')) return '4.5 MB'
    if (fileName.includes('SPECIALZ')) return '1.9 MB'
    if (fileName.includes('Work')) return '4.8 MB'
    if (fileName.includes('2hollis')) return '3.2 MB'
    if (fileName.includes('ICEDMANE')) return '4.1 MB'
    if (fileName.includes('Instruments_of_Retribution')) return '5.8 MB'
    if (fileName.endsWith('.mp3')) return '~4 MB'
    if (fileName.endsWith('.wav')) return '~8 MB'
    if (fileName.endsWith('.flac')) return '~6 MB'
    return '~3 MB'
  }

  const totalSize = tracks.reduce((t, track) => {
    return t + parseFloat(getFileSizeEstimate(track.src).replace(/[~MB\s]/g, ''))
  }, 0)

  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('text/plain', index)
    e.dataTransfer.effectAllowed = 'move'
    const ghost = document.createElement('img')
    ghost.style.display = 'none'
    document.body.appendChild(ghost)
    e.dataTransfer.setDragImage(ghost, 0, 0)
    setTimeout(() => document.body.contains(ghost) && document.body.removeChild(ghost), 0)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (index !== draggedIndex) setDragOverIndex(index)
  }

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setDragOverIndex(null)
  }

  const handleDrop = (e, dropIndex) => {
    e.preventDefault()
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'))
    if (dragIndex !== dropIndex && onReorder) onReorder(dragIndex, dropIndex)
    setDragOverIndex(null)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">Music Library</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            {tracks.length} track{tracks.length !== 1 ? 's' : ''} · ~{totalSize.toFixed(1)} MB total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowYoutubeModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors"
          >
            <Youtube className="w-4 h-4" />
            YouTube
          </button>
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Track
          </button>
        </div>
      </div>

      {showYoutubeModal && (
        <YoutubeImportModal
          onClose={() => setShowYoutubeModal(false)}
          onImported={(track) => {
            setShowYoutubeModal(false)
            onImported?.(track)
          }}
        />
      )}

      {/* Warning */}
      {tracks.length > 8 && (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300/80">
            <span className="font-medium text-amber-300">Performance tip:</span> You have {tracks.length} tracks (~{totalSize.toFixed(1)} MB). Consider keeping under 8 for optimal load speed.
          </p>
        </div>
      )}

      {/* Track list */}
      {tracks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-white/10 bg-white/[0.02]">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
            <Music2 className="w-5 h-5 text-zinc-500" />
          </div>
          <p className="text-sm font-medium text-white mb-1">No tracks yet</p>
          <p className="text-xs text-zinc-500 mb-4">Upload MP3, WAV, OGG or M4A files</p>
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add first track
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-white/5 bg-zinc-900 overflow-hidden">
          {tracks.map((track, index) => {
            const isDragging = draggedIndex === index
            const isDragOver = dragOverIndex === index

            return (
              <motion.div
                key={track.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.04 }}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                className={[
                  'flex items-center gap-3 px-4 py-3 group cursor-grab active:cursor-grabbing transition-colors',
                  index !== tracks.length - 1 ? 'border-b border-white/5' : '',
                  isDragging  ? 'bg-indigo-500/10 opacity-60' :
                  isDragOver  ? 'bg-white/5' :
                                'hover:bg-white/[0.03]',
                ].join(' ')}
              >
                {/* Drag handle */}
                <GripVertical className="w-4 h-4 text-zinc-700 group-hover:text-zinc-500 flex-shrink-0 transition-colors" />

                {/* Index */}
                <span className="w-5 text-center text-xs font-mono text-zinc-600 flex-shrink-0">
                  {index + 1}
                </span>

                {/* Icon */}
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                  <Music2 className="w-4 h-4 text-indigo-400" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{track.title}</p>
                  <p className="text-xs text-zinc-500 truncate">{track.subtitle}</p>
                </div>

                {/* Size */}
                <span className="text-xs text-zinc-600 flex-shrink-0 hidden sm:block">
                  {getFileSizeEstimate(track.src)}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEdit(track, 'track')}
                    className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete(track.id, 'track')}
                    className="p-1.5 rounded-md text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default MusicTab
