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
      {/* Image */}
      <div className="relative aspect-square bg-white overflow-hidden mb-3">
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#1C4444]/30 text-sm">
            No image
          </div>
        )}

        {/* Sale Badge */}
        {hasDiscount && (
          <span className="absolute top-2 left-2 bg-[#1C4444] text-white text-xs px-2 py-1">
            Sale
          </span>
        )}

        {/* Sold Out Badge */}
        {!product.inStock && (
          <span className="absolute top-2 right-2 bg-[#1C4444]/60 text-white text-xs px-2 py-1">
            Sold out
          </span>
        )}
      </div>

      {/* Product Info */}
      <div className="text-center">
        <h3 className="text-[#1C4444] text-sm mb-1 leading-tight">
          {product.name}
        </h3>
        <div className="flex items-center justify-center gap-2">
          {hasDiscount ? (
            <>
              <span className="text-[#1C4444]/50 line-through text-sm">
                {formatPrice(product.price)}
              </span>
              <span className="text-[#1C4444] text-sm">
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
