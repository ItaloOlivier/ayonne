'use client'

import { useState } from 'react'
import Image from 'next/image'

interface ProductGalleryProps {
  images: string[]
  productName: string
}

export default function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0)

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-white flex items-center justify-center text-[#1C4444]/30">
        No image available
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square bg-white overflow-hidden">
        <Image
          src={images[selectedImage]}
          alt={`${productName} - Image ${selectedImage + 1}`}
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="grid grid-cols-6 gap-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={`relative aspect-square bg-white overflow-hidden border-2 transition-colors ${
                index === selectedImage ? 'border-[#1C4444]' : 'border-transparent hover:border-[#1C4444]/50'
              }`}
            >
              <Image
                src={image}
                alt={`${productName} thumbnail ${index + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
