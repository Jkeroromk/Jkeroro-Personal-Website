'use client'

import React, { useState, useRef } from 'react'
import { X, File, Image, Music } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface FileUploadProps {
  onFileSelect: (file: File, filePath?: string) => void
  accept?: string
  maxSize?: number // in MB
  type?: 'image' | 'audio' | 'any'
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  onFileSelect, 
  accept, 
  maxSize = 10,
  type = 'any'
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const getAcceptTypes = () => {
    switch (type) {
      case 'image':
        return 'image/*'
      case 'audio':
        return 'audio/*'
      default:
        return accept || '*/*'
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'image':
        return <Image className="w-6 h-6" aria-label="Image icon" />
      case 'audio':
        return <Music className="w-6 h-6" aria-label="Music icon" />
      default:
        return <File className="w-6 h-6" aria-label="File icon" />
    }
  }

  const validateFile = (file: File): boolean => {
    // 检查文件大小
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `File size must be less than ${maxSize}MB`,
        variant: "destructive"
      })
      return false
    }

    // 检查文件类型
    if (type === 'image' && !file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive"
      })
      return false
    }

    if (type === 'audio' && !file.type.startsWith('audio/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an audio file",
        variant: "destructive"
      })
      return false
    }

    return true
  }

  const handleFileSelect = async (file: File) => {
    if (validateFile(file)) {
      setSelectedFile(file)
      
      try {
        // 创建FormData并上传文件
        const formData = new FormData()
        formData.append('file', file)
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })
        
        const result = await response.json()
        
        if (result.success) {
          // 上传成功，调用onFileSelect并传递文件路径
          console.log('Upload result:', result)
          onFileSelect(file, result.filePath)
          toast({
            title: "Upload successful",
            description: result.isFirebase 
              ? "File uploaded to Firebase Storage successfully"
              : result.isTemporary 
                ? "File uploaded successfully (temporary storage)"
                : "File uploaded successfully",
          })
        } else {
          throw new Error(result.error || 'Upload failed')
        }
      } catch (error) {
        console.error('Upload error:', error)
        toast({
          title: "Upload failed",
          description: error instanceof Error ? error.message : 'Failed to upload file',
          variant: "destructive"
        })
        setSelectedFile(null)
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemove = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept={getAcceptTypes()}
        onChange={handleFileInputChange}
        className="hidden"
      />
      
      {!selectedFile ? (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragging 
              ? 'border-white bg-white/10' 
              : 'border-gray-600 hover:border-gray-500'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <div className="flex flex-col items-center space-y-2">
            {getIcon()}
            <div className="text-sm text-gray-300">
              <p className="font-medium">Click to upload or drag and drop</p>
              <p className="text-gray-500">
                {type === 'image' && 'PNG, JPG, WEBP up to 10MB'}
                {type === 'audio' && 'MP3, WAV, OGG up to 10MB'}
                {type === 'any' && 'Any file up to 10MB'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-gray-600 rounded-lg p-4 bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getIcon()}
              <div>
                <p className="text-sm font-medium text-white">{selectedFile.name}</p>
                <p className="text-xs text-gray-400">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default FileUpload
