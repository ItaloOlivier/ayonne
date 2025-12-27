'use client'

import { useEffect, useState } from 'react'

interface ScarcityIndicatorProps {
  productName: string
  stockLevel?: 'low' | 'medium' | 'high'
  className?: string
}

export default function ScarcityIndicator({
  productName,
  stockLevel = 'low',
  className = ''
}: ScarcityIndicatorProps) {
  const [viewerCount, setViewerCount] = useState(0)

  useEffect(() => {
    // Simulate fluctuating viewer count
    const baseCount = stockLevel === 'low' ? 8 : stockLevel === 'medium' ? 5 : 3
    setViewerCount(baseCount + Math.floor(Math.random() * 5))

    const interval = setInterval(() => {
      setViewerCount(prev => {
        const change = Math.random() > 0.5 ? 1 : -1
        return Math.max(2, Math.min(15, prev + change))
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [stockLevel])

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Stock warning */}
      {stockLevel === 'low' && (
        <div className="flex items-center gap-2 text-amber-600 text-sm animate-pulse">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">Only a few left in stock!</span>
        </div>
      )}

      {/* Viewer count */}
      <div className="flex items-center gap-2 text-[#1C4444]/60 text-sm">
        <div className="relative flex items-center">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <div className="absolute w-2 h-2 bg-red-500 rounded-full animate-ping" />
        </div>
        <span>
          <strong className="text-[#1C4444]">{viewerCount}</strong> people viewing this now
        </span>
      </div>

      {/* Recent purchases */}
      <div className="flex items-center gap-2 text-[#1C4444]/60 text-xs">
        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span>12 purchased in the last 24 hours</span>
      </div>
    </div>
  )
}

// Countdown timer for limited offers
interface CountdownTimerProps {
  endTime: Date
  label?: string
  onExpire?: () => void
}

export function CountdownTimer({ endTime, label = 'Offer ends in', onExpire }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 })
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime()
      const distance = endTime.getTime() - now

      if (distance < 0) {
        setExpired(true)
        onExpire?.()
        return
      }

      setTimeLeft({
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      })
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [endTime, onExpire])

  if (expired) return null

  return (
    <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-2 rounded-lg">
      <div className="flex items-center justify-center gap-3 text-center">
        <span className="text-sm font-medium">{label}</span>
        <div className="flex items-center gap-1">
          <TimeUnit value={timeLeft.hours} label="h" />
          <span className="text-lg font-bold">:</span>
          <TimeUnit value={timeLeft.minutes} label="m" />
          <span className="text-lg font-bold">:</span>
          <TimeUnit value={timeLeft.seconds} label="s" />
        </div>
      </div>
    </div>
  )
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-xl font-bold tabular-nums">{value.toString().padStart(2, '0')}</span>
      <span className="text-xs opacity-80">{label}</span>
    </div>
  )
}

// Flash sale banner
interface FlashSaleBannerProps {
  discountPercent: number
  productCount?: number
}

export function FlashSaleBanner({ discountPercent, productCount = 3 }: FlashSaleBannerProps) {
  // Set end time to end of day
  const endTime = new Date()
  endTime.setHours(23, 59, 59, 999)

  return (
    <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 text-white rounded-xl p-4 overflow-hidden relative">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-20 h-20 bg-white rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-yellow-300 rounded-full blur-3xl animate-pulse delay-150" />
      </div>

      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
            <span className="animate-bounce text-2xl">⚡</span>
            <h3 className="text-lg font-bold">FLASH SALE</h3>
          </div>
          <p className="text-sm opacity-90">
            Get <strong>{discountPercent}% OFF</strong> on {productCount} recommended products
          </p>
        </div>
        <CountdownTimer endTime={endTime} label="Ends in" />
      </div>
    </div>
  )
}

// Limited stock progress bar
interface StockProgressProps {
  soldPercent: number
  totalStock?: number
}

export function StockProgress({ soldPercent, totalStock = 100 }: StockProgressProps) {
  const remaining = Math.round((100 - soldPercent) * totalStock / 100)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-[#1C4444]/60">Stock status</span>
        <span className={`font-medium ${soldPercent > 80 ? 'text-red-600' : 'text-[#1C4444]'}`}>
          {remaining} left
        </span>
      </div>
      <div className="h-2 bg-[#1C4444]/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            soldPercent > 80 ? 'bg-red-500' : soldPercent > 50 ? 'bg-amber-500' : 'bg-green-500'
          }`}
          style={{ width: `${soldPercent}%` }}
        />
      </div>
      {soldPercent > 70 && (
        <p className="text-xs text-red-600 animate-pulse">
          Selling fast! Don&apos;t miss out.
        </p>
      )}
    </div>
  )
}
