'use client'

// 首屏社交图标下面的一行小链接：CV / Services / Support。
// 原来是三张亮灰色大卡片，散在页面中间；现在跟访客地图同一套深色等宽风格。
// Services 和 Support 的弹窗点开时才加载，不增加首屏 JS。

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { ArrowUpRight } from 'lucide-react'

const DonationDialog = dynamic(() => import('./DonationButton'), { ssr: false })
const PersonalStore = dynamic(() => import('./personalStore'), { ssr: false })

const CV_URL = 'https://3d-portfolio-jade-xi.vercel.app/'

const base =
  'group inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-[#202020] bg-[#0c0c0d]/80 ' +
  'font-mono text-[11px] tracking-[0.14em] uppercase text-[#8a8a86] transition-colors duration-200 ' +
  'hover:text-[#f4f4f2] hover:border-[#3a3a38] focus-visible:outline focus-visible:outline-1 ' +
  'focus-visible:outline-offset-2 focus-visible:outline-[#9fd8a4]'

export default function QuickLinks() {
  const [open, setOpen] = useState(null) // 'services' | 'support' | null

  return (
    <>
      <nav aria-label="Quick links" className="flex flex-wrap justify-center gap-2.5 mt-12 px-4">
        <a href={CV_URL} target="_blank" rel="noopener noreferrer" className={base}>
          CV
          <ArrowUpRight className="h-3 w-3 transition-transform duration-200 group-hover:-translate-y-px group-hover:translate-x-px" />
        </a>
        <button type="button" className={base} onClick={() => setOpen('services')}>
          Services
        </button>
        <button type="button" className={base} onClick={() => setOpen('support')}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#9fd8a4]" aria-hidden="true" />
          Support
        </button>
      </nav>

      {open === 'support' && (
        <DonationDialog open onOpenChange={(v) => !v && setOpen(null)} />
      )}
      {open === 'services' && (
        <PersonalStore open onOpenChange={(v) => !v && setOpen(null)} />
      )}
    </>
  )
}
