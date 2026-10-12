'use client'

/**
 * 首页 Tech Stack 的分组图标网格。
 * 每组：分类标题（两侧渐变细线）+ 图标网格，每行 5 个，不满一行时居中。
 * 图标沿用原来 Tech Stack 的悬停效果：GSAP 翻转一圈并放大 2 倍、变成品牌色，名字在下面淡入。
 * 后台的预览也用这个组件（compact：小尺寸、名字常驻、不做动画）。
 *
 * groups: [{ title, items: [{ key, name, Icon, hover, href? }] }]
 */

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap/dist/gsap'

const PER_ROW = 5

const chunk = (list, size) => {
  const rows = []
  for (let i = 0; i < list.length; i += size) rows.push(list.slice(i, i + size))
  return rows
}

// 原来 Tech Stack 的效果：鼠标移到图标上，翻转 360° 并放大 2 倍；移开还原
const FlipIcon = ({ Icon, hover }) => {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    gsap.set(el, { transformOrigin: 'center' })
    const enter = () => gsap.to(el, { scale: 2, rotationY: 360, duration: 0.3, ease: 'power2.inOut', overwrite: 'auto' })
    const leave = () => gsap.to(el, { scale: 1, rotationY: 0, duration: 0.3, ease: 'power2.inOut', overwrite: 'auto' })
    el.addEventListener('mouseenter', enter)
    el.addEventListener('mouseleave', leave)
    return () => {
      el.removeEventListener('mouseenter', enter)
      el.removeEventListener('mouseleave', leave)
      gsap.killTweensOf(el)
    }
  }, [])

  return (
    <span ref={ref} className="inline-flex will-change-transform">
      <Icon size={25} aria-hidden="true" className={`text-white transition-colors duration-300 ${hover}`} />
    </span>
  )
}

const Tile = ({ item }) => {
  const { Icon, name, hover, href } = item
  const content = (
    <div className="relative flex flex-col items-center">
      <FlipIcon Icon={Icon} hover={hover} />
      <span className="absolute top-full mt-4 font-bold text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition duration-300 pointer-events-none text-white">
        {name}
      </span>
    </div>
  )
  const className =
    'group flex flex-col items-center justify-center w-[60px] rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-4'

  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={name} className={className}>
      {content}
    </a>
  ) : (
    <div className={className} title={name}>
      {content}
    </div>
  )
}

// 后台预览用：小尺寸、名字常驻，方便核对
const CompactTile = ({ item }) => {
  const { Icon, name } = item
  return (
    <div className="flex flex-col items-center gap-1.5 w-14">
      <Icon size={22} className="text-white" aria-hidden="true" />
      <span className="text-[10px] text-zinc-500 truncate max-w-full">{name}</span>
    </div>
  )
}

const GroupTitle = ({ title, compact }) => (
  <div className={`flex items-center gap-4 px-4 w-full ${compact ? 'mb-3' : 'mb-2'}`}>
    <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-transparent to-white/30" />
    <h3 className={`${compact ? 'text-xs' : 'text-sm sm:text-base'} font-bold text-white/90 tracking-wide whitespace-nowrap`}>
      {title}
    </h3>
    <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-l from-transparent to-white/30" />
  </div>
)

const IconGroups = ({ groups, compact = false, className = '' }) => {
  const visibleGroups = groups.filter((g) => g.items.length > 0)
  if (visibleGroups.length === 0) return null

  if (compact) {
    return (
      <div className={`flex flex-col items-center w-full gap-6 ${className}`}>
        {visibleGroups.map((group, i) => (
          <section key={`${group.title}-${i}`} className="w-full max-w-[600px]">
            {group.title && <GroupTitle title={group.title} compact />}
            <div className="flex flex-wrap justify-center gap-3 px-2">
              {group.items.map((item) => <CompactTile key={item.key} item={item} />)}
            </div>
          </section>
        ))}
      </div>
    )
  }

  return (
    <div className={`flex flex-col items-center w-full gap-14 ${className}`}>
      {visibleGroups.map((group, i) => (
        <section
          key={`${group.title}-${i}`}
          aria-label={group.title || undefined}
          className="flex flex-col items-center w-full max-w-[600px]"
        >
          {group.title && <GroupTitle title={group.title} />}
          {/* 和原来一样：每行 5 个，行距留够放大 2 倍 + 名字的空间 */}
          <div className="flex flex-col items-center gap-y-14 mt-6">
            {chunk(group.items, PER_ROW).map((row, r) => (
              <div
                key={r}
                className={`${row.length === PER_ROW ? 'grid grid-cols-5' : 'flex justify-center'} gap-6 max-w-[600px] mx-4 sm:mx-0`}
              >
                {row.map((item) => <Tile key={item.key} item={item} />)}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

export default IconGroups
