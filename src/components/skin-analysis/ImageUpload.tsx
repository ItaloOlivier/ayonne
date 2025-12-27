'use client'

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  onImageSelect: (file: File) => void
  isLoading?: boolean
}

export default function ImageUpload({ onImageSelect, isLoading }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateFile = (file: File): boolean => {
    setError(null)

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setError('Please upload a JPEG, PNG, or WebP image')
      return false
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      setError('Image must be less than 10MB')
      return false
    }

    return true
  }

  const handleFile = useCallback((file: File) => {
    if (!validateFile(file)) return

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    onImageSelect(file)
  }, [onImageSelect])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }, [handleFile])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }, [handleFile])

  const clearPreview = useCallback(() => {
    setPreview(null)
    setError(null)
  }, [])

  if (preview) {
    return (
      <div className="relative">
        <div className="relative aspect-square max-w-md mx-auto rounded-xl overflow-hidden border-2 border-[#1C4444]/20">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          {isLoading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-[#1C4444] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-[#1C4444] font-medium">Analyzing your skin...</p>
                <p className="text-[#1C4444]/60 text-sm mt-1">This may take 15-30 seconds</p>
              </div>
            </div>
          )}
        </div>
        {!isLoading && (
          <button
            onClick={clearPreview}
            className="absolute top-2 right-2 bg-white/90 hover:bg-white text-[#1C4444] p-2 rounded-full shadow-lg transition-colors"
            aria-label="Remove image"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative border-2 border-dashed rounded-xl p-8 md:p-12 transition-colors cursor-pointer',
        dragActive ? 'border-[#1C4444] bg-[#1C4444]/5' : 'border-[#1C4444]/30 hover:border-[#1C4444]/50',
        error && 'border-red-500'
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />

      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1C4444]/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-[#1C4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>

        <h3 className="text-lg font-medium text-[#1C4444] mb-2">
          Upload your selfie
        </h3>
        <p className="text-[#1C4444]/60 mb-4">
          Drag and drop or click to select
        </p>
        <p className="text-sm text-[#1C4444]/50">
          JPEG, PNG, or WebP up to 10MB
        </p>

        {error && (
          <p className="mt-4 text-red-600 text-sm font-medium">{error}</p>
        )}
      </div>
    </div>
  )
}
