'use client'

import { useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import BulkImageUploadModal from '@/components/admin/modals/BulkImageUploadModal'
import { pickImageFiles } from '@/lib/upload-image'

// 纪念日背景：一次选一堆照片（或拖进来），压缩后一起加进轮播
export default function ImageUploadSection({ uploading, onBulkSave }) {
  const inputRef = useRef(null)
  const [files, setFiles] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const open = (list) => {
    const picked = pickImageFiles(list)
    if (picked.length) setFiles(picked)
  }

  return (
    <div>
      {uploading && (
        <div className="mb-3 p-3 bg-blue-500/20 border border-blue-500/50 rounded-lg">
          <p className="text-blue-300 text-sm">Updating background images...</p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => { open(e.target.files); e.target.value = '' }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragOver(false); open(e.dataTransfer.files) }}
        onPaste={(e) => open(e.clipboardData?.files)}
        className={`w-full border-2 border-dashed rounded-lg p-6 flex flex-col items-center gap-2 text-center transition-colors ${
          isDragOver ? 'border-pink-400 bg-pink-400/10' : 'border-gray-600 hover:border-gray-500'
        }`}
      >
        <Upload className="w-6 h-6 text-gray-300" />
        <span className="text-sm font-medium text-gray-300">选照片（可以一次选很多张）或拖进来</span>
        <span className="text-xs text-gray-500">手机原图也行，会自动压缩；横图效果最好</span>
      </button>

      {files && (
        <BulkImageUploadModal
          title="Add anniversary photos"
          initialFiles={files}
          onClose={() => setFiles(null)}
          onSave={onBulkSave}
        />
      )}
    </div>
  )
}
