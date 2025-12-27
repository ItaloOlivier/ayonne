'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'

const slides = [
  '/images/carousel/slide-1.png',
  '/images/carousel/slide-2.png',
  '/images/carousel/slide-3.png',
  '/images/carousel/slide-4.png',
  '/images/carousel/slide-5.png',
]

export default function HeroSlideshow() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }, [])

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }, [])

  useEffect(() => {
    if (!isAutoPlaying) return
    const timer = setInterval(nextSlide, 5000)
    return () => clearInterval(timer)
  }, [isAutoPlaying, nextSlide])

  const handleManualNavigation = (index: number) => {
    setIsAutoPlaying(false)
    setCurrentSlide(index)
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  return (
    <section className="relative w-full bg-[#F4EBE7]">
      {/* Slideshow Container - Medium Height */}
      <div className="relative w-full" style={{ paddingBottom: '45%' }}>
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <Image
              src={slide}
              alt={`Ayonne Skincare ${index + 1}`}
              fill
              className="object-contain"
              priority={index === 0}
              sizes="100vw"
            />
          </div>
        ))}

        {/* Navigation Arrows */}
        <button
          onClick={() => {
            setIsAutoPlaying(false)
            prevSlide()
            setTimeout(() => setIsAutoPlaying(true), 10000)
          }}
          className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-white/90 hover:bg-white rounded-full shadow-lg transition-all opacity-0 hover:opacity-100 group-hover:opacity-100"
          style={{ opacity: 0.8 }}
          aria-label="Previous slide"
        >
          <svg className="w-5 h-5 md:w-6 md:h-6 text-[#1C4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={() => {
            setIsAutoPlaying(false)
            nextSlide()
            setTimeout(() => setIsAutoPlaying(true), 10000)
          }}
          className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-white/90 hover:bg-white rounded-full shadow-lg transition-all"
          style={{ opacity: 0.8 }}
          aria-label="Next slide"
        >
          <svg className="w-5 h-5 md:w-6 md:h-6 text-[#1C4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Navigation Dots */}
      <div className="flex justify-center gap-2 py-4">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => handleManualNavigation(index)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? 'bg-[#1C4444] scale-110'
                : 'bg-[#1C4444]/30 hover:bg-[#1C4444]/50'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  )
}
