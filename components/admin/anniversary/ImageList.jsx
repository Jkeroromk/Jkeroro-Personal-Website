import Image from 'next/image'
import { Check, X } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

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
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {backgroundImages.map((imageUrl, index) => {
        const isSelected = selectedImageIndex === index
        return (
          <div key={index} className="relative group">
            <div
              className={`relative w-full aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                isSelected
                  ? 'border-pink-400 ring-2 ring-pink-400/50'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
            >
              <Image
                src={imageUrl}
                alt={`Background ${index + 1}`}
                fill
                className="object-cover"
                unoptimized={imageUrl.startsWith('/api/file/') || imageUrl.startsWith('https://')}
              />

              {/* Selected badge */}
              {isSelected && (
                <div className="absolute top-1.5 left-1.5 bg-pink-400 text-white rounded-full p-0.5 z-10">
                  <Check className="w-3 h-3" />
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1.5">
                <button
                  onClick={() => onSelect(index)}
                  disabled={uploading}
                  className={`w-full flex items-center justify-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-50 ${
                    isSelected
                      ? 'bg-pink-500 text-white'
                      : 'bg-white/20 hover:bg-white/30 text-white'
                  }`}
                >
                  <Check className="w-3 h-3 flex-shrink-0" />
                  <span>{isSelected ? 'Selected' : 'Select'}</span>
                </button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      disabled={uploading}
                      className="w-full flex items-center justify-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-red-500/80 hover:bg-red-500 text-white transition-colors disabled:opacity-50"
                    >
                      <X className="w-3 h-3 flex-shrink-0" />
                      <span>Delete</span>
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-gray-800 border-gray-700">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white">Delete Image {index + 1}?</AlertDialogTitle>
                      <AlertDialogDescription className="text-gray-400">
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(imageUrl)}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            <div className="mt-1 text-xs text-gray-400 text-center">
              Image {index + 1}
              {isSelected && <span className="ml-1 text-pink-400">(Selected)</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
