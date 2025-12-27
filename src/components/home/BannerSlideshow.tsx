'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface BannerSlide {
  image: string
  link?: string
  alt?: string
}

interface BannerSlideshowProps {
  slides: BannerSlide[]
  autoRotate?: boolean
  interval?: number
  aspectRatio?: 'hero' | 'banner' // hero = taller, banner = shorter
}

export default function BannerSlideshow({
  slides,
  autoRotate = true,
  interval = 5000,
  aspectRatio = 'banner'
}: BannerSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length)
  }, [slides.length])

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length)
  }, [slides.length])

  useEffect(() => {
    if (!autoRotate || slides.length <= 1) return

    const timer = setInterval(nextSlide, interval)
    return () => clearInterval(timer)
  }, [autoRotate, interval, nextSlide, slides.length])

  if (slides.length === 0) return null

  const aspectClass = aspectRatio === 'hero'
    ? 'aspect-[16/7] md:aspect-[16/6]'
    : 'aspect-[16/5] md:aspect-[16/4]'

  const renderSlide = (slide: BannerSlide, index: number) => {
    const imageContent = (
      <div className={`relative w-full ${aspectClass} bg-[#F4EBE7]`}>
        <Image
          src={slide.image}
          alt={slide.alt || `Banner ${index + 1}`}
          fill
          className="object-cover"
          sizes="100vw"
          priority={index === 0}
        />
      </div>
    )

    if (slide.link) {
      return (
        <Link href={slide.link} className="block">
          {imageContent}
        </Link>
      )
    }

    return imageContent
  }

  return (
    <section className="relative w-full overflow-hidden">
      {/* Slides Container */}
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {slides.map((slide, index) => (
          <div key={index} className="w-full flex-shrink-0">
            {renderSlide(slide, index)}
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white/80 hover:bg-white rounded-full shadow-md transition-all z-10"
            aria-label="Previous slide"
          >
            <svg className="w-5 h-5 text-[#1C4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white/80 hover:bg-white rounded-full shadow-md transition-all z-10"
            aria-label="Next slide"
          >
            <svg className="w-5 h-5 text-[#1C4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-[#1C4444]'
                  : 'bg-[#1C4444]/30 hover:bg-[#1C4444]/50'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
