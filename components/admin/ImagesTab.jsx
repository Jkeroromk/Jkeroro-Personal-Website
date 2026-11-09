'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { SortableList, SortableItem, SortableHandle } from '@/components/admin/Sortable'
import { Edit2, Trash2, ImageIcon, Plus, GripVertical, RefreshCw, Loader2, Upload, Cloud } from 'lucide-react'
import AlbumSyncCard from '@/components/admin/AlbumSyncCard'
import Image from 'next/image'
import BulkImageUploadModal from '@/components/admin/modals/BulkImageUploadModal'
import { uploadImage, pickImageFiles } from '@/lib/upload-image'
import { getAuthHeaders } from '@/lib/auth-client'
import { useToast } from '@/hooks/use-toast'

// 卡片悬停工具栏里的小图标按钮，悬停时上方显示文字提示
const ToolButton = ({ label, onClick, disabled, active, danger, children }) => (
  <button
    type="button"
    aria-label={label}
    disabled={disabled}
    onClick={(e) => { e.stopPropagation(); onClick() }}
    className={`group/tb relative w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-40 ${
      danger
        ? 'text-zinc-300 hover:text-red-300 hover:bg-red-500/20'
        : active
          ? 'text-sky-300 hover:bg-white/10'
          : 'text-zinc-200 hover:text-white hover:bg-white/10'
    }`}
  >
    {children}
    <span className="pointer-events-none absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-zinc-950 border border-white/10 px-1.5 py-0.5 text-[10px] text-zinc-200 opacity-0 group-hover/tb:opacity-100 transition-opacity">
      {label}
    </span>
  </button>
)

const ImagesTab = ({ images, onEdit, onDelete, onAddNew, onReorder, onBulkAdd, onReplace, onReload }) => {
  const { toast } = useToast()
  const pickRef = useRef(null)
  const replaceRef = useRef(null)
  const replaceTarget = useRef(null)
  const [bulkFiles, setBulkFiles] = useState(null) // null = 弹窗关着
  const [replacingId, setReplacingId] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [albumFor, setAlbumFor] = useState(null) // 正在给哪一格接相簿
  const [linked, setLinked] = useState({}) // imageId → 相簿名

  // 哪些格子接了 iCloud 相簿（每天自动换一张）
  const loadLinked = useCallback(async () => {
    try {
      const res = await fetch('/api/album-sources', { headers: await getAuthHeaders(), cache: 'no-store' })
      if (!res.ok) return
      const all = await res.json()
      const map = {}
      for (const [id, src] of Object.entries(all)) {
        if (id.startsWith('slot:')) map[id.slice(5)] = src.albumName || 'iCloud'
      }
      setLinked(map)
    } catch {}
  }, [])
  useEffect(() => { loadLinked() }, [loadLinked])

  const albumButton = (image, compact) => (
    <button
      onClick={(e) => { e.stopPropagation(); setAlbumFor(image) }}
      title={linked[image.id] ? `每天从「${linked[image.id]}」换一张` : '接 iCloud 相簿，每天自动换一张'}
      className={compact
        ? `p-1.5 rounded-md transition-colors hover:bg-white/10 ${linked[image.id] ? 'text-sky-400' : 'text-zinc-400 hover:text-white'}`
        : 'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-medium backdrop-blur-sm transition-colors'}
    >
      <Cloud className={compact ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
      {!compact && 'Album'}
    </button>
  )

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
            {images.length} image{images.length !== 1 ? 's' : ''} · 可以直接把照片拖到这里 · 每张都能接一个 iCloud 相簿，每天自动换图
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

                    {/* Image */}
                    <div className="relative aspect-square overflow-hidden bg-zinc-900">
                      {image.src?.trim() ? (
                        <Image
                          src={image.src}
                          alt={image.alt}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                          style={{ objectPosition: `${image.imageOffsetX ?? 50}% ${image.imageOffsetY ?? 50}%` }}
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

                      {/* 悬停时底部浮出一条图标工具栏 */}
                      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      <div className="absolute inset-x-0 bottom-2.5 flex justify-center opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 focus-within:opacity-100 focus-within:translate-y-0 transition-all duration-200">
                        <div className="flex items-center gap-0.5 p-1 rounded-xl bg-zinc-950/75 border border-white/10 backdrop-blur-md shadow-lg shadow-black/40">
                          <ToolButton
                            label={linked[image.id] ? `相簿：${linked[image.id]}` : '接 iCloud 相簿'}
                            active={!!linked[image.id]}
                            onClick={() => setAlbumFor(image)}
                          >
                            <Cloud className="w-3.5 h-3.5" />
                          </ToolButton>
                          <ToolButton label="替换照片" disabled={replacingId !== null} onClick={() => startReplace(image)}>
                            <RefreshCw className="w-3.5 h-3.5" />
                          </ToolButton>
                          <ToolButton label="编辑" onClick={() => onEdit(image, 'image')}>
                            <Edit2 className="w-3.5 h-3.5" />
                          </ToolButton>
                          <span className="w-px h-4 bg-white/10 mx-0.5" />
                          <ToolButton label="删除" danger onClick={() => onDelete(image.id, 'image')}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </ToolButton>
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="px-3 py-2.5 bg-zinc-900">
                      <p className={`text-xs font-medium truncate ${image.alt ? 'text-white' : 'text-zinc-600 italic'}`}>{image.alt || 'No caption'}</p>
                      {linked[image.id] ? (
                        <p className="text-[10px] text-sky-400/90 mt-0.5 flex items-center gap-1 truncate">
                          <Cloud className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{linked[image.id]} · 每天换</span>
                        </p>
                      ) : (
                        <p className="text-[10px] text-zinc-500 mt-0.5">{image.width} × {image.height}</p>
                      )}
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
                        {linked[image.id] && <Cloud className="w-3 h-3 text-sky-400" />}
                        {image.width} × {image.height}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {replacingId === image.id
                        ? <Loader2 className="w-3.5 h-3.5 m-1.5 text-white animate-spin" />
                        : replaceButton(image, true)}
                      {albumButton(image, true)}
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

      {albumFor && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-3"
          onClick={() => setAlbumFor(null)}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-white/10 bg-zinc-900 p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">
                「{albumFor.alt || '这张照片'}」这一格
              </p>
              <button onClick={() => setAlbumFor(null)} className="text-xs text-zinc-400 hover:text-white">完成</button>
            </div>
            <AlbumSyncCard
              key={albumFor.id}
              target={`slot:${albumFor.id}`}
              mode="slot"
              bare
              onSynced={() => { onReload?.(); loadLinked() }}
            />
          </div>
        </div>
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
