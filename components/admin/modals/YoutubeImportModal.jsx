'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Youtube, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const YoutubeImportModal = ({ onClose, onImported }) => {
  const [url, setUrl]           = useState('')
  const [status, setStatus]     = useState('idle') // idle | loading | success | error
  const [progress, setProgress] = useState(0)
  const [progressMsg, setProgressMsg] = useState('')
  const [sizeInfo, setSizeInfo] = useState(null)   // { downloaded, total }
  const [result, setResult]     = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  const handleImport = async () => {
    if (!url.trim()) return
    setStatus('loading')
    setProgress(0)
    setProgressMsg('准备中...')
    setSizeInfo(null)
    setErrorMsg('')
    setResult(null)

    try {
      // SSE 流：yt-dlp + 下载 + 上传
      const res = await fetch('/api/music/import-youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || '导入失败')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let importResult = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const parts = buffer.split('\n\n')
        buffer = parts.pop() || ''

        for (const part of parts) {
          for (const line of part.split('\n')) {
            if (!line.startsWith('data: ')) continue
            let data
            try { data = JSON.parse(line.slice(6)) } catch { continue }

            if (data.stage === 'error') throw new Error(data.error || '导入失败')
            if (typeof data.progress === 'number') setProgress(data.progress)
            if (data.message) setProgressMsg(data.message)
            if (data.downloaded !== undefined) setSizeInfo({ downloaded: data.downloaded, total: data.total })
            if (data.stage === 'done') importResult = data
          }
        }
      }

      if (!importResult) throw new Error('导入未完成，请重试')

      // 保存到数据库
      setProgress(96)
      setProgressMsg('保存到曲库...')
      const trackRes = await fetch('/api/media/tracks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: importResult.title, subtitle: importResult.artist, src: importResult.publicUrl, cover: importResult.cover }),
      })
      const track = await trackRes.json()
      if (!trackRes.ok) throw new Error(track.error || '保存曲目失败')

      setProgress(100)
      setStatus('success')
      setResult(track)
      onImported(track)
    } catch (err) {
      setStatus('error')
      setErrorMsg(err.message || '导入失败，请重试')
    }
  }

  const isYoutubeUrl = url.includes('youtube.com') || url.includes('youtu.be')

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
            <Youtube className="w-5 h-5 text-red-400" />
            <h2 className="text-base font-semibold text-white">从 YouTube 导入</h2>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* URL input */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">YouTube 链接</label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && status !== 'loading' && handleImport()}
              placeholder="https://www.youtube.com/watch?v=..."
              className="bg-zinc-800 border-white/10 text-white text-sm"
              disabled={status === 'loading'}
            />
          </div>

          {/* Progress bar */}
          {status === 'loading' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center gap-3">
                <span className="text-sm text-zinc-300 truncate">{progressMsg}</span>
                <span className="text-sm font-mono text-zinc-500 flex-shrink-0">{progress}%</span>
              </div>
              <div className="relative w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-indigo-500 rounded-full"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                />
              </div>
              {sizeInfo?.total > 0 && (
                <p className="text-xs text-zinc-600 text-right">
                  {(sizeInfo.downloaded / 1048576).toFixed(1)} / {(sizeInfo.total / 1048576).toFixed(1)} MB
                </p>
              )}
              {sizeInfo?.total === 0 && sizeInfo?.downloaded > 0 && (
                <p className="text-xs text-zinc-600 text-right">
                  已下载 {(sizeInfo.downloaded / 1048576).toFixed(1)} MB
                </p>
              )}
            </div>
          )}

          {/* Success */}
          {status === 'success' && result && (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-3 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>已导入「{result.title}」</span>
              </div>
              <p className="text-xs text-zinc-400 pl-6">{result.subtitle} · 歌词将在播放时自动加载</p>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="flex items-start gap-2 text-sm rounded-lg px-3 py-2 bg-red-500/10 text-red-400">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {status === 'idle' && (
            <p className="text-xs text-zinc-500">
              自动提取音频、标题、艺术家。歌词播放时自动加载。
            </p>
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
                onClick={handleImport}
                disabled={!isYoutubeUrl || status === 'loading'}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white"
              >
                {status === 'loading'
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />导入中...</>
                  : <><Youtube className="w-4 h-4 mr-2" />开始导入</>
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

export default YoutubeImportModal
