'use client'

/**
 * SocialLinksTab — 后台编辑首页的社交媒体链接
 * 改完点「保存」一次提交（增、删、改、排序、隐藏），首页刷新就能看到，不用改代码。
 */

import React, { useEffect, useMemo, useState } from 'react'
import { ArrowUp, ArrowDown, Eye, EyeOff, Trash2, Plus, Save, RotateCcw, ExternalLink, Share2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { getAuthHeaders } from '@/lib/auth-client'
import { PLATFORMS, getPlatform, MAX_SOCIAL_LINKS, LINKS_PER_ROW } from '@/lib/social-platforms'

let tempId = 0
const withKeys = (list) => list.map((l) => ({ ...l, _key: l.id || `new-${++tempId}` }))
const strip = (list) => list.map(({ platform, name, url, visible }) => ({ platform, name: name.trim(), url: url.trim(), visible }))

function urlError(url) {
  const value = url.trim()
  if (!value) return 'Enter a URL'
  try {
    const u = new URL(value)
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return 'Must start with https://'
    return null
  } catch {
    return 'Must be a full URL, like https://…'
  }
}

const inputClass =
  'w-full min-w-0 rounded-lg bg-zinc-800 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/60 transition-colors'

export default function SocialLinksTab() {
  const [links, setLinks] = useState([])
  const [saved, setSaved] = useState([]) // 上次保存的版本，用来判断有没有改动
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const { toast } = useToast()

  const load = async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await fetch('/api/social-links', { cache: 'no-store' })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`)
      const data = await res.json()
      const keyed = withKeys(data)
      setLinks(keyed)
      setSaved(keyed)
    } catch (err) {
      setLoadError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const dirty = useMemo(() => JSON.stringify(strip(links)) !== JSON.stringify(strip(saved)), [links, saved])
  const errors = useMemo(() => links.map((l) => ({
    name: l.name.trim() ? (l.name.trim().length > 40 ? 'Max 40 characters' : null) : 'Enter a name',
    url: urlError(l.url),
  })), [links])
  const hasErrors = errors.some((e) => e.name || e.url)

  // 有没保存的改动时关页面提醒一下
  useEffect(() => {
    if (!dirty) return
    const warn = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const update = (key, patch) => setLinks((list) => list.map((l) => (l._key === key ? { ...l, ...patch } : l)))

  const changePlatform = (link, platform) => {
    // 名字还是旧平台的默认名（或空）就跟着换，自己改过的名字不动
    const oldLabel = getPlatform(link.platform).label
    const keepName = link.name.trim() && link.name.trim() !== oldLabel
    update(link._key, { platform, name: keepName ? link.name : getPlatform(platform).label })
  }

  const move = (index, dir) => setLinks((list) => {
    const next = [...list]
    const j = index + dir
    if (j < 0 || j >= next.length) return list
    ;[next[index], next[j]] = [next[j], next[index]]
    return next
  })

  const add = () => {
    if (links.length >= MAX_SOCIAL_LINKS) return
    setLinks((list) => [...list, ...withKeys([{ platform: 'website', name: 'Website', url: 'https://', visible: true }])])
  }

  const remove = (link) => {
    if (link.url.trim() && link.url.trim() !== 'https://' && !confirm(`Delete ${link.name || 'this link'}?`)) return
    setLinks((list) => list.filter((l) => l._key !== link._key))
  }

  const save = async () => {
    if (hasErrors) {
      toast({ title: 'Check the highlighted fields', description: 'Every link needs a name and a full URL.', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const authHeaders = await getAuthHeaders()
      const res = await fetch('/api/social-links', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ links: strip(links) }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      const keyed = withKeys(data)
      setLinks(keyed)
      setSaved(keyed)
      toast({ title: 'Saved', description: 'Social links on the homepage are updated.' })
    } catch (err) {
      toast({ title: 'Couldn’t save', description: err.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex items-center gap-3 text-zinc-400">
          <div className="w-5 h-5 border-2 border-zinc-700 border-t-indigo-500 rounded-full animate-spin" />
          <span className="text-sm">Loading social links...</span>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-white/10 bg-white/[0.02] gap-3">
        <p className="text-sm text-white">Couldn’t load social links</p>
        <p className="text-xs text-zinc-500">{loadError}</p>
        <button onClick={load} className="px-3 py-1.5 rounded-lg border border-white/10 text-zinc-300 hover:text-white text-sm">
          Try again
        </button>
      </div>
    )
  }

  const visible = links.filter((l) => l.visible)
  const previewRows = []
  for (let i = 0; i < visible.length; i += LINKS_PER_ROW) previewRows.push(visible.slice(i, i + LINKS_PER_ROW))

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-white">Social Links</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            {links.length} link{links.length !== 1 ? 's' : ''} · {visible.length} shown on the homepage, {LINKS_PER_ROW} per row
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dirty && (
            <button
              onClick={() => setLinks(saved)}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 text-sm transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Discard
            </button>
          )}
          <button
            onClick={save}
            disabled={!dirty || saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:hover:bg-indigo-500"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
          </button>
        </div>
      </div>

      {/* Preview: what the homepage row looks like */}
      <div className="rounded-xl border border-white/5 bg-black p-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-4">Homepage preview</p>
        {previewRows.length === 0 ? (
          <p className="text-xs text-zinc-500">No links are shown. The social section is hidden on the homepage.</p>
        ) : (
          <div className="flex flex-col items-center gap-5">
            {previewRows.map((row, i) => (
              <div key={i} className="flex justify-center gap-6">
                {row.map((l) => {
                  const { Icon } = getPlatform(l.platform)
                  return (
                    <div key={l._key} className="flex flex-col items-center gap-1.5 w-14" title={l.url}>
                      <Icon size={22} className="text-white" />
                      <span className="text-[10px] text-zinc-500 truncate max-w-full">{l.name || '—'}</span>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Editor */}
      <div className="space-y-2">
        {links.map((link, index) => {
          const { Icon } = getPlatform(link.platform)
          const err = errors[index]
          return (
            <div
              key={link._key}
              className={`rounded-xl border bg-zinc-900 p-3 transition-colors ${link.visible ? 'border-white/5 hover:border-white/10' : 'border-white/5 opacity-60'}`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start gap-3">
                {/* order */}
                <div className="flex lg:flex-col items-center gap-1 lg:pt-1">
                  <span className="text-[11px] text-zinc-500 tabular-nums w-5 text-center">{index + 1}</span>
                  <button
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label="Move up"
                    className="p-1 rounded-md text-zinc-500 hover:text-white hover:bg-white/5 disabled:opacity-25 disabled:hover:bg-transparent"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => move(index, 1)}
                    disabled={index === links.length - 1}
                    aria-label="Move down"
                    className="p-1 rounded-md text-zinc-500 hover:text-white hover:bg-white/5 disabled:opacity-25 disabled:hover:bg-transparent"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* platform */}
                <label className="flex items-center gap-2 lg:w-52 flex-shrink-0">
                  <span className="w-9 h-9 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <Icon size={16} className="text-white" />
                  </span>
                  <select
                    id={`social-platform-${link._key}`}
                    value={link.platform}
                    onChange={(e) => changePlatform(link, e.target.value)}
                    className={inputClass}
                    aria-label="Platform"
                  >
                    {PLATFORMS.map((p) => (
                      <option key={p.key} value={p.key}>{p.label}</option>
                    ))}
                  </select>
                </label>

                {/* name */}
                <div className="lg:w-44 flex-shrink-0">
                  <input
                    id={`social-name-${link._key}`}
                    value={link.name}
                    onChange={(e) => update(link._key, { name: e.target.value })}
                    placeholder="Name shown on hover"
                    aria-label="Name"
                    className={`${inputClass} ${err.name ? 'border-red-500/60' : ''}`}
                  />
                  {err.name && <p className="text-[11px] text-red-400 mt-1">{err.name}</p>}
                </div>

                {/* url */}
                <div className="flex-1 min-w-0">
                  <input
                    id={`social-url-${link._key}`}
                    value={link.url}
                    onChange={(e) => update(link._key, { url: e.target.value })}
                    placeholder="https://"
                    aria-label="URL"
                    inputMode="url"
                    spellCheck={false}
                    className={`${inputClass} font-mono text-[13px] ${err.url ? 'border-red-500/60' : ''}`}
                  />
                  {err.url && <p className="text-[11px] text-red-400 mt-1">{err.url}</p>}
                </div>

                {/* actions */}
                <div className="flex items-center gap-1 lg:pt-0.5">
                  <button
                    onClick={() => update(link._key, { visible: !link.visible })}
                    aria-label={link.visible ? 'Hide on homepage' : 'Show on homepage'}
                    title={link.visible ? 'Shown on homepage — click to hide' : 'Hidden — click to show'}
                    className={`p-2 rounded-lg transition-colors ${link.visible ? 'text-zinc-300 hover:bg-white/5' : 'text-zinc-500 hover:bg-white/5'}`}
                  >
                    {link.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <a
                    href={err.url ? undefined : link.url.trim()}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Open link"
                    title="Open link in a new tab"
                    className={`p-2 rounded-lg transition-colors ${err.url ? 'text-zinc-700 pointer-events-none' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => remove(link)}
                    aria-label="Delete"
                    className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}

        {links.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed border-white/10 bg-white/[0.02]">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
              <Share2 className="w-5 h-5 text-zinc-500" />
            </div>
            <p className="text-sm font-medium text-white mb-1">No social links</p>
            <p className="text-xs text-zinc-500">Add one below. It shows up on the homepage after you save.</p>
          </div>
        )}

        <button
          onClick={add}
          disabled={links.length >= MAX_SOCIAL_LINKS}
          className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl border border-dashed border-white/10 text-zinc-400 hover:text-white hover:border-white/20 text-sm transition-colors disabled:opacity-40"
        >
          <Plus className="w-4 h-4" />
          {links.length >= MAX_SOCIAL_LINKS ? `Up to ${MAX_SOCIAL_LINKS} links` : 'Add link'}
        </button>
      </div>
    </div>
  )
}
