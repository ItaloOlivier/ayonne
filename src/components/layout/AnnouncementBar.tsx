'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const announcements = [
  { text: 'FREE SHIPPING ON ORDERS OVER $50', link: '/collections/all' },
  { text: 'CRUELTY-FREE & VEGAN SKINCARE', link: '/pages/about' },
  { text: 'SHIPS FROM NORTH AMERICA', link: '/pages/shipping' },
]

export default function AnnouncementBar() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-[#1C4444] text-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center py-2.5 relative">
          {/* Previous Button */}
          <button
            onClick={() => setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length)}
            className="absolute left-4 p-1 hover:opacity-70 transition-opacity"
            aria-label="Previous announcement"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Announcement Text */}
          <Link
            href={announcements[currentIndex].link}
            className="text-xs md:text-sm font-medium tracking-wider hover:opacity-80 transition-opacity text-center"
          >
            {announcements[currentIndex].text}
          </Link>

          {/* Next Button */}
          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % announcements.length)}
            className="absolute right-4 p-1 hover:opacity-70 transition-opacity"
            aria-label="Next announcement"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
