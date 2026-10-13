'use client'

/**
 * GroupedItemsEditor — 后台编辑「分类 + 图标条目」列表（Tech Stack 在用；withUrl 可以给带链接的条目用）。
 * 分类可以新增、改名、排序、删除；条目可以新增、编辑、排序、隐藏、移到别的分类。
 * 改完点「保存」一次提交，首页刷新就能看到，不用改代码。
 *
 * 数据库里每个条目存一个 category 字符串，保存时按页面上的分类顺序把条目展平提交。
 */

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import {
  ArrowUp, ArrowDown, GripVertical, Eye, EyeOff, Trash2, Plus, Save, RotateCcw, ExternalLink, FolderPlus,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { getAuthHeaders } from '@/lib/auth-client'
import { groupByCategory, MAX_CATEGORY_LENGTH } from '@/lib/link-groups'
import IconGroups from '@/components/interactive/IconGroups'
import { SortableList, SortableItem, SortableHandle } from './Sortable'

let tempId = 0
const nextKey = (prefix) => `${prefix}-${++tempId}`

const inputClass =
  'w-full min-w-0 rounded-lg bg-zinc-800 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/60 transition-colors'

const iconButton =
  'p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-white/5 disabled:opacity-25 disabled:hover:bg-transparent transition-colors'

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

const swap = (list, i, j) => {
  const next = [...list]
  ;[next[i], next[j]] = [next[j], next[i]]
  return next
}

export default function GroupedItemsEditor({
  title,
  noun, // 'link' / 'item'
  apiPath,
  bodyKey, // PUT 请求体里的字段名
  iconField, // 'platform' / 'icon'
  iconLabel, // 下拉框的 aria-label
  options, // [{ key, label, Icon, group? }]
  getOption,
  withUrl = false,
  maxItems,
  newItem, // () => 新条目的默认值（不含 category）
  emptyIcon: EmptyIcon,
  toPreviewItem, // (item) => { key, name, Icon, hover, href? }
}) {
  const [groups, setGroups] = useState([])
  const [saved, setSaved] = useState('[]') // 上次保存的版本（展平后的 JSON），用来判断有没有改动
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [flashKey, setFlashKey] = useState(null) // 刚移动过的分类 / 条目，短暂高亮
  const flashTimer = useRef(null)
  const { toast } = useToast()

  const strip = (item, category) => ({
    [iconField]: item[iconField],
    name: item.name.trim(),
    ...(withUrl ? { url: item.url.trim() } : {}),
    category,
    visible: item.visible !== false,
  })

  // 空分类不保存（首页也不会显示）
  const flatten = (list) =>
    list.flatMap((g) => g.items.map((item) => strip(item, g.title.trim())))

  const fromData = (data) =>
    groupByCategory(data).map((g) => ({
      _key: nextKey('group'),
      title: g.title,
      items: g.items.map((item) => ({ ...item, url: item.url ?? '', _key: item.id || nextKey('item') })),
    }))

  const load = async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await fetch(apiPath, { cache: 'no-store' })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`)
      const data = await res.json()
      const next = fromData(data)
      setGroups(next)
      setSaved(JSON.stringify(flatten(next)))
    } catch (err) {
      setLoadError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => clearTimeout(flashTimer.current), [])

  const flat = useMemo(() => flatten(groups), [groups]) // eslint-disable-line react-hooks/exhaustive-deps
  const dirty = JSON.stringify(flat) !== saved
  const totalItems = groups.reduce((n, g) => n + g.items.length, 0)
  const shownItems = flat.filter((i) => i.visible).length
  const emptyGroups = groups.filter((g) => g.items.length === 0).length

  // 校验：分类名不能太长、不能重名；条目要有名字（和网址）
  const groupErrors = useMemo(() => {
    const seen = new Map()
    for (const g of groups) {
      if (g.items.length === 0) continue
      const k = g.title.trim().toLowerCase()
      seen.set(k, (seen.get(k) || 0) + 1)
    }
    return Object.fromEntries(groups.map((g) => {
      const t = g.title.trim()
      let error = null
      if (t.length > MAX_CATEGORY_LENGTH) error = `Max ${MAX_CATEGORY_LENGTH} characters`
      else if (g.items.length > 0 && seen.get(t.toLowerCase()) > 1) error = t ? 'Another category has this name' : 'Only one category can be unnamed'
      return [g._key, error]
    }))
  }, [groups])

  const itemErrors = useMemo(() => {
    const out = {}
    for (const g of groups) {
      for (const item of g.items) {
        const name = item.name.trim()
        out[item._key] = {
          name: name ? (name.length > 40 ? 'Max 40 characters' : null) : 'Enter a name',
          url: withUrl ? urlError(item.url) : null,
        }
      }
    }
    return out
  }, [groups, withUrl])

  const hasErrors =
    Object.values(groupErrors).some(Boolean) ||
    Object.values(itemErrors).some((e) => e.name || e.url)

  // 有没保存的改动时关页面提醒一下
  useEffect(() => {
    if (!dirty) return
    const warn = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const flash = (key) => {
    setFlashKey(key)
    clearTimeout(flashTimer.current)
    flashTimer.current = setTimeout(() => setFlashKey(null), 700)
  }

  // ---------- 分类 ----------
  const updateGroup = (gKey, patch) =>
    setGroups((list) => list.map((g) => (g._key === gKey ? { ...g, ...patch } : g)))

  const moveGroup = (index, dir) => {
    const j = index + dir
    if (j < 0 || j >= groups.length) return
    flash(groups[index]._key)
    setGroups((list) => swap(list, index, j))
  }

  const addGroup = () => {
    const key = nextKey('group')
    setGroups((list) => [...list, { _key: key, title: 'New category', items: [] }])
    flash(key)
  }

  const removeGroup = (group) => {
    if (group.items.length > 0 && !confirm(`Delete “${group.title || 'Unnamed'}” and its ${group.items.length} ${noun}${group.items.length !== 1 ? 's' : ''}?`)) return
    setGroups((list) => list.filter((g) => g._key !== group._key))
  }

  // ---------- 条目 ----------
  const updateItem = (gKey, iKey, patch) =>
    setGroups((list) => list.map((g) => (
      g._key !== gKey ? g : { ...g, items: g.items.map((it) => (it._key === iKey ? { ...it, ...patch } : it)) }
    )))

  const changeIcon = (gKey, item, value) => {
    // 名字还是旧图标的默认名（或空）就跟着换，自己改过的名字不动
    const oldLabel = getOption(item[iconField]).label
    const keepName = item.name.trim() && item.name.trim() !== oldLabel
    updateItem(gKey, item._key, { [iconField]: value, name: keepName ? item.name : getOption(value).label })
  }

  const moveItem = (gIndex, iIndex, dir) => {
    const items = groups[gIndex].items
    const j = iIndex + dir
    if (j < 0 || j >= items.length) return
    flash(items[iIndex]._key)
    setGroups((list) => list.map((g, gi) => (gi === gIndex ? { ...g, items: swap(g.items, iIndex, j) } : g)))
  }

  // 拖拽排序：松手后一次挪到目标位置
  const reorderItem = (gKey, from, to) => {
    const movedKey = groups.find((g) => g._key === gKey)?.items[from]?._key
    if (movedKey) flash(movedKey)
    setGroups((list) => list.map((g) => {
      if (g._key !== gKey) return g
      const items = [...g.items]
      const [moved] = items.splice(from, 1)
      items.splice(to, 0, moved)
      return { ...g, items }
    }))
  }

  const moveItemToGroup = (fromKey, item, toKey) => {
    if (fromKey === toKey) return
    flash(item._key)
    setGroups((list) => list.map((g) => {
      if (g._key === fromKey) return { ...g, items: g.items.filter((it) => it._key !== item._key) }
      if (g._key === toKey) return { ...g, items: [...g.items, item] }
      return g
    }))
  }

  const addItem = (gKey) => {
    if (totalItems >= maxItems) return
    const key = nextKey('item')
    setGroups((list) => list.map((g) => (
      g._key === gKey ? { ...g, items: [...g.items, { ...newItem(), url: newItem().url ?? '', _key: key }] } : g
    )))
    flash(key)
  }

  const removeItem = (gKey, item) => {
    const touched = withUrl ? item.url.trim() && item.url.trim() !== 'https://' : item.name.trim()
    if (touched && !confirm(`Delete ${item.name || `this ${noun}`}?`)) return
    setGroups((list) => list.map((g) => (g._key === gKey ? { ...g, items: g.items.filter((it) => it._key !== item._key) } : g)))
  }

  const save = async () => {
    if (hasErrors) {
      toast({ title: 'Check the highlighted fields', description: 'Fix the fields marked in red, then save again.', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const authHeaders = await getAuthHeaders()
      const res = await fetch(apiPath, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ [bodyKey]: flat }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      const next = fromData(data)
      setGroups(next)
      setSaved(JSON.stringify(flatten(next)))
      toast({ title: 'Saved', description: `${title} on the homepage are updated.` })
    } catch (err) {
      toast({ title: 'Couldn’t save', description: err.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const discard = () => setGroups(fromData(JSON.parse(saved)))

  // 下拉框按 option.group 分组（Tech Stack 图标多，分组好找）
  const optionGroups = useMemo(() => {
    const map = new Map()
    for (const o of options) {
      const k = o.group || ''
      if (!map.has(k)) map.set(k, [])
      map.get(k).push(o)
    }
    return [...map.entries()]
  }, [options])

  const renderOptions = () =>
    optionGroups.length === 1 && !optionGroups[0][0]
      ? optionGroups[0][1].map((o) => <option key={o.key} value={o.key}>{o.label}</option>)
      : optionGroups.map(([label, list]) => (
          <optgroup key={label || 'other'} label={label || 'Other'}>
            {list.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
          </optgroup>
        ))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex items-center gap-3 text-zinc-400">
          <div className="w-5 h-5 border-2 border-zinc-700 border-t-indigo-500 rounded-full animate-spin" />
          <span className="text-sm">Loading {title.toLowerCase()}...</span>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-white/10 bg-white/[0.02] gap-3">
        <p className="text-sm text-white">Couldn’t load {title.toLowerCase()}</p>
        <p className="text-xs text-zinc-500">{loadError}</p>
        <button onClick={load} className="px-3 py-1.5 rounded-lg border border-white/10 text-zinc-300 hover:text-white text-sm">
          Try again
        </button>
      </div>
    )
  }

  const previewGroups = groups.map((g) => ({
    title: g.title.trim(),
    items: g.items.filter((it) => it.visible !== false).map(toPreviewItem),
  }))

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            {groups.length} categor{groups.length !== 1 ? 'ies' : 'y'} · {totalItems} {noun}{totalItems !== 1 ? 's' : ''} · {shownItems} shown on the homepage
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dirty && (
            <button
              onClick={discard}
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

      {/* 首页预览 */}
      <div className="rounded-xl border border-white/5 bg-black p-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-4">Homepage preview</p>
        {shownItems === 0 ? (
          <p className="text-xs text-zinc-500">Nothing is shown. This section is hidden on the homepage.</p>
        ) : (
          // 和首页同一个组件、同样的参数，显示和悬停效果都一样；底部留出最后一行名字淡入的位置
          <div className="pb-10">
            <IconGroups groups={previewGroups} className="mt-4" />
          </div>
        )}
      </div>

      {emptyGroups > 0 && (
        <p className="text-xs text-amber-400/90">
          {emptyGroups} empty categor{emptyGroups !== 1 ? 'ies' : 'y'} won’t be saved. Add a {noun} to keep it.
        </p>
      )}

      {/* 分类列表 */}
      <LayoutGroup>
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {groups.map((group, gIndex) => {
              const gError = groupErrors[group._key]
              return (
                <motion.section
                  key={group._key}
                  layout="position"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 24, transition: { duration: 0.18 } }}
                  transition={{ layout: { type: 'spring', stiffness: 520, damping: 40 }, opacity: { duration: 0.2 } }}
                  className={`rounded-2xl border bg-zinc-950/60 p-3 sm:p-4 transition-[border-color,box-shadow] duration-300 ${
                    flashKey === group._key ? 'border-indigo-500/50 shadow-[0_0_0_3px_rgba(99,102,241,0.15)]' : 'border-white/10'
                  }`}
                >
                  {/* 分类标题行 */}
                  <div className="flex flex-wrap items-start gap-2 mb-3">
                    <div className="flex items-center gap-0.5 pt-1">
                      <button onClick={() => moveGroup(gIndex, -1)} disabled={gIndex === 0} aria-label="Move category up" className={iconButton}>
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => moveGroup(gIndex, 1)} disabled={gIndex === groups.length - 1} aria-label="Move category down" className={iconButton}>
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex-1 min-w-[180px]">
                      <input
                        value={group.title}
                        onChange={(e) => updateGroup(group._key, { title: e.target.value })}
                        placeholder="Category name (leave empty for no title)"
                        aria-label="Category name"
                        className={`${inputClass} font-semibold ${gError ? 'border-red-500/60' : ''}`}
                      />
                      {gError && <p className="text-[11px] text-red-400 mt-1">{gError}</p>}
                    </div>
                    <span className="text-[11px] text-zinc-500 pt-3 tabular-nums">
                      {group.items.length} {noun}{group.items.length !== 1 ? 's' : ''}
                    </span>
                    <button
                      onClick={() => removeGroup(group)}
                      aria-label="Delete category"
                      title="Delete category"
                      className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 条目 */}
                  <SortableList
                    items={group.items}
                    getKey={(item) => item._key}
                    onReorder={(from, to) => reorderItem(group._key, from, to)}
                    axis="y"
                    className="space-y-2 mb-2"
                  >
                      {(item, iIndex) => {
                        const { Icon } = getOption(item[iconField])
                        const err = itemErrors[item._key] || {}
                        return (
                          <SortableItem
                            key={item._key}
                            id={item._key}
                            animate={{ opacity: item.visible !== false ? 1 : 0.6, y: 0 }}
                            exit={{ opacity: 0, x: 24, transition: { duration: 0.18 } }}
                            draggingClassName="!border-indigo-500/50 !bg-zinc-800"
                            className={`relative rounded-xl border bg-zinc-900 p-3 transition-[border-color,box-shadow,background-color] duration-300 ${
                              flashKey === item._key
                                ? 'border-indigo-500/50 shadow-[0_0_0_3px_rgba(99,102,241,0.15)] z-10'
                                : 'border-white/5 hover:border-white/10'
                            }`}
                          >
                            <div className="flex flex-col lg:flex-row lg:items-start gap-3">
                              {/* 组内排序 */}
                              <div className="flex lg:flex-col items-center gap-1 lg:pt-1">
                                <SortableHandle className="p-1 rounded-md text-zinc-500 hover:text-white hover:bg-white/5">
                                  <GripVertical className="w-3.5 h-3.5" />
                                </SortableHandle>
                                <span className="text-[11px] text-zinc-500 tabular-nums w-5 text-center">{iIndex + 1}</span>
                                <button onClick={() => moveItem(gIndex, iIndex, -1)} disabled={iIndex === 0} aria-label="Move up" className={iconButton}>
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => moveItem(gIndex, iIndex, 1)} disabled={iIndex === group.items.length - 1} aria-label="Move down" className={iconButton}>
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* 图标 */}
                              <label className="flex items-center gap-2 lg:w-52 flex-shrink-0">
                                <span className="w-9 h-9 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center flex-shrink-0">
                                  <Icon size={16} className="text-white" />
                                </span>
                                <select
                                  value={item[iconField]}
                                  onChange={(e) => changeIcon(group._key, item, e.target.value)}
                                  className={inputClass}
                                  aria-label={iconLabel}
                                >
                                  {renderOptions()}
                                </select>
                              </label>

                              {/* 名字 */}
                              <div className={`${withUrl ? 'lg:w-40' : 'lg:flex-1'} flex-shrink-0 min-w-0`}>
                                <input
                                  value={item.name}
                                  onChange={(e) => updateItem(group._key, item._key, { name: e.target.value })}
                                  placeholder="Name shown on the homepage"
                                  aria-label="Name"
                                  className={`${inputClass} ${err.name ? 'border-red-500/60' : ''}`}
                                />
                                {err.name && <p className="text-[11px] text-red-400 mt-1">{err.name}</p>}
                              </div>

                              {/* 网址 */}
                              {withUrl && (
                                <div className="flex-1 min-w-0">
                                  <input
                                    value={item.url}
                                    onChange={(e) => updateItem(group._key, item._key, { url: e.target.value })}
                                    placeholder="https://"
                                    aria-label="URL"
                                    inputMode="url"
                                    spellCheck={false}
                                    className={`${inputClass} font-mono text-[13px] ${err.url ? 'border-red-500/60' : ''}`}
                                  />
                                  {err.url && <p className="text-[11px] text-red-400 mt-1">{err.url}</p>}
                                </div>
                              )}

                              {/* 移到别的分类 */}
                              {groups.length > 1 && (
                                <select
                                  value={group._key}
                                  onChange={(e) => moveItemToGroup(group._key, item, e.target.value)}
                                  aria-label="Category"
                                  title="Move to another category"
                                  className={`${inputClass} lg:w-40 flex-shrink-0`}
                                >
                                  {groups.map((g) => (
                                    <option key={g._key} value={g._key}>{g.title.trim() || 'Unnamed'}</option>
                                  ))}
                                </select>
                              )}

                              {/* 操作 */}
                              <div className="flex items-center gap-1 lg:pt-0.5">
                                <button
                                  onClick={() => updateItem(group._key, item._key, { visible: item.visible === false })}
                                  aria-label={item.visible !== false ? 'Hide on homepage' : 'Show on homepage'}
                                  title={item.visible !== false ? 'Shown on homepage — click to hide' : 'Hidden — click to show'}
                                  className={`p-2 rounded-lg transition-colors ${item.visible !== false ? 'text-zinc-300 hover:bg-white/5' : 'text-zinc-500 hover:bg-white/5'}`}
                                >
                                  {item.visible !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                </button>
                                {withUrl && (
                                  <a
                                    href={err.url ? undefined : item.url.trim()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="Open link"
                                    title="Open link in a new tab"
                                    className={`p-2 rounded-lg transition-colors ${err.url ? 'text-zinc-700 pointer-events-none' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                )}
                                <button
                                  onClick={() => removeItem(group._key, item)}
                                  aria-label="Delete"
                                  className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </SortableItem>
                        )
                      }}
                  </SortableList>

                  <div>
                    <button
                      onClick={() => addItem(group._key)}
                      disabled={totalItems >= maxItems}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-white/10 text-zinc-400 hover:text-white hover:border-white/20 text-sm transition-colors disabled:opacity-40"
                    >
                      <Plus className="w-4 h-4" />
                      {totalItems >= maxItems ? `Up to ${maxItems} ${noun}s` : `Add ${noun} to ${group.title.trim() || 'this category'}`}
                    </button>
                  </div>
                </motion.section>
              )
            })}
          </AnimatePresence>
        </div>
      </LayoutGroup>

      {groups.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed border-white/10 bg-white/[0.02]">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
            <EmptyIcon className="w-5 h-5 text-zinc-500" />
          </div>
          <p className="text-sm font-medium text-white mb-1">No categories yet</p>
          <p className="text-xs text-zinc-500">Add a category below, then add {noun}s to it.</p>
        </div>
      )}

      <button
        onClick={addGroup}
        className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl border border-dashed border-indigo-500/30 text-indigo-300 hover:text-white hover:border-indigo-500/60 text-sm transition-colors"
      >
        <FolderPlus className="w-4 h-4" />
        Add category
      </button>
    </div>
  )
}
