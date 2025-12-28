'use client'

import { useState, useEffect } from 'react'

interface DiscountInfo {
  code: string
  discountPercent: number
  type: string
  typeLabel: string
  expiresIn?: number
}

interface DiscountBadgeProps {
  discount?: DiscountInfo
  showCode?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function DiscountBadge({
  discount,
  showCode = false,
  size = 'md',
}: DiscountBadgeProps) {
  const [bestDiscount, setBestDiscount] = useState<DiscountInfo | null>(discount || null)
  const [loading, setLoading] = useState(!discount)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!discount) {
      fetchBestDiscount()
    }
  }, [discount])

  const fetchBestDiscount = async () => {
    try {
      const response = await fetch('/api/discount/my-codes')
      const data = await response.json()

      if (data.success && data.bestDiscount) {
        setBestDiscount(data.bestDiscount)
      }
    } catch {
      // Silently fail - badge just won't show
    } finally {
      setLoading(false)
    }
  }

  const copyCode = async () => {
    if (!bestDiscount) return
    try {
      await navigator.clipboard.writeText(bestDiscount.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const textArea = document.createElement('textarea')
      textArea.value = bestDiscount.code
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading || !bestDiscount) {
    return null
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  }

  if (showCode) {
    return (
      <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#D4AF37] to-[#B8962F] text-white rounded-full shadow-sm">
        <span className={`font-semibold ${sizeClasses[size]}`}>
          {bestDiscount.discountPercent}% OFF
        </span>
        <code className="bg-white/20 px-2 py-1 rounded font-mono text-sm">
          {bestDiscount.code}
        </code>
        <button
          onClick={copyCode}
          className="pr-3 hover:text-white/80 transition-colors"
          aria-label="Copy discount code"
        >
          {copied ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
      </div>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1 bg-[#D4AF37] text-white rounded-full font-semibold animate-gentle-glow ${sizeClasses[size]}`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
      {bestDiscount.discountPercent}% OFF Available
    </span>
  )
}
