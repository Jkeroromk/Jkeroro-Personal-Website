'use client'

import { useEffect, useState } from 'react'
import { DEFAULT_SOCIAL_LINKS, LINKS_PER_ROW, getPlatform } from '@/lib/social-platforms'

// 链接在后台 Social Links 里编辑，存在数据库里。
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

function chunk(list, size) {
  const rows = []
  for (let i = 0; i < list.length; i += size) rows.push(list.slice(i, i + size))
  return rows
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

  const rows = chunk(links.filter((l) => l.visible !== false), LINKS_PER_ROW)
  if (rows.length === 0) return null

  return (
    // 每行 5 个，间距对齐 Tech Stack（5 列 grid）
    // gap-y-14：图标 hover 放大 2 倍 + 下方文字（mt-4 + 一行字）约 45px，
    // 留出余量，第一行的文字不会压到第二行的图标
    <div className="flex flex-col items-center gap-y-14 mt-6">
      {rows.map((row, i) => (
        // 满 5 个用 grid 对齐 Tech Stack；不满一行（比如最后一行只有 2 个）就居中
        <div
          key={i}
          className={`${row.length === LINKS_PER_ROW ? 'grid grid-cols-5' : 'flex justify-center'} gap-6 max-w-[600px] mx-4 sm:mx-0`}
        >
          {row.map(({ id, platform, name, url }, j) => {
            const { Icon, hover } = getPlatform(platform)
            return (
              <a
                key={id || `${platform}-${j}`}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={name}
                className="flex flex-col items-center justify-center group w-[60px]"
              >
                <div className="relative flex flex-col items-center">
                  <Icon size={25} className={`hover:scale-[2.0] transform transition-transform duration-300 text-white ${hover}`} />
                  <span className="absolute top-full mt-4 font-bold text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none text-white">
                    {name}
                  </span>
                </div>
              </a>
            )
          })}
        </div>
      ))}
    </div>
  )
}

export default SocialLinks
