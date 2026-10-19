'use client'

// 跟项目列表（ProjectIndex）同款的单行入口：上面一行等宽小字，下面一行大标题，上下各一条渐隐细线。
// 字号比项目标题小一号，占的空间少。用在 CV 和页面底部的 Support。

import { ArrowUpRight } from 'lucide-react'
import { outfit, jetbrainsMono } from '@/lib/fonts'

const line =
  'pointer-events-none absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent'

export default function IndexRow({ eyebrow, title, href, onClick, icon: Icon = ArrowUpRight, className = '' }) {
  const inner = (
    <>
      <span className={`${jetbrainsMono.className} flex items-center gap-2.5 text-[11px] sm:text-xs tracking-[0.14em] uppercase text-white/50 transition-colors duration-300 group-hover:text-white/80`}>
        {eyebrow}
        <Icon
          className="w-3 h-3 transition-transform duration-300 group-hover:-translate-y-px group-hover:translate-x-px"
          aria-hidden="true"
        />
      </span>
      <span className="text-[26px] sm:text-[34px] font-bold tracking-[-0.03em] leading-none transition-transform duration-500 group-hover:scale-[1.04]">
        {title}
      </span>
    </>
  )

  const rowClass =
    'group w-full flex flex-col items-center gap-2.5 py-[16px] sm:py-[18px] px-2 text-center text-white rounded-md ' +
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-4'

  return (
    <div className={`${outfit.className} relative w-full max-w-[880px] mx-auto px-4 ${className}`}>
      <span className={`${line} top-0`} />
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className={rowClass}>
          {inner}
        </a>
      ) : (
        <button type="button" onClick={onClick} className={rowClass}>
          {inner}
        </button>
      )}
      <span className={`${line} bottom-0`} />
    </div>
  )
}
