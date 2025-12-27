'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Product } from '@/types'
import { formatPrice } from '@/lib/utils'
import AddToCartButton from '@/components/product/AddToCartButton'

interface FeaturedProductProps {
  product: Product
  imagePosition?: 'left' | 'right'
}

export default function FeaturedProduct({ product, imagePosition = 'left' }: FeaturedProductProps) {
  const mainImage = product.images?.[0] || '/images/placeholder.png'

  return (
    <section className="py-9 bg-[#F4EBE7]">
      <div className="container mx-auto px-4 lg:px-8">
        <div className={`grid md:grid-cols-2 gap-8 lg:gap-12 items-center ${
          imagePosition === 'right' ? 'md:flex-row-reverse' : ''
        }`}>
          {/* Product Image */}
          <div className={`${imagePosition === 'right' ? 'md:order-2' : ''}`}>
            <Link href={`/products/${product.slug}`} className="block relative aspect-square bg-white rounded-lg overflow-hidden group">
              <Image
                src={mainImage}
                alt={product.name}
                fill
                className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </Link>
          </div>

          {/* Product Details */}
          <div className={`${imagePosition === 'right' ? 'md:order-1' : ''} space-y-4`}>
            <p className="text-xs uppercase tracking-widest text-[#1C4444]/70">
              AYONNE
            </p>

            <Link href={`/products/${product.slug}`}>
              <h2 className="text-2xl md:text-3xl font-normal text-[#1C4444] hover:opacity-80 transition-opacity">
                {product.name}
              </h2>
            </Link>

            <div className="flex items-center gap-3">
              {product.salePrice ? (
                <>
                  <span className="text-xl font-medium text-[#1C4444]">
                    {formatPrice(product.salePrice)}
                  </span>
                  <span className="text-lg text-[#1C4444]/50 line-through">
                    {formatPrice(product.price)}
                  </span>
                </>
              ) : (
                <span className="text-xl font-medium text-[#1C4444]">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>

            <p className="text-[#1C4444]/80 text-sm leading-relaxed line-clamp-3">
              {product.description}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <AddToCartButton product={product} compact className="flex-1" />
              <Link
                href={`/products/${product.slug}`}
                className="text-center py-3 px-6 border border-[#1C4444] text-[#1C4444] text-sm uppercase tracking-wider hover:bg-[#1C4444] hover:text-white transition-colors"
              >
                View Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
