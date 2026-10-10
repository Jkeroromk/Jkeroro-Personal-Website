'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { X, Trash2, Music, Image as ImageIcon, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { getAuthHeaders } from '@/lib/auth-client'

const formatSize = (bytes) => {
  if (!bytes) return '—'
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

const keyOf = (f) => `${f.bucket}/${f.path}`

// 列出 Storage 里没有任何记录在用的文件（删掉的歌留下的音频和封面等），确认后删除
const StorageCleanupModal = ({ onClose }) => {
  const [status, setStatus] = React.useState('loading') // loading | ready | deleting | done | error
  const [files, setFiles] = React.useState([])
  const [selected, setSelected] = React.useState(new Set())
  const [errorMsg, setErrorMsg] = React.useState('')
  const [removedCount, setRemovedCount] = React.useState(0)
  const [removedSize, setRemovedSize] = React.useState(0)

  const load = React.useCallback(async () => {
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/admin/storage-cleanup', { headers: await getAuthHeaders() })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `读取失败 (${res.status})`)
      setFiles(data.files || [])
      setSelected(new Set((data.files || []).map(keyOf)))
      setStatus('ready')
    } catch (err) {
      setErrorMsg(err.message || '读取失败')
      setStatus('error')
    }
  }, [])

  React.useEffect(() => { load() }, [load])

  const toggle = (k) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(k) ? next.delete(k) : next.add(k)
      return next
    })
  }

  const allSelected = files.length > 0 && selected.size === files.length
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(files.map(keyOf)))

  const chosen = files.filter((f) => selected.has(keyOf(f)))
  const chosenSize = chosen.reduce((t, f) => t + (f.size || 0), 0)

  const handleDelete = async () => {
    if (chosen.length === 0) return
    setStatus('deleting')
    try {
      const res = await fetch('/api/admin/storage-cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
        body: JSON.stringify({ files: chosen.map(({ bucket, path }) => ({ bucket, path })) }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `删除失败 (${res.status})`)
      const removed = new Set((data.removed || []).map(keyOf))
      setRemovedCount(removed.size)
      setRemovedSize(files.filter((f) => removed.has(keyOf(f))).reduce((t, f) => t + (f.size || 0), 0))
      setStatus('done')
    } catch (err) {
      setErrorMsg(err.message || '删除失败')
      setStatus('error')
    }
  }

  const audio = files.filter((f) => f.bucket === 'audio')
  const images = files.filter((f) => f.bucket === 'images')

  const renderGroup = (title, Icon, list) =>
    list.length > 0 && (
      <div>
        <p className="text-xs font-medium text-zinc-500 mb-1.5">{title} · {list.length}</p>
        <div className="rounded-lg border border-white/5 divide-y divide-white/5">
          {list.map((f) => {
            const k = keyOf(f)
            return (
              <label key={k} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-white/[0.03]">
                <input
                  type="checkbox"
                  checked={selected.has(k)}
                  onChange={() => toggle(k)}
                  disabled={status === 'deleting'}
                  className="accent-red-500"
                />
                {f.bucket === 'images' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.url} alt="" className="w-8 h-8 rounded object-cover border border-white/10 flex-shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-indigo-400" />
                  </div>
                )}
                <a
                  href={f.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 min-w-0 text-sm text-zinc-300 truncate hover:text-white"
                  title={f.path}
                >
                  {f.path}
                </a>
                <span className="text-xs text-zinc-600 flex-shrink-0">{formatSize(f.size)}</span>
              </label>
            )
          })}
        </div>
      </div>
    )

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-zinc-900 rounded-xl p-6 w-full max-w-lg border border-white/10 max-h-[85vh] flex flex-col"
      >
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-400" />
            <h2 className="text-base font-semibold text-white">清理没用到的文件</h2>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-zinc-500 mb-4">
          Storage 里没有任何歌曲、图片、项目或纪念日背景在用的文件。24 小时内上传的不会列出。
        </p>

        <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
          {status === 'loading' && (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-zinc-400">
              <Loader2 className="w-4 h-4 animate-spin" /> 正在检查 Storage…
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/20">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-300">{errorMsg}</p>
                <button onClick={load} className="text-xs text-zinc-400 hover:text-white mt-1">重试</button>
              </div>
            </div>
          )}

          {status === 'done' && (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              <p className="text-sm text-white">已删除 {removedCount} 个文件，释放 {formatSize(removedSize)}</p>
              {removedCount < chosen.length && (
                <p className="text-xs text-zinc-500">另外 {chosen.length - removedCount} 个刚被用上或删除失败，已保留</p>
              )}
            </div>
          )}

          {(status === 'ready' || status === 'deleting') && files.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              <p className="text-sm text-white">Storage 很干净，没有多余的文件</p>
            </div>
          )}

          {(status === 'ready' || status === 'deleting') && files.length > 0 && (
            <>
              <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} disabled={status === 'deleting'} className="accent-red-500" />
                全选（{files.length} 个）
              </label>
              {renderGroup('音频', Music, audio)}
              {renderGroup('图片', ImageIcon, images)}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-white/5">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
          >
            {status === 'done' ? '完成' : '取消'}
          </button>
          {(status === 'ready' || status === 'deleting') && files.length > 0 && (
            <button
              onClick={handleDelete}
              disabled={chosen.length === 0 || status === 'deleting'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:hover:bg-red-600 text-white text-sm font-medium transition-colors"
            >
              {status === 'deleting' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              删除 {chosen.length} 个（{formatSize(chosenSize)}）
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default StorageCleanupModal
