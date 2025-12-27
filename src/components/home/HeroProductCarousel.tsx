'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Product } from '@/types'
import { formatPrice } from '@/lib/utils'

interface HeroProductCarouselProps {
  products: Product[]
}

export default function HeroProductCarousel({ products }: HeroProductCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScrollability = () => {
    const container = scrollContainerRef.current
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0)
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 10
      )
    }
  }

  useEffect(() => {
    checkScrollability()
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', checkScrollability)
      window.addEventListener('resize', checkScrollability)
      return () => {
        container.removeEventListener('scroll', checkScrollability)
        window.removeEventListener('resize', checkScrollability)
      }
    }
  }, [products])

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current
    if (container) {
      const scrollAmount = container.clientWidth * 0.8
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  if (products.length === 0) {
    return null
  }

  return (
    <section className="relative py-6 bg-[#F4EBE7]">
      <div className="relative">
        {/* Left Arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-white/90 hover:bg-white rounded-full shadow-lg transition-all"
            aria-label="Scroll left"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6 text-[#1C4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Right Arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-white/90 hover:bg-white rounded-full shadow-lg transition-all"
            aria-label="Scroll right"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6 text-[#1C4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Scrollable Product Container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide px-4 md:px-8 pb-4 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              className="flex-shrink-0 w-[280px] md:w-[320px] snap-start group"
            >
              {/* Product Card with Background Image */}
              <div className="relative aspect-[4/5] overflow-hidden rounded-lg">
                {/* Background Image */}
                <Image
                  src={product.images[0] || '/images/placeholder.png'}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 280px, 320px"
                />

                {/* Gradient Overlay for Text */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Product Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  {/* Small Product Thumbnail */}
                  <div className="flex items-end gap-3">
                    <div className="w-12 h-12 bg-white rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={product.images[0] || '/images/placeholder.png'}
                        alt={product.name}
                        width={48}
                        height={48}
                        className="w-full h-full object-contain p-1"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium truncate">{product.name}</h3>
                      <p className="text-sm opacity-90">
                        {product.salePrice ? formatPrice(product.salePrice) : formatPrice(product.price)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sale Badge */}
                {product.salePrice && (
                  <span className="absolute top-3 left-3 bg-[#1C4444] text-white text-[10px] uppercase tracking-wider px-2 py-1 rounded-full">
                    Sale
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
