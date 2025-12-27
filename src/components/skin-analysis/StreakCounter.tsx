'use client'

import { useEffect, useState } from 'react'

interface StreakCounterProps {
  currentStreak: number
  longestStreak: number
  lastAnalysisDate: string | null
  size?: 'sm' | 'md' | 'lg'
}

export default function StreakCounter({
  currentStreak,
  longestStreak,
  lastAnalysisDate,
  size = 'md',
}: StreakCounterProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [showFlame, setShowFlame] = useState(false)

  useEffect(() => {
    if (currentStreak > 0) {
      setIsAnimating(true)
      setShowFlame(true)
      const timer = setTimeout(() => setIsAnimating(false), 1000)
      return () => clearTimeout(timer)
    }
  }, [currentStreak])

  const sizeClasses = {
    sm: { container: 'p-3', number: 'text-2xl', label: 'text-xs' },
    md: { container: 'p-4', number: 'text-4xl', label: 'text-sm' },
    lg: { container: 'p-6', number: 'text-5xl', label: 'text-base' },
  }

  const config = sizeClasses[size]

  // Check if streak is at risk (no analysis today and had a streak)
  const isAtRisk = currentStreak > 0 && lastAnalysisDate &&
    new Date(lastAnalysisDate).toDateString() !== new Date().toDateString()

  return (
    <div className={`relative bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl ${config.container} text-white overflow-hidden`}>
      {/* Animated background flames */}
      {showFlame && currentStreak >= 3 && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -bottom-4 left-1/4 w-8 h-16 bg-yellow-400/30 rounded-full blur-xl animate-pulse" />
          <div className="absolute -bottom-4 right-1/4 w-6 h-12 bg-orange-400/30 rounded-full blur-xl animate-pulse delay-100" />
        </div>
      )}

      <div className="relative z-10 text-center">
        {/* Fire icon */}
        <div className={`inline-block mb-1 ${isAnimating ? 'animate-bounce' : ''}`}>
          <svg
            className={`w-8 h-8 mx-auto ${currentStreak >= 7 ? 'text-yellow-300' : 'text-white'}`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 23c-3.866 0-7-3.134-7-7 0-2.526 1.394-4.792 3.5-6.217-.056.366-.086.74-.086 1.122 0 2.126.813 4.065 2.143 5.52.274.3.664.41 1.024.29.36-.12.645-.42.748-.79.103-.37.042-.77-.16-1.09A5.965 5.965 0 0111 12c0-.878.188-1.715.526-2.469.341-.758.832-1.437 1.444-1.994.615.557 1.104 1.237 1.445 1.995.338.754.526 1.59.526 2.469 0 .987-.238 1.918-.661 2.739-.203.32-.264.72-.16 1.09.103.37.388.67.748.79.36.12.75.01 1.024-.29A7.945 7.945 0 0017 12c0-.382-.03-.756-.086-1.122C18.606 12.208 20 14.474 20 17c0 3.866-3.134 7-7 7z"/>
          </svg>
        </div>

        {/* Streak number */}
        <div className={`${config.number} font-bold leading-none ${isAnimating ? 'scale-110' : ''} transition-transform`}>
          {currentStreak}
        </div>

        {/* Label */}
        <div className={`${config.label} font-medium mt-1 opacity-90`}>
          {currentStreak === 1 ? 'Day Streak' : 'Day Streak'}
        </div>

        {/* Streak at risk warning */}
        {isAtRisk && (
          <div className="mt-2 px-2 py-1 bg-white/20 rounded-full text-xs animate-pulse">
            Analyze today to keep your streak!
          </div>
        )}

        {/* Milestone badges */}
        {currentStreak >= 7 && (
          <div className="mt-2 flex justify-center gap-1">
            {currentStreak >= 7 && (
              <span className="px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs rounded-full font-semibold">
                1 Week
              </span>
            )}
            {currentStreak >= 30 && (
              <span className="px-2 py-0.5 bg-purple-400 text-purple-900 text-xs rounded-full font-semibold">
                1 Month
              </span>
            )}
          </div>
        )}
      </div>

      {/* Best streak indicator */}
      {longestStreak > currentStreak && (
        <div className="absolute top-2 right-2 text-xs opacity-75">
          Best: {longestStreak}
        </div>
      )}
    </div>
  )
}

// Calculate streak from analysis dates
export function calculateStreak(analysisDates: string[]): { current: number; longest: number; lastDate: string | null } {
  if (analysisDates.length === 0) {
    return { current: 0, longest: 0, lastDate: null }
  }

  const sorted = [...analysisDates]
    .map(d => new Date(d).toDateString())
    .filter((v, i, a) => a.indexOf(v) === i) // Remove duplicates
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()

  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 0

  // Check if most recent is today or yesterday (streak still active)
  const mostRecent = sorted[0]
  const streakActive = mostRecent === today || mostRecent === yesterday

  for (let i = 0; i < sorted.length; i++) {
    const currentDate = new Date(sorted[i])
    const nextDate = i < sorted.length - 1 ? new Date(sorted[i + 1]) : null

    tempStreak++

    if (nextDate) {
      const diffDays = Math.floor((currentDate.getTime() - nextDate.getTime()) / 86400000)
      if (diffDays > 1) {
        // Streak broken
        if (i === 0 || (i > 0 && tempStreak > longestStreak)) {
          longestStreak = Math.max(longestStreak, tempStreak)
        }
        if (streakActive && currentStreak === 0) {
          currentStreak = tempStreak
        }
        tempStreak = 0
      }
    } else {
      // End of array
      longestStreak = Math.max(longestStreak, tempStreak)
      if (streakActive && currentStreak === 0) {
        currentStreak = tempStreak
      }
    }
  }

  return {
    current: streakActive ? currentStreak || tempStreak : 0,
    longest: longestStreak,
    lastDate: analysisDates[0] || null,
  }
}
