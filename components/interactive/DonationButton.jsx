'use client'

// 打赏弹窗（Support）。入口是页面最底部的 SupportRow，这里只管弹窗本身。
// 样式跟访客地图同一套：深色面板、等宽小标题。

import { useState } from 'react'
import { X, ChevronDown, ArrowUpRight } from 'lucide-react'
import Image from 'next/image'
import { FaPaypal } from 'react-icons/fa'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'

const WeChatIcon = () => (
  <Image src="/wechat.png" alt="" width={20} height={20} className="w-5 h-5 object-contain" unoptimized />
)

const donationMethods = [
  { name: 'WeChat Pay', description: '微信支付', qrCode: '/wechatqr.JPG', icon: <WeChatIcon /> },
  // TODO: 换成真实的 PayPal.me 链接
  { name: 'PayPal', description: 'PayPal 支付', url: 'https://paypal.me/yourusername', icon: <FaPaypal className="w-5 h-5 text-[#8a8a86]" /> },
  { name: 'Buy Me a Coffee', description: '请我喝咖啡', qrCode: '/bmc_qr.png', icon: <span className="text-lg leading-none">☕</span> },
]

const row =
  'w-full flex items-center justify-between gap-3 p-3.5 text-left transition-colors hover:bg-[#141415] ' +
  'focus-visible:outline focus-visible:outline-1 focus-visible:-outline-offset-1 focus-visible:outline-[#9fd8a4]'

export default function DonationDialog({ open, onOpenChange }) {
  const [selected, setSelected] = useState(null)

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="block w-[calc(100vw-24px)] max-w-[440px] max-h-[88dvh] overflow-y-auto p-0 gap-0 rounded-[14px] sm:rounded-[14px] bg-[#0c0c0d] text-[#f4f4f2] border border-[#202020] [color-scheme:dark] [scrollbar-width:thin]">
        <div className="flex items-center justify-between gap-3 px-[18px] pt-4">
          <AlertDialogTitle className="font-mono text-[11px] font-semibold tracking-[0.18em] uppercase">
            Support
          </AlertDialogTitle>
          <AlertDialogCancel
            aria-label="Close"
            className="mt-0 sm:mt-0 h-7 w-7 p-0 rounded-full border border-[#202020] bg-transparent text-[#8a8a86] hover:bg-[#141415] hover:text-[#f4f4f2]"
          >
            <X className="h-3.5 w-3.5" />
          </AlertDialogCancel>
        </div>
        <AlertDialogDescription className="px-[18px] pt-2 pb-4 text-sm text-[#8a8a86]">
          If something here helped you, you can buy me a coffee. 谢谢支持！
        </AlertDialogDescription>

        <ul className="mx-[18px] mb-[18px] border border-[#202020] rounded-[10px] overflow-hidden divide-y divide-[#202020]">
          {donationMethods.map((m, i) => (
            <li key={m.name}>
              {m.qrCode ? (
                <>
                  <button type="button" className={row} aria-expanded={selected === i} onClick={() => setSelected(selected === i ? null : i)}>
                    <span className="flex items-center gap-3 min-w-0">
                      <span className="flex w-8 h-8 items-center justify-center rounded-full border border-[#202020] shrink-0">{m.icon}</span>
                      <span className="min-w-0">
                        <span className="block text-sm">{m.name}</span>
                        <span className="block font-mono text-[11px] text-[#8a8a86]">{m.description}</span>
                      </span>
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[10px] tracking-[0.12em] uppercase text-[#8a8a86]">
                      {selected === i ? 'Hide' : 'QR'}
                      <ChevronDown className={`h-3 w-3 transition-transform ${selected === i ? 'rotate-180' : ''}`} />
                    </span>
                  </button>
                  {selected === i && (
                    <div className="flex flex-col items-center gap-2 px-4 pb-5 pt-1">
                      <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-[10px] bg-white p-2">
                        <Image src={m.qrCode} alt={`${m.name} QR code`} fill className="object-contain p-2" unoptimized />
                      </div>
                      <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-[#8a8a86]">Scan to pay</span>
                    </div>
                  )}
                </>
              ) : (
                <a href={m.url} target="_blank" rel="noopener noreferrer" className={row}>
                  <span className="flex items-center gap-3 min-w-0">
                    <span className="flex w-8 h-8 items-center justify-center rounded-full border border-[#202020] shrink-0">{m.icon}</span>
                    <span className="min-w-0">
                      <span className="block text-sm">{m.name}</span>
                      <span className="block font-mono text-[11px] text-[#8a8a86]">{m.description}</span>
                    </span>
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-[#8a8a86]" />
                </a>
              )}
            </li>
          ))}
        </ul>
      </AlertDialogContent>
    </AlertDialog>
  )
}
