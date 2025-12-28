'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface DataExpiryWarningProps {
  createdAt: string
  isGuest: boolean
}

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000

export default function DataExpiryWarning({ createdAt, isGuest }: DataExpiryWarningProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
  } | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!isGuest || dismissed) return

    // Check if user dismissed this warning in this session
    const dismissedKey = `ayonne_expiry_dismissed_${createdAt}`
    if (sessionStorage.getItem(dismissedKey)) {
      setDismissed(true)
      return
    }

    const calculateTimeLeft = () => {
      const created = new Date(createdAt).getTime()
      const expiryTime = created + TWO_WEEKS_MS
      const now = Date.now()
      const remaining = expiryTime - now

      if (remaining <= 0) {
        return { days: 0, hours: 0, minutes: 0 }
      }

      const days = Math.floor(remaining / (24 * 60 * 60 * 1000))
      const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
      const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000))

      return { days, hours, minutes }
    }

    setTimeLeft(calculateTimeLeft())

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [createdAt, isGuest, dismissed])

  const handleDismiss = () => {
    const dismissedKey = `ayonne_expiry_dismissed_${createdAt}`
    sessionStorage.setItem(dismissedKey, 'true')
    setDismissed(true)
  }

  // Don't show for registered users or if dismissed
  if (!isGuest || dismissed || !timeLeft) return null

  // Calculate urgency level
  const isUrgent = timeLeft.days < 3
  const isCritical = timeLeft.days < 1

  return (
    <div className={`relative overflow-hidden rounded-xl border ${
      isCritical
        ? 'bg-gradient-to-r from-red-50 to-red-100/50 border-red-200'
        : isUrgent
        ? 'bg-gradient-to-r from-amber-50 to-amber-100/50 border-amber-200'
        : 'bg-gradient-to-r from-[#F4EBE7] to-white border-[#D4AF37]/20'
    }`}>
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-[#1C4444]/40 hover:text-[#1C4444] transition-colors z-10"
        aria-label="Dismiss warning"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
            isCritical
              ? 'bg-red-100'
              : isUrgent
              ? 'bg-amber-100'
              : 'bg-[#D4AF37]/10'
          }`}>
            <svg
              className={`w-6 h-6 ${
                isCritical
                  ? 'text-red-600'
                  : isUrgent
                  ? 'text-amber-600'
                  : 'text-[#D4AF37]'
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pr-6">
            <h3 className={`font-medium text-sm ${
              isCritical ? 'text-red-700' : isUrgent ? 'text-amber-700' : 'text-[#1C4444]'
            }`}>
              {isCritical
                ? 'Your analysis will be deleted soon!'
                : isUrgent
                ? 'Your analysis is expiring soon'
                : 'Save your skin analysis'
              }
            </h3>

            <p className={`text-xs mt-1 ${
              isCritical ? 'text-red-600/70' : isUrgent ? 'text-amber-600/70' : 'text-[#1C4444]/60'
            }`}>
              Guest data is automatically deleted after 2 weeks. Create a free account to keep your results forever.
            </p>

            {/* Countdown */}
            <div className="flex items-center gap-3 mt-3">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${
                isCritical
                  ? 'bg-red-100'
                  : isUrgent
                  ? 'bg-amber-100'
                  : 'bg-[#1C4444]/5'
              }`}>
                <span className={`text-lg font-bold tabular-nums ${
                  isCritical ? 'text-red-700' : isUrgent ? 'text-amber-700' : 'text-[#1C4444]'
                }`}>
                  {timeLeft.days}
                </span>
                <span className={`text-xs ${
                  isCritical ? 'text-red-600/70' : isUrgent ? 'text-amber-600/70' : 'text-[#1C4444]/50'
                }`}>
                  days
                </span>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${
                isCritical
                  ? 'bg-red-100'
                  : isUrgent
                  ? 'bg-amber-100'
                  : 'bg-[#1C4444]/5'
              }`}>
                <span className={`text-lg font-bold tabular-nums ${
                  isCritical ? 'text-red-700' : isUrgent ? 'text-amber-700' : 'text-[#1C4444]'
                }`}>
                  {timeLeft.hours}
                </span>
                <span className={`text-xs ${
                  isCritical ? 'text-red-600/70' : isUrgent ? 'text-amber-600/70' : 'text-[#1C4444]/50'
                }`}>
                  hrs
                </span>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${
                isCritical
                  ? 'bg-red-100'
                  : isUrgent
                  ? 'bg-amber-100'
                  : 'bg-[#1C4444]/5'
              }`}>
                <span className={`text-lg font-bold tabular-nums ${
                  isCritical ? 'text-red-700' : isUrgent ? 'text-amber-700' : 'text-[#1C4444]'
                }`}>
                  {timeLeft.minutes}
                </span>
                <span className={`text-xs ${
                  isCritical ? 'text-red-600/70' : isUrgent ? 'text-amber-600/70' : 'text-[#1C4444]/50'
                }`}>
                  min
                </span>
              </div>
              <span className={`text-xs ${
                isCritical ? 'text-red-600/60' : isUrgent ? 'text-amber-600/60' : 'text-[#1C4444]/40'
              }`}>
                remaining
              </span>
            </div>

            {/* CTA Button */}
            <div className="mt-4">
              <Link
                href="/login?register=true"
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isCritical
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : isUrgent
                    ? 'bg-amber-600 text-white hover:bg-amber-700'
                    : 'bg-[#1C4444] text-white hover:bg-[#2D5A5A]'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Create Free Account
              </Link>
              <p className="text-xs text-[#1C4444]/40 mt-2">
                Keep your analysis forever + track your progress over time
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Animated urgency indicator for critical */}
      {isCritical && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-400 via-red-500 to-red-400 animate-pulse" />
      )}
    </div>
  )
}
