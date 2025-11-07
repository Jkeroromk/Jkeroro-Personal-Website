'use client'

import { useState } from 'react'
import { Heart, X } from 'lucide-react'
import Image from 'next/image'
import { FaPaypal } from 'react-icons/fa'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from '@/components/ui/alert-dialog'

// 微信图标组件
const WeChatIcon = ({ className }) => (
  <div className={className}>
    <Image
      src="/wechat.png"
      alt="WeChat"
      width={24}
      height={24}
      className="w-full h-full object-contain"
      unoptimized
    />
  </div>
)

// 支付宝图标组件
const AlipayIcon = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect width="24" height="24" rx="4" fill="#1677FF" />
    <text
      x="12"
      y="17"
      textAnchor="middle"
      fontSize="14"
      fill="white"
      fontWeight="bold"
      fontFamily="Arial, sans-serif"
    >
      支
    </text>
  </svg>
)

const DonationButton = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState(null)

  const donationMethods = [
    {
      name: '微信支付',
      description: 'WeChat Pay',
      qrCode: '/wechatqr.JPG',
      icon: <WeChatIcon className="w-6 h-6 flex items-center justify-center" />,
    },
    {
      name: '支付宝',
      description: 'Alipay',
      qrCode: '/uploads/alipay-qr.png',
      icon: <AlipayIcon className="w-6 h-6" />,
    },
    {
      name: 'PayPal',
      description: 'PayPal 支付',
      url: 'https://paypal.me/yourusername',
      icon: <FaPaypal className="w-6 h-6 text-[#0070ba]" />,
    },
    {
      name: 'Buy Me a Coffee',
      description: '请我喝咖啡',
      qrCode: '/bmc_qr.png',
      icon: '☕',
    },
  ]

  return (
    <>
      <div className="flex flex-col items-center w-full">
        <button
          onClick={() => setIsOpen(true)}
          className="flex flex-col items-center bg-white bg-opacity-80 border-2 border-black py-6 rounded-3xl mt-10 w-full sm:w-[550px] transition-transform duration-300 hover:scale-105 hover:shadow-[0_0_20px_white] heartbeat"
        >
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-extrabold text-black hover:text-blue-600 transition-colors duration-300">
              Donation
            </h1>
          </div>
          <h2 className="text-sm font-semibold text-black hover:text-blue-600 transition-colors duration-300">
            Support Me
          </h2>
        </button>
      </div>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent className="bg-white bg-opacity-90 border-2 border-black max-w-md rounded-3xl">
          <AlertDialogHeader>
            <div className="flex items-center justify-between">
              <AlertDialogTitle className="text-xl font-extrabold text-black flex items-center gap-2">
                Support Me / 支持我
              </AlertDialogTitle>
              <button
                onClick={() => setIsOpen(false)}
                className="text-black hover:text-blue-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <AlertDialogDescription className="text-gray-700 mt-2">
              Choose your preferred payment method
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="mt-4 space-y-3">
            {donationMethods.map((method, index) => (
              <div key={index}>
                {method.qrCode ? (
                  // 二维码支付方式
                  <div className="w-full rounded-2xl bg-white bg-opacity-80 border-2 border-black text-black transition-all duration-300 hover:shadow-[0_0_10px_rgba(0,0,0,0.2)] overflow-hidden">
                    <button
                      onClick={() => setSelectedMethod(selectedMethod === index ? null : index)}
                      className="w-full flex items-center justify-between p-4 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 flex-shrink-0">
                          {typeof method.icon === 'string' ? (
                            <span className="text-2xl">{method.icon}</span>
                          ) : (
                            method.icon
                          )}
                        </div>
                        <div className="text-left">
                          <div className="font-extrabold text-black">{method.name}</div>
                          <div className="text-sm font-semibold text-gray-700">{method.description}</div>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-gray-600 group-hover:text-blue-600 transition-colors">
                        {selectedMethod === index ? 'Hide QR' : 'Show QR Code'}
                      </span>
                    </button>
                    {/* 二维码显示区域 - 在同一个容器内 */}
                    {selectedMethod === index && (
                      <div className="px-4 pb-4 border-t-2 border-black pt-4">
                        <div className="flex flex-col items-center">
                          <p className="text-sm font-semibold text-black mb-3">Scan QR Code to Pay</p>
                          <div className="relative w-64 h-64 sm:w-80 sm:h-80 bg-white rounded-lg p-2 border border-gray-300">
                            <Image
                              src={method.qrCode}
                              alt={`${method.name} 二维码`}
                              fill
                              className="object-contain rounded"
                              unoptimized
                            />
                          </div>
                          <p className="text-xs font-semibold text-gray-700 mt-3 text-center">
                            {method.name}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // 链接支付方式
                  <a
                    href={method.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-white bg-opacity-80 border-2 border-black text-black transition-all duration-300 hover:scale-105 hover:shadow-[0_0_10px_rgba(0,0,0,0.2)] hover:text-blue-600 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 flex-shrink-0">
                        {typeof method.icon === 'string' ? (
                          <span className="text-2xl">{method.icon}</span>
                        ) : (
                          method.icon
                        )}
                      </div>
                      <div className="text-left">
                        <div className="font-extrabold text-black group-hover:text-blue-600 transition-colors">{method.name}</div>
                        <div className="text-sm font-semibold text-gray-700">{method.description}</div>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-gray-600 group-hover:text-blue-600 transition-colors">Go to Payment</span>
                  </a>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t-2 border-black">
            <p className="text-sm font-semibold text-black text-center">
              Thank you for your support!
            </p>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default DonationButton

