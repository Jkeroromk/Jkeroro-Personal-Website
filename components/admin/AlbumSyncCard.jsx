'use client'

// 把一个位置接到 iCloud 共享相簿：
// - mode="full"（纪念日轮播）：整本同步，相簿加/删照片，轮播跟着加/删
// - mode="slot"（首页某一格）：每天从相簿随机挑一张换上
// 贴链接 → 连接（马上同步一次）→ 之后每天自动同步，也可以手动点

import React, { useCallback, useEffect, useState } from 'react'
import { Cloud, Loader2, RefreshCw, Link2, Unlink, AlertCircle, ChevronDown } from 'lucide-react'
import { getAuthHeaders } from '@/lib/auth-client'
import { useToast } from '@/hooks/use-toast'

const api = async (url, method = 'GET', body) => {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `请求失败 (${res.status})`)
  return data
}

function timeAgo(iso) {
  if (!iso) return '还没同步过'
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (min < 1) return '刚刚同步'
  if (min < 60) return `${min} 分钟前同步`
  const h = Math.round(min / 60)
  if (h < 24) return `${h} 小时前同步`
  return `${Math.round(h / 24)} 天前同步`
}

function summary(r, slot) {
  if (!r || typeof r.total !== 'number') return ''
  if (slot) return `相簿里 ${r.total} 张`
  const parts = [`相簿里 ${r.total} 张`]
  if (r.added) parts.push(`新加 ${r.added}`)
  if (r.removed) parts.push(`移除 ${r.removed}`)
  if (r.failed) parts.push(`${r.failed} 张失败`)
  return parts.join(' · ')
}

const AlbumSyncCard = ({ target, label, mode = 'full', onSynced, bare = false }) => {
  const slot = mode === 'slot'
  const { toast } = useToast()
  const [source, setSource] = useState(undefined) // undefined = 加载中, null = 没接
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState('') // '' | connect | sync | disconnect
  const [showHelp, setShowHelp] = useState(false)
  const [editing, setEditing] = useState(false)

  const load = useCallback(async () => {
    try {
      const all = await api('/api/album-sources')
      setSource(all[target] || null)
    } catch {
      setSource(null)
    }
  }, [target])

  useEffect(() => { load() }, [load])

  const report = (r) => {
    if (!r) return
    if (slot) {
      toast({ title: '换好了', description: `从「${r.album}」（${r.total} 张）里挑了一张新的` })
      return
    }
    const more = r.remaining > 0 ? `，还有 ${r.remaining} 张等下一轮` : ''
    toast({ title: `同步完成：${r.album}`, description: `新加 ${r.added} 张，移除 ${r.removed} 张${more}` })
  }

  const connect = async () => {
    setBusy('connect')
    try {
      const data = await api('/api/album-sources', 'PUT', { id: target, shareUrl: url })
      if (data.syncError) toast({ title: '已连接，但第一次同步失败', description: data.syncError, variant: 'destructive' })
      else report(data.result)
      setUrl('')
      setEditing(false)
      await load()
      onSynced?.()
    } catch (err) {
      toast({ title: '连接失败', description: err.message, variant: 'destructive' })
    } finally {
      setBusy('')
    }
  }

  const syncNow = async () => {
    setBusy('sync')
    try {
      const data = await api('/api/album-sources/sync', 'POST', { id: target })
      report(data.result)
      onSynced?.()
    } catch (err) {
      toast({ title: '同步失败', description: err.message, variant: 'destructive' })
    } finally {
      setBusy('')
      load()
    }
  }

  const disconnect = async () => {
    if (!confirm(slot ? '断开后这一格不再自动换图，现在这张会保留。确定吗？' : '断开后不再自动同步。已经同步到网站上的照片会保留。确定吗？')) return
    setBusy('disconnect')
    try {
      await api('/api/album-sources', 'DELETE', { id: target })
      setSource(null)
      onSynced?.()
    } catch (err) {
      toast({ title: '断开失败', description: err.message, variant: 'destructive' })
    } finally {
      setBusy('')
    }
  }

  if (source === undefined) return null

  const connected = source && !editing
  const r = source?.lastResult

  return (
    <div className={bare ? '' : 'rounded-xl border border-white/5 bg-zinc-900 p-4'}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-sky-500/10 flex items-center justify-center flex-shrink-0">
          <Cloud className="w-4 h-4 text-sky-400" />
        </div>

        <div className="flex-1 min-w-0">
          {connected ? (
            <>
              <p className="text-sm font-medium text-white truncate">
                {label ? `${label} 已接` : '已接'} iCloud 相簿「{source.albumName || '共享相簿'}」
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {timeAgo(source.lastSyncedAt)}
                {summary(r, slot) && ` · ${summary(r, slot)}`}
                {slot ? ' · 每天自动换一张' : ' · 每天自动同步'}
              </p>
              {r?.remaining > 0 && (
                <p className="text-xs text-amber-400/90 mt-1">还有 {r.remaining} 张没同步完，可以再点一次「立即同步」，或者明天自动接着来</p>
              )}
              {r?.skippedRemoval && (
                <p className="text-xs text-amber-400/90 mt-1">iCloud 这次返回了空相簿，为了安全没删网站上的照片</p>
              )}
              {source.lastError && (
                <p className="text-xs text-red-400 mt-1 flex items-start gap-1">
                  <AlertCircle className="w-3.5 h-3.5 mt-px flex-shrink-0" />
                  {source.lastError}
                </p>
              )}
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-white">接一个 iCloud 共享相簿</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {slot
                  ? '这一格每天从相簿里随机换一张，最近用过的会尽量避开'
                  : `以后在 iPhone 上往相簿里加照片，${label}每天自动更新；从相簿删掉的照片网站上也会删`}
              </p>
              <div className="flex flex-col sm:flex-row gap-2 mt-3">
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.icloud.com/sharedalbum/#B0..."
                  className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-zinc-800 border border-white/5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-sky-500/60"
                />
                <div className="flex gap-2">
                  <button
                    onClick={connect}
                    disabled={!url.trim() || busy}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-sm font-medium transition-colors"
                  >
                    {busy === 'connect' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                    {busy === 'connect' ? (slot ? '连接并换图中…' : '连接并同步中…') : '连接'}
                  </button>
                  {editing && (
                    <button onClick={() => setEditing(false)} className="px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white">
                      取消
                    </button>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowHelp((v) => !v)}
                className="mt-2 flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showHelp ? 'rotate-180' : ''}`} />
                链接在哪里拿？
              </button>
              {showHelp && (
                <ol className="mt-2 ml-4 list-decimal space-y-1 text-xs text-zinc-400">
                  <li>iPhone「照片」→「相簿」→ 新建一个<b>共享相簿</b>（或用已有的）</li>
                  <li>打开相簿 → 点右上角的人物图标</li>
                  <li>打开「<b>公共网站</b>」，点「共享链接」→ 拷贝，贴到上面</li>
                  <li>注意：拿到这个链接的人都能看这个相簿</li>
                </ol>
              )}
            </>
          )}
        </div>

        {connected && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={syncNow}
              disabled={!!busy}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-white disabled:opacity-50"
            >
              {busy === 'sync' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">
                {busy === 'sync' ? (slot ? '换图中…' : '同步中…') : (slot ? '现在换一张' : '立即同步')}
              </span>
            </button>
            <button
              onClick={() => setEditing(true)}
              disabled={!!busy}
              title="换一个相簿"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 disabled:opacity-50"
            >
              <Link2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={disconnect}
              disabled={!!busy}
              title="断开"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-50"
            >
              <Unlink className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default AlbumSyncCard
