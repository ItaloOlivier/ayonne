'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Product } from '@/types'
import { formatPrice } from '@/lib/utils'
import { useCartStore } from '@/store/cart'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    if (product.inStock) {
      addItem(product)
    }
  }

  const hasDiscount = product.salePrice && product.salePrice < product.price
  const displayPrice = product.salePrice ?? product.price

  return (
    <div className="group">
      <Link href={`/products/${product.slug}`} className="block">
        {/* Image */}
        <div className="relative aspect-square bg-white rounded-lg overflow-hidden mb-4">
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#1C4444]/30">
              No image
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-2">
            {hasDiscount && (
              <span className="bg-[#1C4444] text-white text-xs px-2 py-1 rounded">
                Sale
              </span>
            )}
            {!product.inStock && (
              <span className="bg-[#1C4444]/50 text-white text-xs px-2 py-1 rounded">
                Sold out
              </span>
            )}
          </div>

          {/* Quick Add Button */}
          {product.inStock && (
            <button
              onClick={handleAddToCart}
              className="absolute bottom-2 left-2 right-2 bg-[#1C4444] text-white py-2 text-sm opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Add to cart
            </button>
          )}
        </div>

        {/* Product Info */}
        <div className="text-center">
          <h3 className="text-[#1C4444] text-sm mb-2 line-clamp-2">
            {product.name}
          </h3>
          <div className="flex items-center justify-center gap-2">
            <span className="text-[#1C4444] font-medium">
              {formatPrice(displayPrice)}
            </span>
            {hasDiscount && (
              <span className="text-[#1C4444]/50 line-through text-sm">
                {formatPrice(product.price)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  )
}
