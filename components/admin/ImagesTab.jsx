'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Edit, Trash2, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const ImagesTab = ({ images, onEdit, onDelete, onAddNew }) => {
  return (
    <Card className="bg-gray-800 border-gray-600">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center">
            <ImageIcon className="w-5 h-5 mr-2" />
            Images ({images.length})
          </CardTitle>
          <Button
            onClick={() => onAddNew('image')}
            className="bg-white text-black hover:bg-gray-200"
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            Add Image
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* 桌面端：网格布局 */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-6">
          {images.map((image) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="group bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl overflow-hidden border border-gray-600 hover:border-gray-500 transition-all duration-300 hover:shadow-lg hover:shadow-gray-800/50"
            >
              {/* 图片容器 */}
              <div className="relative aspect-square bg-gray-600 overflow-hidden">
                {image.src && image.src.trim() !== '' ? (
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    className="object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
                {/* 悬停时的操作按钮 */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onEdit(image, 'image')}
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onDelete(image.id, 'image')}
                    className="bg-red-600/80 hover:bg-red-700/80 text-white"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* 信息区域 */}
              <div className="p-4">
                <h3 className="font-semibold text-white text-sm mb-1 truncate" title={image.alt}>
                  {image.alt}
                </h3>
                <p className="text-xs text-gray-400 truncate" title={image.src}>
                  {image.src.split('/').pop()}
                </p>
                <div className="mt-3">
                  <span className="text-xs text-gray-500">
                    {image.width} × {image.height}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 移动端：列表布局 */}
        <div className="md:hidden space-y-3">
          {images.map((image, index) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="rounded-lg p-3 bg-gray-700 hover:bg-gray-600 transition-colors duration-150"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center flex-1 min-w-0">
                  <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center mr-3 relative flex-shrink-0">
                    {image.src && image.src.trim() !== '' ? (
                      <Image
                        src={image.src}
                        alt={image.alt}
                        fill
                        className="object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white truncate">{image.alt}</h3>
                      <span className="text-xs text-gray-500 bg-gray-700 px-1 py-0.5 rounded flex-shrink-0">
                        #{index + 1}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-600 bg-gray-700 px-1 py-0.5 rounded flex-shrink-0">
                        {image.width} × {image.height}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onEdit(image, 'image')}
                    className="hover:bg-gray-600 h-8 px-2"
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onDelete(image.id, 'image')}
                    className="hover:bg-red-600 h-8 px-2"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default ImagesTab
