'use client'

// 居中的深色卡片入口：一行标题 + 一行等宽小字。用在 Tech Stack 上面的 CV 和页面最底部的 Support。
// 标题后面的小图标是绝对定位挂在文字右边的，不参与居中，
// 这样标题文字本身跟下面 “Tech Stack” 这些居中标题在同一条中线上。

import { ArrowUpRight } from 'lucide-react'
import { jetbrainsMono } from '@/lib/fonts'

export default function LinkCard({ title, sub, href, onClick, icon: Icon = ArrowUpRight, className = '' }) {
  const inner = (
    <>
      <span className="relative inline-block text-[19px] font-bold leading-tight">
        {title}
        <Icon
          aria-hidden="true"
          className="absolute left-full top-1/2 ml-1.5 h-[15px] w-[15px] -translate-y-1/2 text-white/70 transition-transform duration-300 group-hover:-translate-y-[60%] group-hover:translate-x-px"
        />
      </span>
      <span className={`${jetbrainsMono.className} text-[10.5px] tracking-[0.14em] uppercase text-white/50`}>
        {sub}
      </span>
    </>
  )

  const cardClass =
    'group w-full sm:w-[550px] flex flex-col items-center gap-1.5 py-[18px] px-12 rounded-[18px] ' +
    'border border-white/[0.12] bg-white/[0.04] backdrop-blur-sm text-white text-center ' +
    'transition-colors duration-300 hover:bg-white/[0.07] hover:border-white/20 ' +
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-4'

  return (
    <div className={`flex justify-center w-full px-4 ${className}`}>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className={cardClass}>
          {inner}
        </a>
      ) : (
        <button type="button" onClick={onClick} className={cardClass}>
          {inner}
        </button>
      )}
    </div>
  )
}
