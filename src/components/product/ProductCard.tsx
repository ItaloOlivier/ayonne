'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Product } from '@/types'
import { formatPrice } from '@/lib/utils'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const hasDiscount = product.salePrice && product.salePrice < product.price
  const displayPrice = product.salePrice ?? product.price

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      {/* Image Container */}
      <div className="relative aspect-square bg-white overflow-hidden mb-4">
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#1C4444]/30 text-sm">
            No image
          </div>
        )}

        {/* Sale Badge - Bottom Left */}
        {hasDiscount && (
          <span className="absolute bottom-2 left-2 bg-[#1C4444] text-white text-[10px] uppercase tracking-wider px-2 py-1 rounded-full">
            Sale
          </span>
        )}

        {/* Sold Out Badge */}
        {!product.inStock && (
          <span className="absolute bottom-2 left-2 bg-[#1C4444]/60 text-white text-[10px] uppercase tracking-wider px-2 py-1 rounded-full">
            Sold out
          </span>
        )}
      </div>

      {/* Product Info - Center Aligned */}
      <div className="text-center px-2">
        <h3 className="text-[#1C4444] text-sm font-normal mb-2 leading-snug group-hover:underline underline-offset-2">
          {product.name}
        </h3>
        <div className="flex items-center justify-center gap-2">
          {hasDiscount ? (
            <>
              <span className="text-[#1C4444]/50 line-through text-sm">
                {formatPrice(product.price)}
              </span>
              <span className="text-[#1C4444] text-sm font-medium">
                {formatPrice(displayPrice)}
              </span>
            </>
          ) : (
            <span className="text-[#1C4444] text-sm">
              {formatPrice(displayPrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
