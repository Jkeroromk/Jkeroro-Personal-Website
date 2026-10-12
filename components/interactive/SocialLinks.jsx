'use client'

import { useEffect, useState } from 'react'
import { DEFAULT_SOCIAL_LINKS, getPlatform } from '@/lib/social-platforms'
import { groupByCategory } from '@/lib/link-groups'
import IconGroups from './IconGroups'

// 链接在后台 Social Links 里编辑（可以分类），存在数据库里。
// 先用本地缓存（上次拿到的）瞬间渲染，没有缓存就用默认那份，再去接口拿最新的。
const CACHE_KEY = 'jk:social-links'

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    const data = raw ? JSON.parse(raw) : null
    return Array.isArray(data) ? data : null
  } catch {
    return null
  }
}

const SocialLinks = () => {
  const [links, setLinks] = useState(DEFAULT_SOCIAL_LINKS)

  useEffect(() => {
    const cached = readCache()
    if (cached) setLinks(cached)

    let cancelled = false
    fetch('/api/social-links')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !Array.isArray(data)) return
        setLinks(data)
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)) } catch { /* 存储不可用就算了 */ }
      })
      .catch(() => { /* 接口失败就继续用缓存/默认 */ })
    return () => { cancelled = true }
  }, [])

  const groups = groupByCategory(links.filter((l) => l.visible !== false)).map((group) => ({
    title: group.title,
    items: group.items.map(({ id, platform, name, url }, i) => {
      const { Icon, hover } = getPlatform(platform)
      return { key: id || `${platform}-${i}`, name, Icon, hover, href: url }
    }),
  }))

  return <IconGroups groups={groups} className="mt-8" />
}

export default SocialLinks
