'use client'

import React, { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { X, Upload, Music, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getAuthHeaders } from '@/lib/auth-client'

function titleFromFilename(filename) {
  return filename
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]/g, ' ')
    .trim()
}

const FileUploadModal = ({ onClose, onImported }) => {
  const [file, setFile]         = useState(null)
  const [title, setTitle]       = useState('')
  const [artist, setArtist]     = useState('')
  const [status, setStatus]     = useState('idle') // idle | loading | success | error
  const [progress, setProgress] = useState(0)
  const [result, setResult]     = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef(null)

  const handleFile = useCallback((f) => {
    if (!f) return
    setFile(f)
    if (!title) setTitle(titleFromFilename(f.name))
    setStatus('idle')
    setErrorMsg('')
  }, [title])

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const handleUpload = async () => {
    if (!file) return
    setStatus('loading')
    setProgress(10)
    setErrorMsg('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', title.trim() || titleFromFilename(file.name))
      formData.append('artist', artist.trim() || 'Unknown')

      // 用 XMLHttpRequest 显示上传进度
      const authHeaders = await getAuthHeaders()
      const track = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', '/api/music/upload-audio')
        Object.entries(authHeaders).forEach(([k, v]) => xhr.setRequestHeader(k, v))

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setProgress(10 + Math.round((e.loaded / e.total) * 80))
          }
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try { resolve(JSON.parse(xhr.responseText)) }
            catch { reject(new Error('响应解析失败')) }
          } else {
            try {
              const err = JSON.parse(xhr.responseText)
              reject(new Error(err.error || `上传失败 (${xhr.status})`))
            } catch {
              reject(new Error(`上传失败 (${xhr.status})`))
            }
          }
        }

        xhr.onerror = () => reject(new Error('网络错误'))
        xhr.send(formData)
      })

      setProgress(100)
      setStatus('success')
      setResult(track)
      onImported(track)
    } catch (err) {
      setStatus('error')
      setErrorMsg(err.message || '上传失败，请重试')
    }
  }

  const canUpload = file && status !== 'loading'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-zinc-900 rounded-xl p-6 w-full max-w-md border border-white/10"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-semibold text-white">上传音频</h2>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Drop zone */}
          <div
            onClick={() => !file && inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
            onDragLeave={() => setIsDragOver(false)}
            className={[
              'rounded-xl border-2 border-dashed transition-colors cursor-pointer',
              isDragOver
                ? 'border-emerald-500 bg-emerald-500/10'
                : file
                  ? 'border-white/10 bg-white/[0.02] cursor-default'
                  : 'border-white/10 hover:border-white/20 bg-white/[0.02]',
            ].join(' ')}
          >
            {file ? (
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <Music className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{file.name}</p>
                  <p className="text-xs text-zinc-500">{(file.size / 1048576).toFixed(1)} MB</p>
                </div>
                {status !== 'loading' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null); setTitle(''); setStatus('idle') }}
                    className="text-zinc-600 hover:text-zinc-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <Upload className="w-6 h-6 text-zinc-600" />
                <p className="text-sm text-zinc-400">拖拽文件到此处，或点击选择</p>
                <p className="text-xs text-zinc-600">MP3、M4A、WAV、OGG、FLAC</p>
              </div>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />

          {/* Title / Artist */}
          {file && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm text-zinc-400 mb-1.5">歌名</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="歌名"
                  className="bg-zinc-800 border-white/10 text-white text-sm"
                  disabled={status === 'loading'}
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1.5">艺术家</label>
                <Input
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="艺术家名"
                  className="bg-zinc-800 border-white/10 text-white text-sm"
                  disabled={status === 'loading'}
                />
              </div>
            </div>
          )}

          {/* Progress */}
          {status === 'loading' && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-300">上传中...</span>
                <span className="text-sm font-mono text-zinc-500">{progress}%</span>
              </div>
              <div className="relative w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-emerald-500 rounded-full"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}

          {/* Success */}
          {status === 'success' && result && (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-3 space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>已导入「{result.title}」</span>
              </div>
              <p className="text-xs text-zinc-400 pl-6">{result.subtitle}</p>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="flex items-start gap-2 text-sm rounded-lg px-3 py-2 bg-red-500/10 text-red-400">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          {status === 'success' ? (
            <Button onClick={onClose} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white">
              完成
            </Button>
          ) : (
            <>
              <Button
                onClick={handleUpload}
                disabled={!canUpload}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white"
              >
                {status === 'loading'
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />上传中...</>
                  : <><Upload className="w-4 h-4 mr-2" />上传</>
                }
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                disabled={status === 'loading'}
                className="border-white/10 text-zinc-400 hover:text-white"
              >
                取消
              </Button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default FileUploadModal
