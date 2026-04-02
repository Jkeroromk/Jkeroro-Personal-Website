'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Edit2, Trash2, Music2, GripVertical, AlertTriangle, Upload, AlignLeft } from 'lucide-react'
import FileUploadModal from '@/components/admin/modals/FileUploadModal'

const STEP = 0.5

const MusicTab = ({ tracks, onEdit, onDelete, onAdd, onReorder, onImported }) => {
  const [draggedIndex, setDraggedIndex] = React.useState(null)
  const [dragOverIndex, setDragOverIndex] = React.useState(null)
  const [showUploadModal, setShowUploadModal] = React.useState(false)
  const [offsets, setOffsets] = React.useState({})
  const [expandedTrack, setExpandedTrack] = React.useState(null)
  const debounceTimers = React.useRef({})

  // 初始化 offsets 从 tracks 数据（DB）
  React.useEffect(() => {
    if (!tracks?.length) return
    const map = {}
    tracks.forEach(t => { if (t.lyricsOffset) map[t.id] = t.lyricsOffset })
    setOffsets(map)
  }, [tracks])

  const saveOffsetToDb = React.useCallback((trackId, offset) => {
    clearTimeout(debounceTimers.current[trackId])
    debounceTimers.current[trackId] = setTimeout(() => {
      fetch(`/api/media/tracks/${trackId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lyricsOffset: offset }),
      }).catch(() => {})
    }, 600)
  }, [])

  const adjustOffset = (trackId, delta) => {
    setOffsets(prev => {
      const current = typeof prev[trackId] === 'number' ? prev[trackId] : 0
      const next = Math.round((current + delta) * 10) / 10
      saveOffsetToDb(trackId, next)
      const updated = { ...prev }
      if (next === 0) delete updated[trackId]
      else updated[trackId] = next
      return updated
    })
  }

  const resetOffset = (trackId) => {
    setOffsets(prev => {
      const updated = { ...prev }
      delete updated[trackId]
      saveOffsetToDb(trackId, 0)
      return updated
    })
  }

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
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
        >
          <Upload className="w-4 h-4" />
          上传音频
        </button>
      </div>

      {showUploadModal && (
        <FileUploadModal
          onClose={() => setShowUploadModal(false)}
          onImported={(track) => {
            setShowUploadModal(false)
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
          <p className="text-xs text-zinc-500 mb-4">使用上方 YouTube 导入按钮添加曲目</p>
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
              >
                {/* Main row */}
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  className={[
                    'flex items-center gap-3 px-4 py-3 group cursor-grab active:cursor-grabbing transition-colors',
                    index !== tracks.length - 1 || expandedTrack === track.id ? 'border-b border-white/5' : '',
                    isDragging ? 'bg-indigo-500/10 opacity-60' :
                    isDragOver ? 'bg-white/5' :
                                 'hover:bg-white/[0.03]',
                  ].join(' ')}
                >
                  <GripVertical className="w-4 h-4 text-zinc-700 group-hover:text-zinc-500 flex-shrink-0 transition-colors" />

                  <span className="w-5 text-center text-xs font-mono text-zinc-600 flex-shrink-0">
                    {index + 1}
                  </span>

                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                    <Music2 className="w-4 h-4 text-indigo-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{track.title}</p>
                    <p className="text-xs text-zinc-500 truncate">{track.subtitle}</p>
                  </div>

                  <span className="text-xs text-zinc-600 flex-shrink-0 hidden sm:block">
                    {getFileSizeEstimate(track.src)}
                  </span>

                  {/* Actions */}
                  <div
                    className="flex items-center gap-1 flex-shrink-0"
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    {/* 歌词校准按钮 */}
                    <button
                      onClick={() => setExpandedTrack(expandedTrack === track.id ? null : track.id)}
                      className={`p-1.5 rounded-md transition-colors ${
                        expandedTrack === track.id
                          ? 'text-indigo-400 bg-indigo-500/10'
                          : offsets[track.id]
                            ? 'text-indigo-400 opacity-100'
                            : 'text-zinc-600 opacity-0 group-hover:opacity-100 hover:text-zinc-300 hover:bg-white/10'
                      }`}
                      title="歌词同步校准"
                    >
                      <AlignLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onEdit(track, 'track')}
                      className="p-1.5 rounded-md text-zinc-400 opacity-0 group-hover:opacity-100 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(track.id, 'track')}
                      className="p-1.5 rounded-md text-zinc-400 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 歌词校准展开行 */}
                {expandedTrack === track.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.15 }}
                    className="px-4 pb-3 border-t border-white/5 bg-white/[0.02]"
                  >
                    <div className="pt-3 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-medium text-white">歌词同步校准</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                          负值 = 歌词提前显示　正值 = 歌词延后显示
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => adjustOffset(track.id, -STEP)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-sm font-medium transition-colors"
                        >
                          −
                        </button>
                        <button
                          onClick={() => offsets[track.id] && resetOffset(track.id)}
                          className={`min-w-[52px] h-7 px-2 rounded-lg text-xs font-mono text-center transition-colors ${
                            offsets[track.id]
                              ? 'bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 cursor-pointer'
                              : 'bg-white/5 text-zinc-600 cursor-default'
                          }`}
                          title={offsets[track.id] ? '点击归零' : '无偏移'}
                        >
                          {(() => {
                            const v = offsets[track.id] || 0
                            return v > 0 ? `+${v}s` : v < 0 ? `${v}s` : '0s'
                          })()}
                        </button>
                        <button
                          onClick={() => adjustOffset(track.id, STEP)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-sm font-medium transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default MusicTab
