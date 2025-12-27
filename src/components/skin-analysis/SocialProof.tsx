'use client'

import { useEffect, useState } from 'react'

interface SocialProofProps {
  variant?: 'banner' | 'compact' | 'inline'
}

// Simulated real-time activity (in production, this would come from an API)
const ACTIVITIES = [
  { name: 'Sarah M.', action: 'just completed their skin analysis', location: 'Los Angeles' },
  { name: 'Emma K.', action: 'improved their skin score by 12 points', location: 'New York' },
  { name: 'Jessica L.', action: 'purchased Vitamin C Lotion', location: 'Miami' },
  { name: 'Ashley R.', action: 'started their skincare journey', location: 'Chicago' },
  { name: 'Michelle T.', action: 'achieved a 7-day streak', location: 'Houston' },
  { name: 'Amanda B.', action: 'unlocked the Glow Up badge', location: 'Phoenix' },
  { name: 'Rachel W.', action: 'just completed their skin analysis', location: 'Seattle' },
  { name: 'Nicole P.', action: 'purchased Anti-Aging Serum', location: 'Denver' },
]

export default function SocialProof({ variant = 'banner' }: SocialProofProps) {
  const [currentActivity, setCurrentActivity] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [usersToday, setUsersToday] = useState(0)

  // Animate users count
  useEffect(() => {
    const targetCount = 127 + Math.floor(Math.random() * 50) // Random between 127-176
    const duration = 2000
    const steps = 30
    const increment = targetCount / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= targetCount) {
        setUsersToday(targetCount)
        clearInterval(timer)
      } else {
        setUsersToday(Math.floor(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [])

  // Rotate through activities
  useEffect(() => {
    const showActivity = () => {
      setIsVisible(true)
      setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => {
          setCurrentActivity(prev => (prev + 1) % ACTIVITIES.length)
        }, 500)
      }, 4000)
    }

    showActivity()
    const interval = setInterval(showActivity, 6000)
    return () => clearInterval(interval)
  }, [])

  const activity = ACTIVITIES[currentActivity]

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2 text-sm">
        <div className="flex -space-x-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="w-6 h-6 rounded-full bg-gradient-to-br from-[#1C4444] to-[#2d6a6a] border-2 border-white flex items-center justify-center text-white text-xs font-medium"
            >
              {String.fromCharCode(65 + i)}
            </div>
          ))}
        </div>
        <span className="text-[#1C4444]/70">
          <strong className="text-[#1C4444]">{usersToday}+</strong> people analyzed today
        </span>
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full text-sm">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-green-700">
          {usersToday} people are analyzing their skin right now
        </span>
      </div>
    )
  }

  // Banner variant
  return (
    <div className="bg-gradient-to-r from-[#1C4444] to-[#2d6a6a] text-white py-3 px-4 overflow-hidden">
      <div className="container mx-auto">
        <div className="flex items-center justify-between gap-4">
          {/* Live activity indicator */}
          <div
            className={`flex items-center gap-3 transition-all duration-500 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
            }`}
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-white/40 flex items-center justify-center text-xs font-medium">
                  {activity.name.split(' ')[0][0]}{activity.name.split(' ')[1][0]}
                </div>
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-[#1C4444]" />
            </div>
            <div className="text-sm">
              <span className="font-medium">{activity.name}</span>
              <span className="opacity-80"> {activity.action}</span>
              <span className="opacity-60 text-xs ml-2">({activity.location})</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm">
            <div className="hidden sm:flex items-center gap-2">
              <svg className="w-4 h-4 opacity-70" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
              </svg>
              <span>
                <strong>{usersToday}</strong> analyzed today
              </span>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <svg className="w-4 h-4 opacity-70" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
              </svg>
              <span>
                4.9/5 rating
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Recent purchases popup for product pages
export function RecentPurchasePopup() {
  const [isVisible, setIsVisible] = useState(false)
  const [purchase, setPurchase] = useState(ACTIVITIES[0])

  useEffect(() => {
    const showPopup = () => {
      const randomActivity = ACTIVITIES.filter(a => a.action.includes('purchased'))[
        Math.floor(Math.random() * 2)
      ]
      if (randomActivity) {
        setPurchase(randomActivity)
        setIsVisible(true)
        setTimeout(() => setIsVisible(false), 5000)
      }
    }

    const initialDelay = setTimeout(showPopup, 8000)
    const interval = setInterval(showPopup, 30000)

    return () => {
      clearTimeout(initialDelay)
      clearInterval(interval)
    }
  }, [])

  if (!isVisible) return null

  return (
    <div className="fixed bottom-20 left-4 z-50 animate-slide-up">
      <div className="bg-white rounded-lg shadow-xl p-4 max-w-xs border border-[#1C4444]/10">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1C4444] to-[#2d6a6a] flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
            {purchase.name.split(' ')[0][0]}{purchase.name.split(' ')[1][0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[#1C4444]">
              <strong>{purchase.name}</strong> from {purchase.location}
            </p>
            <p className="text-xs text-[#1C4444]/60">{purchase.action}</p>
            <p className="text-xs text-[#1C4444]/40 mt-1">Just now</p>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-[#1C4444]/40 hover:text-[#1C4444] flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
