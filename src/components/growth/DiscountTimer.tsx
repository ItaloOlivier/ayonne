'use client'

import { useState, useEffect } from 'react'

interface DiscountTimerProps {
  expiresAt: Date | string
  discountPercent: number
  discountCode: string
  onExpired?: () => void
  compact?: boolean
}

export default function DiscountTimer({
  expiresAt,
  discountPercent,
  discountCode,
  onExpired,
  compact = false,
}: DiscountTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number
    minutes: number
    seconds: number
    expired: boolean
  }>({ hours: 0, minutes: 0, seconds: 0, expired: false })
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const expires = new Date(expiresAt)
      const now = new Date()
      const diff = expires.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, expired: true })
        onExpired?.()
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeLeft({ hours, minutes, seconds, expired: false })
    }

    calculateTimeLeft()
    const interval = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(interval)
  }, [expiresAt, onExpired])

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(discountCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const textArea = document.createElement('textarea')
      textArea.value = discountCode
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (timeLeft.expired) {
    return null
  }

  const isUrgent = timeLeft.hours < 1

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
          isUrgent
            ? 'bg-red-100 text-red-700 animate-pulse'
            : 'bg-amber-100 text-amber-700'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>
          {discountPercent}% off expires in{' '}
          {timeLeft.hours > 0 ? `${timeLeft.hours}h ` : ''}
          {timeLeft.minutes}m {timeLeft.seconds}s
        </span>
      </div>
    )
  }

  return (
    <div
      className={`rounded-xl p-4 ${
        isUrgent
          ? 'bg-gradient-to-r from-red-500 to-orange-500 animate-pulse'
          : 'bg-gradient-to-r from-[#D4AF37] to-[#B8962F]'
      }`}
    >
      <div className="flex items-center justify-between text-white">
        <div>
          <p className="text-sm opacity-90">Your exclusive discount</p>
          <p className="text-2xl font-bold">{discountPercent}% OFF</p>
        </div>
        <div className="text-right">
          <p className="text-sm opacity-90">Expires in</p>
          <div className="flex items-center gap-1 text-xl font-mono font-bold">
            <span className="bg-white/20 px-2 py-1 rounded">
              {String(timeLeft.hours).padStart(2, '0')}
            </span>
            <span>:</span>
            <span className="bg-white/20 px-2 py-1 rounded">
              {String(timeLeft.minutes).padStart(2, '0')}
            </span>
            <span>:</span>
            <span className="bg-white/20 px-2 py-1 rounded">
              {String(timeLeft.seconds).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="flex-1 bg-white/20 rounded-lg px-3 py-2 font-mono text-white text-center">
          {discountCode}
        </div>
        <button
          onClick={copyCode}
          className="px-4 py-2 bg-white text-[#1C4444] rounded-lg font-semibold hover:bg-gray-100 transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {isUrgent && (
        <p className="mt-2 text-center text-white/90 text-sm animate-bounce">
          Hurry! Less than 1 hour remaining!
        </p>
      )}
    </div>
  )
}
