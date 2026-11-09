'use client'

import React, { useRef, useState } from 'react'
import { SortableList, SortableItem, SortableHandle } from '@/components/admin/Sortable'
import { Edit2, Trash2, ImageIcon, Plus, GripVertical, RefreshCw, Loader2, Upload, Cloud } from 'lucide-react'
import AlbumSyncCard from '@/components/admin/AlbumSyncCard'
import Image from 'next/image'
import BulkImageUploadModal from '@/components/admin/modals/BulkImageUploadModal'
import { uploadImage, pickImageFiles } from '@/lib/upload-image'
import { useToast } from '@/hooks/use-toast'

// 首页每天随机显示几张（和 /api/media/images 里的 HOME_COUNT 一致）
const HOME_COUNT = 7

const ImagesTab = ({ images, onEdit, onDelete, onAddNew, onReorder, onBulkAdd, onReplace, onReload }) => {
  const { toast } = useToast()
  const pickRef = useRef(null)
  const replaceRef = useRef(null)
  const replaceTarget = useRef(null)
  const [bulkFiles, setBulkFiles] = useState(null) // null = 弹窗关着
  const [replacingId, setReplacingId] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const openBulk = (list) => {
    const files = pickImageFiles(list)
    if (files.length) setBulkFiles(files)
  }

  const startReplace = (image) => {
    replaceTarget.current = image
    replaceRef.current?.click()
  }

  const handleReplacePicked = async (e) => {
    const file = pickImageFiles(e.target.files)[0]
    e.target.value = ''
    const target = replaceTarget.current
    if (!file || !target) return
    setReplacingId(target.id)
    try {
      const uploaded = await uploadImage(file)
      await onReplace(target.id, uploaded)
      toast({ title: '已替换', description: target.alt ? `「${target.alt}」换成了新照片` : '照片已换成新的' })
    } catch (err) {
      toast({ title: '替换失败', description: err?.message || '请重试', variant: 'destructive' })
    } finally {
      setReplacingId(null)
    }
  }

  const replaceButton = (image, compact) => (
    <button
      onClick={(e) => { e.stopPropagation(); startReplace(image) }}
      disabled={replacingId !== null}
      title="换一张照片（位置和 caption 不变）"
      className={compact
        ? 'p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40'
        : 'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-medium backdrop-blur-sm transition-colors disabled:opacity-40'}
    >
      <RefreshCw className={compact ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
      {!compact && 'Replace'}
    </button>
  )

  return (
    <div
      className={`space-y-4 rounded-xl transition-shadow ${isDragOver ? 'ring-2 ring-indigo-500/60 ring-offset-4 ring-offset-zinc-950' : ''}`}
      onDragOver={(e) => {
        // 只响应从电脑拖进来的文件，不干扰卡片之间的拖动排序
        if (!Array.from(e.dataTransfer?.types || []).includes('Files')) return
        e.preventDefault()
        setIsDragOver(true)
      }}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setIsDragOver(false) }}
      onDrop={(e) => {
        if (!e.dataTransfer?.files?.length) return
        e.preventDefault()
        setIsDragOver(false)
        openBulk(e.dataTransfer.files)
      }}
    >
      <input
        ref={pickRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => { openBulk(e.target.files); e.target.value = '' }}
      />
      <input ref={replaceRef} type="file" accept="image/*" className="hidden" onChange={handleReplacePicked} />

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-white">Images</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            {images.length} image{images.length !== 1 ? 's' : ''}
            {images.length > HOME_COUNT ? ` · 首页每天随机显示 ${HOME_COUNT} 张` : ''}
            {' · 可以直接把照片拖到这里'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAddNew('image')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 text-zinc-300 hover:text-white text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add one
          </button>
          <button
            onClick={() => pickRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload photos
          </button>
        </div>
      </div>

      <AlbumSyncCard target="snapshots" label="Snapshots" onSynced={onReload} />

      {/* Empty state */}
      {images.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-white/10 bg-white/[0.02]">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
            <ImageIcon className="w-5 h-5 text-zinc-500" />
          </div>
          <p className="text-sm font-medium text-white mb-1">No images yet</p>
          <p className="text-xs text-zinc-500 mb-4">一次选一堆照片，或者直接拖进来</p>
          <button
            onClick={() => pickRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload photos
          </button>
        </div>
      )}

      {/* Desktop grid */}
      {images.length > 0 && (
        <>
          <SortableList
            items={images}
            getKey={(image) => image.id}
            onReorder={onReorder}
            axis="grid"
            className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {(image) => {
                return (
                  <SortableItem
                    key={image.id}
                    id={image.id}
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

                    {image.source === 'icloud' && (
                      <div className="absolute top-2 right-2 z-10 p-1 rounded bg-black/60 backdrop-blur-sm" title="来自 iCloud 共享相簿">
                        <Cloud className="w-3.5 h-3.5 text-sky-300" />
                      </div>
                    )}

                    {/* Image */}
                    <div className="relative aspect-square bg-zinc-800/50">
                      {image.src?.trim() ? (
                        <Image
                          src={image.src}
                          alt={image.alt}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          className="object-contain transition-transform duration-300 group-hover:scale-105"
                          draggable={false}
                          unoptimized={image.src.startsWith('/api/file/') || image.src.startsWith('https://')}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-zinc-600" />
                        </div>
                      )}

                      {replacingId === image.id && (
                        <div className="absolute inset-0 z-10 bg-black/60 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 text-white animate-spin" />
                        </div>
                      )}

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        {replaceButton(image, false)}
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
                      <p className={`text-xs font-medium truncate ${image.alt ? 'text-white' : 'text-zinc-600 italic'}`}>{image.alt || 'No caption'}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{image.width} × {image.height}</p>
                    </div>
                  </SortableItem>
                )
              }}
          </SortableList>

          {/* Mobile list */}
          <SortableList
            items={images}
            getKey={(image) => image.id}
            onReorder={onReorder}
            axis="y"
            className="md:hidden rounded-xl border border-white/5 bg-zinc-900 divide-y divide-white/5"
          >
            {(image) => {
                return (
                  <SortableItem
                    key={image.id}
                    id={image.id}
                    className="flex items-center gap-3 px-4 py-3 bg-zinc-900 first:rounded-t-xl last:rounded-b-xl"
                    draggingClassName="!bg-zinc-800 rounded-xl ring-1 ring-indigo-500/40"
                  >
                    <SortableHandle className="-ml-1 p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-white/5 flex-shrink-0">
                      <GripVertical className="w-4 h-4" />
                    </SortableHandle>
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
                      <p className={`text-sm font-medium truncate ${image.alt ? 'text-white' : 'text-zinc-600 italic'}`}>{image.alt || 'No caption'}</p>
                      <p className="text-xs text-zinc-500 flex items-center gap-1">
                        {image.source === 'icloud' && <Cloud className="w-3 h-3 text-sky-400" />}
                        {image.width} × {image.height}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {replacingId === image.id
                        ? <Loader2 className="w-3.5 h-3.5 m-1.5 text-white animate-spin" />
                        : replaceButton(image, true)}
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
                  </SortableItem>
                )
              }}
          </SortableList>
        </>
      )}

      {bulkFiles && (
        <BulkImageUploadModal
          title="Upload photos"
          initialFiles={bulkFiles}
          withCaptions
          withPlacement
          onClose={() => setBulkFiles(null)}
          onSave={async (uploaded, opts) => {
            await onBulkAdd(uploaded, opts)
            toast({ title: '上传完成', description: `加了 ${uploaded.length} 张照片` })
          }}
        />
      )}
    </div>
  )
}

export default ImagesTab
