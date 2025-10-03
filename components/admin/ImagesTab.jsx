'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Edit, Trash2, Image } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const ImagesTab = ({ images, onEdit, onDelete }) => {
  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Image className="w-5 h-5 mr-2" />
          Images ({images.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {images.map((image) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800 rounded-lg overflow-hidden"
            >
              <img 
                src={image.src} 
                alt={image.alt}
                className="w-full h-32 object-cover"
              />
              <div className="p-4">
                <h3 className="font-semibold text-white">{image.alt}</h3>
                <p className="text-sm text-gray-400">{image.src}</p>
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onEdit(image, 'image')}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onDelete(image.id, 'image')}
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
