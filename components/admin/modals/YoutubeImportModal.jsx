'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Youtube, Loader2, CheckCircle2, AlertCircle, Music2, FileAudio } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const STEPS = [
  { key: 'meta',  icon: Youtube,   label: '获取视频信息' },
  { key: 'audio', icon: FileAudio, label: '提取并上传音频' },
]

const YoutubeImportModal = ({ onClose, onImported }) => {
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [step, setStep] = useState(null) // null | 'meta' | 'audio' | 'lyrics'
  const [result, setResult] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  const handleImport = async () => {
    if (!url.trim()) return
    setStatus('loading')
    setErrorMsg('')
    setResult(null)
    setStep('meta')

    // Simulate step transitions while waiting for the API
    const stepTimer = setTimeout(() => setStep('audio'), 3000)

    try {
      const res = await fetch('/api/music/import-youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })
      clearTimeout(stepTimer)
      const data = await res.json()

      if (!res.ok) {
        setStatus('error')
        setStep(null)
        setErrorMsg(data.error || '导入失败，请重试')
        return
      }

      setStep(null)
      setStatus('success')
      setResult(data)
      onImported(data)
    } catch {
      clearTimeout(stepTimer)
      setStatus('error')
      setStep(null)
      setErrorMsg('网络错误，请检查连接后重试')
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
        className="bg-gray-900 rounded-xl p-6 w-full max-w-md border border-gray-700"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2">
            <Youtube className="w-5 h-5 text-red-400" />
            <h2 className="text-base font-semibold text-white">从 YouTube 导入</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* URL input */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">YouTube 链接</label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && status !== 'loading' && handleImport()}
              placeholder="https://www.youtube.com/watch?v=..."
              className="bg-gray-800 border-gray-600 text-white text-sm"
              disabled={status === 'loading'}
            />
          </div>

          {/* Loading steps */}
          {status === 'loading' && (
            <div className="space-y-2">
              {STEPS.map(({ key, icon: Icon, label }) => {
                const stepIndex = STEPS.findIndex(s => s.key === key)
                const activeIndex = STEPS.findIndex(s => s.key === step)
                const isDone = stepIndex < activeIndex
                const isActive = key === step
                return (
                  <div key={key} className={`flex items-center gap-2.5 text-sm px-3 py-2 rounded-lg transition-colors ${
                    isActive ? 'bg-indigo-500/10 text-indigo-300' :
                    isDone   ? 'text-green-400' :
                               'text-gray-600'
                  }`}>
                    {isDone
                      ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      : isActive
                        ? <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin" />
                        : <Icon className="w-4 h-4 flex-shrink-0" />
                    }
                    <span>{label}</span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Success */}
          {status === 'success' && result && (
            <div className="rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-3 space-y-2">
              <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>已导入「{result.title}」</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400 pl-6">
                <Music2 className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{result.subtitle} · 歌词将在播放时自动加载</span>
              </div>
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
            <p className="text-xs text-gray-500">
              自动提取音频、标题、艺术家。导入过程约需 20-40 秒，歌词播放时自动加载。
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          {status === 'success' ? (
            <Button onClick={onClose} className="flex-1 bg-green-600 hover:bg-green-500 text-white">
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
              <Button variant="outline" onClick={onClose} disabled={status === 'loading'}
                className="border-gray-600 text-gray-400 hover:text-white">
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
