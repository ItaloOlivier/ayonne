'use client'

import { useState, useEffect, useRef } from 'react'

interface SpinSegment {
  id: number
  label: string
  discountPercent: number
  weight: number
  color: string
  isFreeShipping?: boolean
}

interface SpinWheelProps {
  analysisId: string
  onComplete?: (prize: { code: string; discountPercent: number; expiresAt: string }) => void
  onClose?: () => void
}

const SEGMENTS: SpinSegment[] = [
  { id: 1, label: '5% OFF', discountPercent: 5, weight: 40, color: '#1C4444' },
  { id: 2, label: '10% OFF', discountPercent: 10, weight: 30, color: '#2D5A5A' },
  { id: 3, label: '15% OFF', discountPercent: 15, weight: 18, color: '#D4AF37' },
  { id: 4, label: '20% OFF', discountPercent: 20, weight: 8, color: '#8B7355' },
  { id: 5, label: 'FREE SHIP', discountPercent: 0, weight: 4, color: '#A67C52', isFreeShipping: true },
]

export default function SpinWheel({ analysisId, onComplete, onClose }: SpinWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [prize, setPrize] = useState<{ code: string; discountPercent: number; expiresAt: string; label: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const wheelRef = useRef<HTMLDivElement>(null)

  const segmentAngle = 360 / SEGMENTS.length

  const spin = async () => {
    if (isSpinning) return

    setIsSpinning(true)
    setError(null)

    try {
      const response = await fetch('/api/spin/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisId }),
      })

      const data = await response.json()

      if (!data.success) {
        if (data.existingReward) {
          setPrize({
            code: data.existingReward.code,
            discountPercent: data.existingReward.discountPercent,
            expiresAt: data.existingReward.expiresAt,
            label: data.existingReward.discountPercent > 0
              ? `${data.existingReward.discountPercent}% OFF`
              : 'FREE SHIPPING',
          })
        } else {
          setError(data.error || 'Failed to spin')
        }
        setIsSpinning(false)
        return
      }

      // Calculate rotation to land on the winning segment
      const winningIndex = data.segmentIndex
      const segmentCenter = winningIndex * segmentAngle + segmentAngle / 2
      const spins = 5 // Number of full rotations
      const finalRotation = 360 * spins + (360 - segmentCenter + 90) // +90 to align with pointer at top

      setRotation(finalRotation)

      // Wait for animation to complete
      setTimeout(() => {
        setPrize({
          code: data.prize.code,
          discountPercent: data.prize.discountPercent,
          expiresAt: data.prize.expiresAt,
          label: data.prize.label,
        })
        setIsSpinning(false)

        if (onComplete) {
          onComplete({
            code: data.prize.code,
            discountPercent: data.prize.discountPercent,
            expiresAt: data.prize.expiresAt,
          })
        }
      }, 4000)
    } catch {
      setError('Failed to spin. Please try again.')
      setIsSpinning(false)
    }
  }

  const copyCode = async () => {
    if (!prize) return
    try {
      await navigator.clipboard.writeText(prize.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = prize.code
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const formatTimeRemaining = (expiresAt: string) => {
    const expires = new Date(expiresAt)
    const now = new Date()
    const diff = expires.getTime() - now.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative animate-bounce-in">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-[#1C4444] mb-2">
            {prize ? 'Congratulations!' : 'Spin to Win!'}
          </h2>
          <p className="text-gray-600">
            {prize
              ? 'Use your code at checkout'
              : 'Spin the wheel for an exclusive discount'}
          </p>
        </div>

        {!prize ? (
          <>
            {/* Wheel Container */}
            <div className="relative w-64 h-64 mx-auto mb-6">
              {/* Pointer */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
                <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-[#1C4444]" />
              </div>

              {/* Wheel */}
              <div
                ref={wheelRef}
                className="w-full h-full rounded-full relative overflow-hidden shadow-lg"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: isSpinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
                }}
              >
                {SEGMENTS.map((segment, index) => {
                  const startAngle = index * segmentAngle
                  return (
                    <div
                      key={segment.id}
                      className="absolute w-1/2 h-1/2 origin-bottom-right"
                      style={{
                        transform: `rotate(${startAngle}deg) skewY(${90 - segmentAngle}deg)`,
                        backgroundColor: segment.color,
                        top: 0,
                        left: '50%',
                        marginLeft: '-50%',
                      }}
                    >
                      <span
                        className="absolute text-white text-xs font-bold whitespace-nowrap"
                        style={{
                          transform: `skewY(${-(90 - segmentAngle)}deg) rotate(${segmentAngle / 2}deg)`,
                          top: '30%',
                          left: '50%',
                        }}
                      >
                        {segment.label}
                      </span>
                    </div>
                  )
                })}
                {/* Center circle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-md flex items-center justify-center">
                  <span className="text-[#1C4444] font-bold text-xs">SPIN</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-center mb-4 text-sm">{error}</div>
            )}

            <button
              onClick={spin}
              disabled={isSpinning}
              className={`w-full py-3 rounded-lg font-semibold transition-all ${
                isSpinning
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-[#D4AF37] text-white hover:bg-[#B8962F] animate-gentle-glow'
              }`}
            >
              {isSpinning ? 'Spinning...' : 'SPIN NOW'}
            </button>
          </>
        ) : (
          /* Prize Display */
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-[#D4AF37] to-[#B8962F] rounded-full flex items-center justify-center animate-bounce-in">
              <span className="text-white text-2xl font-bold">{prize.label}</span>
            </div>

            <div className="bg-gray-100 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-500 mb-1">Your discount code:</p>
              <div className="flex items-center justify-center gap-2">
                <code className="text-xl font-mono font-bold text-[#1C4444]">
                  {prize.code}
                </code>
                <button
                  onClick={copyCode}
                  className="p-2 hover:bg-gray-200 rounded transition-colors"
                  aria-label="Copy code"
                >
                  {copied ? (
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <p className="text-sm text-amber-600 mb-4">
              Expires in {formatTimeRemaining(prize.expiresAt)}
            </p>

            <button
              onClick={onClose}
              className="w-full py-3 bg-[#1C4444] text-white rounded-lg font-semibold hover:bg-[#2D5A5A] transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
