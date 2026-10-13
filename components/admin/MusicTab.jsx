'use client'

import React from 'react'
import { SortableList, SortableItem, SortableHandle } from '@/components/admin/Sortable'
import { Edit2, Trash2, Music2, GripVertical, AlertTriangle, Upload, Eraser } from 'lucide-react'
import FileUploadModal from '@/components/admin/modals/FileUploadModal'
import StorageCleanupModal from '@/components/admin/modals/StorageCleanupModal'

const MusicTab = ({ tracks, onEdit, onDelete, onAdd, onReorder, onImported }) => {
  const [showUploadModal, setShowUploadModal] = React.useState(false)
  const [showCleanupModal, setShowCleanupModal] = React.useState(false)

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
            onClick={() => setShowCleanupModal(true)}
            title="删除 Storage 里已经没有歌曲或图片在用的文件"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-sm font-medium transition-colors"
          >
            <Eraser className="w-4 h-4" />
            清理文件
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
          >
            <Upload className="w-4 h-4" />
            上传音频
          </button>
        </div>
      </div>

      {showCleanupModal && <StorageCleanupModal onClose={() => setShowCleanupModal(false)} />}

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
          <p className="text-xs text-zinc-500 mb-4">点上方「上传音频」添加曲目</p>
        </div>
      ) : (
        <SortableList
          items={tracks}
          getKey={(t) => t.id}
          onReorder={onReorder}
          axis="y"
          className="rounded-xl border border-white/5 bg-zinc-900 divide-y divide-white/5"
        >
          {(track, index) => (
            <SortableItem
              key={track.id}
              id={track.id}
              className="flex items-center gap-3 px-4 py-3 group bg-zinc-900 first:rounded-t-xl last:rounded-b-xl hover:bg-zinc-800/60 transition-colors"
              draggingClassName="!bg-zinc-800 rounded-xl ring-1 ring-indigo-500/40"
            >
              <SortableHandle className="-ml-1 p-1 rounded-md text-zinc-600 group-hover:text-zinc-400 hover:!text-white hover:bg-white/5 flex-shrink-0 transition-colors">
                <GripVertical className="w-4 h-4" />
              </SortableHandle>

              <span className="w-5 text-center text-xs font-mono text-zinc-600 flex-shrink-0 tabular-nums">
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
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => onEdit(track, 'track')}
                  aria-label="Edit track"
                  className="p-1.5 rounded-md text-zinc-400 sm:opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-white hover:bg-white/10 transition"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDelete(track.id, 'track')}
                  aria-label="Delete track"
                  className="p-1.5 rounded-md text-zinc-400 sm:opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-red-400 hover:bg-red-500/10 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </SortableItem>
          )}
        </SortableList>
      )}
    </div>
  )
}

export default MusicTab
