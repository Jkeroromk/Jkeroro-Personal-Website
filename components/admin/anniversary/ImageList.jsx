import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Check, X } from 'lucide-react'

export default function ImageList({
  backgroundImages,
  selectedImageIndex,
  uploading,
  onSelect,
  onDelete,
}) {
  if (backgroundImages.length === 0) {
    return (
      <div className="w-full p-6 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center bg-gray-700">
        <p className="text-gray-400">No background images</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {backgroundImages.map((imageUrl, index) => (
        <div key={index} className="relative group">
          <div 
            className={`relative w-full aspect-video rounded-lg overflow-hidden border-2 transition-all ${
              selectedImageIndex === index 
                ? 'border-pink-400 ring-2 ring-pink-400/50' 
                : 'border-gray-600'
            }`}
          >
            <Image
              src={imageUrl}
              alt={`Background ${index + 1}`}
              fill
              className="object-cover"
              unoptimized={imageUrl.startsWith('/api/file/') || imageUrl.startsWith('https://')}
            />
            {/* 选中标记 */}
            {selectedImageIndex === index && (
              <div className="absolute top-2 left-2 bg-pink-400 text-white rounded-full p-1">
                <Check className="w-4 h-4" />
              </div>
            )}
            {/* Hover 操作按钮 */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                variant={selectedImageIndex === index ? "default" : "secondary"}
                size="sm"
                onClick={() => onSelect(index)}
                disabled={uploading}
              >
                <Check className="w-4 h-4 mr-1" />
                {selectedImageIndex === index ? 'Selected' : 'Select'}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(imageUrl)}
                disabled={uploading}
              >
                <X className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
          <div className="mt-1 text-xs text-gray-400 text-center">
            Image {index + 1}
            {selectedImageIndex === index && (
              <span className="ml-1 text-pink-400">(Selected)</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

