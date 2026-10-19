'use client'

// 页面最底部的 Support 入口，点开才加载打赏弹窗
import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Heart } from 'lucide-react'
import IndexRow from './IndexRow'

const DonationDialog = dynamic(() => import('./DonationButton'), { ssr: false })

export default function SupportRow() {
  const [open, setOpen] = useState(false)

  return (
    <div className="w-full mt-14 sm:mt-16">
      <IndexRow eyebrow="Support" title="Buy me a coffee" icon={Heart} onClick={() => setOpen(true)} />
      {open && <DonationDialog open onOpenChange={setOpen} />}
    </div>
  )
}
