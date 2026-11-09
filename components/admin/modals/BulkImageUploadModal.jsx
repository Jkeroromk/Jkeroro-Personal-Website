'use client'

// 批量传照片：一次选/拖一堆照片进来，浏览器里先压缩（转 WebP、读宽高），再并发上传。
// 相册（Images）和纪念日背景（Anniversary）共用这一个弹窗，存数据库的部分由 onSave 交给各自处理。

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { X, Plus, ImageIcon, Loader2, CheckCircle2, AlertCircle, Upload } from 'lucide-react'
import { uploadImages, pickImageFiles } from '@/lib/upload-image'

let seq = 0
const toItem = (file) => ({
  key: `${Date.now()}-${seq++}`,
  file,
  preview: URL.createObjectURL(file),
  caption: '',
  status: 'pending', // pending | uploading | done | error
  error: '',
})

const BulkImageUploadModal = ({
  initialFiles = [],
  title = 'Upload photos',
  withCaptions = false,
  withPlacement = false,
  onClose,
  onSave, // async (uploaded: {src,width,height,name,caption}[], { placement }) => void
}) => {
  const [items, setItems] = useState(() => pickImageFiles(initialFiles).map(toItem))
  const [placement, setPlacement] = useState('end') // start | end
  const [phase, setPhase] = useState('select') // select | uploading | saving | done
  const [saveError, setSaveError] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef(null)
  const itemsRef = useRef(items)
  itemsRef.current = items

  // 关闭时释放预览图占的内存
  useEffect(() => () => itemsRef.current.forEach((it) => URL.revokeObjectURL(it.preview)), [])

  const busy = phase === 'uploading' || phase === 'saving'
  const pending = useMemo(() => items.filter((it) => it.status !== 'done'), [items])
  const doneCount = items.filter((it) => it.status === 'done').length
  const failedCount = items.filter((it) => it.status === 'error').length

  const addFiles = (list) => {
    const files = pickImageFiles(list)
    if (files.length) setItems((prev) => [...prev, ...files.map(toItem)])
  }

  const removeItem = (key) => {
    setItems((prev) => {
      const it = prev.find((x) => x.key === key)
      if (it) URL.revokeObjectURL(it.preview)
      return prev.filter((x) => x.key !== key)
    })
  }

  const setCaption = (key, caption) =>
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, caption } : it)))

  const patchByIndex = (keys, i, patch) =>
    setItems((prev) => prev.map((it) => (it.key === keys[i] ? { ...it, ...patch } : it)))

  const handleUpload = async () => {
    const queue = itemsRef.current.filter((it) => it.status !== 'done')
    if (!queue.length) return
    setPhase('uploading')
    setSaveError('')
    const keys = queue.map((it) => it.key)

    const results = await uploadImages(
      queue.map((it) => it.file),
      (i, s) =>
        patchByIndex(keys, i, {
          status: s.status,
          error: s.error || '',
          ...(s.result ? { uploaded: s.result } : {}),
        })
    )

    const captions = Object.fromEntries(itemsRef.current.map((it) => [it.key, it.caption]))
    const ok = results
      .map((r, i) => (r ? { ...r, caption: (captions[keys[i]] || '').trim() } : null))
      .filter(Boolean)

    if (ok.length) {
      setPhase('saving')
      try {
        await onSave(ok, { placement })
      } catch (err) {
        // 文件已经传上去了，但没写进数据库：标回失败，重试时会重新传（旧文件由每周的存储清理回收）
        const okKeys = new Set(keys.filter((_, i) => results[i]))
        setItems((prev) => prev.map((it) => (okKeys.has(it.key) ? { ...it, status: 'error', error: '保存失败' } : it)))
        setSaveError(err?.message || '保存失败，请重试')
        setPhase('select')
        return
      }
    }

    const anyFailed = results.some((r) => !r)
    if (anyFailed) {
      setPhase('select')
    } else {
      setPhase('done')
      setTimeout(onClose, 700)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
      onDragOver={(e) => { e.preventDefault(); if (!busy) setIsDragOver(true) }}
      onDragLeave={(e) => { if (e.currentTarget === e.target) setIsDragOver(false) }}
      onDrop={(e) => { e.preventDefault(); setIsDragOver(false); if (!busy) addFiles(e.dataTransfer.files) }}
      onPaste={(e) => { if (!busy) addFiles(e.clipboardData?.files) }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`bg-zinc-900 rounded-xl w-full max-w-2xl border max-h-[90vh] flex flex-col ${
          isDragOver ? 'border-indigo-500' : 'border-white/10'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-white/5">
          <div>
            <h2 className="text-base font-semibold text-white">{title}</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {items.length === 0
                ? '选照片、拖进来或者直接粘贴都行'
                : `${items.length} 张 · 自动压缩成 WebP，宽高自动读取`}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={busy}
            className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-white/5 disabled:opacity-40"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => { addFiles(e.target.files); e.target.value = '' }}
        />

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
            {items.map((it) => (
              <div key={it.key} className="flex flex-col gap-1.5">
                <div className="relative aspect-square rounded-lg overflow-hidden bg-zinc-800 border border-white/5">
                  {/* 预览不出来（比如电脑上的 HEIC）时露出底下这个图标 */}
                  <ImageIcon className="absolute inset-0 m-auto w-5 h-5 text-zinc-600" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={it.preview}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />

                  {it.status === 'uploading' && (
                    <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    </div>
                  )}
                  {it.status === 'done' && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    </div>
                  )}
                  {it.status === 'error' && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-1.5 text-center">
                      <AlertCircle className="w-5 h-5 text-red-400 mb-1" />
                      <span className="text-[10px] leading-tight text-red-300 line-clamp-3">{it.error}</span>
                    </div>
                  )}

                  {!busy && it.status !== 'done' && (
                    <button
                      onClick={() => removeItem(it.key)}
                      className="absolute top-1 right-1 p-1 rounded-md bg-black/60 text-white hover:bg-red-500/80"
                      aria-label="Remove"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                {withCaptions && (
                  <input
                    value={it.caption}
                    onChange={(e) => setCaption(it.key, e.target.value)}
                    disabled={busy || it.status === 'done'}
                    placeholder="Caption（可不填）"
                    className="w-full px-2 py-1 rounded-md bg-zinc-800 border border-white/5 text-[11px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/60 disabled:opacity-50"
                  />
                )}
              </div>
            ))}

            {!busy && (
              <button
                onClick={() => inputRef.current?.click()}
                className={`aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 text-zinc-500 hover:text-white hover:border-white/30 transition-colors ${
                  isDragOver ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10'
                }`}
              >
                <Plus className="w-5 h-5" />
                <span className="text-[11px]">{items.length ? '再加几张' : '选照片'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-5 py-4 border-t border-white/5 space-y-3">
          {withPlacement && (
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span>新照片放在</span>
              {[
                ['start', '最前面'],
                ['end', '最后面'],
              ].map(([v, label]) => (
                <button
                  key={v}
                  onClick={() => setPlacement(v)}
                  disabled={busy}
                  className={`px-2.5 py-1 rounded-md border transition-colors ${
                    placement === v
                      ? 'border-indigo-500 bg-indigo-500/15 text-white'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {(saveError || failedCount > 0) && phase === 'select' && (
            <p className="text-xs text-red-400">
              {saveError || `${failedCount} 张没传上去，点下面重试（已经成功的不会重复上传）`}
            </p>
          )}

          <button
            onClick={handleUpload}
            disabled={busy || pending.length === 0 || phase === 'done'}
            className="w-full flex items-center justify-center gap-2 h-10 rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-sm font-medium transition-colors"
          >
            {phase === 'uploading' && <><Loader2 className="w-4 h-4 animate-spin" />上传中 {doneCount}/{items.length}</>}
            {phase === 'saving' && <><Loader2 className="w-4 h-4 animate-spin" />保存中…</>}
            {phase === 'done' && <><CheckCircle2 className="w-4 h-4" />完成</>}
            {phase === 'select' && (
              <>
                <Upload className="w-4 h-4" />
                {failedCount > 0 ? `重试 ${pending.length} 张` : pending.length ? `上传 ${pending.length} 张` : '先选照片'}
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default BulkImageUploadModal
