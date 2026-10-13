'use client'

import React from 'react'
import { SortableList, SortableItem, SortableHandle } from '@/components/admin/Sortable'
import { Edit2, Trash2, ImageIcon, Plus, GripVertical } from 'lucide-react'
import Image from 'next/image'

const ImagesTab = ({ images, onEdit, onDelete, onAddNew, onReorder }) => {
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
                  </SortableItem>
                )
              }}
          </SortableList>
        </>
      )}
    </div>
  )
}

export default ImagesTab
