'use client'

import { useState, useEffect } from 'react'

const reviews = [
  {
    rating: 5,
    title: 'Amazing Results!',
    text: "This rose gold oil is absolutely amazing! My skin has never looked better. The glow is unreal and it absorbs so quickly. I've been using it for 3 weeks and already see a huge difference.",
    author: 'Sarah M.',
    product: 'Anti-aging Rose Gold Oil',
    verified: true,
  },
  {
    rating: 5,
    title: 'Best Vitamin C Serum',
    text: "I've tried so many vitamin C serums and this one is by far the best. My dark spots have faded significantly in just 4 weeks. The texture is perfect - not sticky at all.",
    author: 'Jennifer K.',
    product: 'Vitamin C Brightening Toner',
    verified: true,
  },
  {
    rating: 5,
    title: 'Worth Every Penny',
    text: "The Biohacker's Bundle was worth every penny. My entire skincare routine is now elevated. I'm seeing real anti-aging results. Highly recommend!",
    author: 'Michael R.',
    product: "Biohacker's Bundle",
    verified: true,
  },
  {
    rating: 5,
    title: 'Life Changing!',
    text: "My skin has completely transformed. Fine lines are diminishing and my complexion is more even. This is now a staple in my routine. Thank you Ayonne!",
    author: 'Lisa T.',
    product: 'Collagen & Retinol Serum',
    verified: true,
  },
  {
    rating: 5,
    title: 'So Hydrating',
    text: "Perfect for my dry skin! This moisturizer keeps me hydrated all day without feeling heavy. Love the natural ingredients and the subtle scent.",
    author: 'Amanda H.',
    product: 'Hyaluronic Moisturizer',
    verified: true,
  },
]

export default function ReviewsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [itemsPerView, setItemsPerView] = useState(3)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setItemsPerView(1)
      } else if (window.innerWidth < 1024) {
        setItemsPerView(2)
      } else {
        setItemsPerView(3)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const maxIndex = Math.max(0, reviews.length - itemsPerView)

  const nextSlide = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, maxIndex))
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0))
  }

  return (
    <section className="py-12 md:py-16 bg-[#F4EBE7]">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-normal text-[#1C4444] mb-2">
            Let customers speak for us
          </h2>
          <div className="flex items-center justify-center gap-1 mb-1">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="w-5 h-5 text-yellow-500 fill-current" viewBox="0 0 20 20">
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
              </svg>
            ))}
          </div>
          <p className="text-sm text-[#1C4444]/70">from 470 reviews</p>
        </div>

        {/* Reviews Carousel */}
        <div className="relative">
          {/* Previous Button */}
          {currentIndex > 0 && (
            <button
              onClick={prevSlide}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
              aria-label="Previous reviews"
            >
              <svg className="w-5 h-5 text-[#1C4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Reviews Container */}
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)` }}
            >
              {reviews.map((review, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 px-3"
                  style={{ width: `${100 / itemsPerView}%` }}
                >
                  <div className="bg-white p-6 h-full rounded-lg shadow-sm">
                    {/* Stars */}
                    <div className="flex gap-1 mb-3">
                      {[...Array(review.rating)].map((_, i) => (
                        <svg key={i} className="w-4 h-4 text-yellow-500 fill-current" viewBox="0 0 20 20">
                          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                        </svg>
                      ))}
                    </div>

                    {/* Title */}
                    <h3 className="font-medium text-[#1C4444] mb-2">{review.title}</h3>

                    {/* Review Text */}
                    <p className="text-sm text-[#1C4444]/80 mb-4 line-clamp-4">
                      &ldquo;{review.text}&rdquo;
                    </p>

                    {/* Author Info */}
                    <div className="mt-auto">
                      <p className="font-medium text-[#1C4444] text-sm">{review.author}</p>
                      <p className="text-xs text-[#1C4444]/60">{review.product}</p>
                      {review.verified && (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600 mt-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Verified Buyer
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Next Button */}
          {currentIndex < maxIndex && (
            <button
              onClick={nextSlide}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
              aria-label="Next reviews"
            >
              <svg className="w-5 h-5 text-[#1C4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {[...Array(maxIndex + 1)].map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-[#1C4444]' : 'bg-[#1C4444]/30'
              }`}
              aria-label={`Go to review group ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
