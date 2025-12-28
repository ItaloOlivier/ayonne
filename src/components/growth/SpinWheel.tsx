'use client'

import { useState, useRef } from 'react'

interface SpinSegment {
  id: number
  label: string
  discountPercent: number
  weight: number
  color: string
  textColor: string
  isFreeShipping?: boolean
}

interface SpinWheelProps {
  analysisId: string
  onComplete?: (prize: { code: string; discountPercent: number; expiresAt: string }) => void
  onClose?: () => void
}

// Segments with proportional weights (total = 100)
// Weights determine the angle of each segment
// Guaranteed minimum 10% - no disappointing 5% prizes
const SEGMENTS: SpinSegment[] = [
  { id: 1, label: '10%', discountPercent: 10, weight: 45, color: '#1C4444', textColor: '#FFFFFF' },
  { id: 2, label: '15%', discountPercent: 15, weight: 30, color: '#2D5A5A', textColor: '#FFFFFF' },
  { id: 3, label: '20%', discountPercent: 20, weight: 15, color: '#D4AF37', textColor: '#1C4444' },
  { id: 4, label: '25%', discountPercent: 25, weight: 7, color: '#B8962F', textColor: '#FFFFFF' },
  { id: 5, label: 'FREE', discountPercent: 0, weight: 3, color: '#8B6914', textColor: '#FFFFFF', isFreeShipping: true },
]

// Calculate total weight for proportional sizing
const TOTAL_WEIGHT = SEGMENTS.reduce((sum, s) => sum + s.weight, 0)

// Calculate cumulative angles for each segment
const getSegmentAngles = () => {
  let cumulative = 0
  return SEGMENTS.map((segment) => {
    const startAngle = cumulative
    const angle = (segment.weight / TOTAL_WEIGHT) * 360
    cumulative += angle
    return { ...segment, startAngle, angle }
  })
}

const segmentsWithAngles = getSegmentAngles()

// SVG path for a pie segment
const describeArc = (
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number
) => {
  const start = polarToCartesian(cx, cy, radius, endAngle)
  const end = polarToCartesian(cx, cy, radius, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'
  return [
    'M', cx, cy,
    'L', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    'Z'
  ].join(' ')
}

const polarToCartesian = (cx: number, cy: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians)
  }
}

// Get label position for each segment
const getLabelPosition = (cx: number, cy: number, radius: number, startAngle: number, angle: number) => {
  const midAngle = startAngle + angle / 2
  const labelRadius = radius * 0.65
  return polarToCartesian(cx, cy, labelRadius, midAngle)
}

export default function SpinWheel({ analysisId, onComplete, onClose }: SpinWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [prize, setPrize] = useState<{ code: string; discountPercent: number; expiresAt: string; label: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const wheelRef = useRef<SVGSVGElement>(null)

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

      // Find the winning segment by index
      const winningIndex = data.segmentIndex
      const winningSegment = segmentsWithAngles[winningIndex]

      // Calculate rotation to land on the center of the winning segment
      const segmentCenter = winningSegment.startAngle + winningSegment.angle / 2
      const spins = 4 // Reduced from 6 for faster reveal
      const finalRotation = 360 * spins + (360 - segmentCenter)

      setRotation(finalRotation)

      // Wait for animation to complete (reduced from 5000ms to 3000ms)
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
      }, 3000)
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

  const wheelSize = 280
  const center = wheelSize / 2
  const radius = wheelSize / 2 - 8

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-[#F4EBE7] to-white rounded-3xl max-w-md w-full p-8 relative shadow-2xl animate-bounce-in">
        {/* Decorative corner accents */}
        <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-[#D4AF37]/30 rounded-tl-lg" />
        <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-[#D4AF37]/30 rounded-tr-lg" />
        <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-[#D4AF37]/30 rounded-bl-lg" />
        <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-[#D4AF37]/30 rounded-br-lg" />

        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center text-[#1C4444]/40 hover:text-[#1C4444] transition-colors z-10"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        <div className="text-center mb-6">
          <p className="text-[#9A8428] text-xs tracking-[0.2em] uppercase mb-2">Member Exclusive</p>
          <h2 className="text-2xl font-light text-[#1C4444] tracking-wide">
            {prize ? 'Your Offer is Ready' : 'Reveal Your Offer'}
          </h2>
          <p className="text-[#1C4444]/60 text-sm mt-2">
            {prize
              ? 'Your exclusive discount awaits'
              : 'Unlock your personalized savings'}
          </p>
        </div>

        {!prize ? (
          <>
            {/* Wheel Container */}
            <div className="relative mx-auto mb-8" style={{ width: wheelSize, height: wheelSize }}>
              {/* Outer ring - luxurious gold border */}
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #F4D03F 25%, #D4AF37 50%, #B8962F 75%, #D4AF37 100%)',
                  padding: 6,
                }}
              >
                <div className="w-full h-full rounded-full bg-[#F4EBE7]" />
              </div>

              {/* Pointer - elegant gold triangle */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20" style={{ marginTop: -2 }}>
                <div className="relative">
                  <svg width="32" height="40" viewBox="0 0 32 40">
                    <defs>
                      <linearGradient id="pointerGold" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#F4D03F" />
                        <stop offset="50%" stopColor="#D4AF37" />
                        <stop offset="100%" stopColor="#B8962F" />
                      </linearGradient>
                      <filter id="pointerShadow" x="-50%" y="-50%" width="200%" height="200%">
                        <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.3"/>
                      </filter>
                    </defs>
                    <path
                      d="M16 38 L4 8 Q16 12 28 8 Z"
                      fill="url(#pointerGold)"
                      filter="url(#pointerShadow)"
                    />
                    <circle cx="16" cy="10" r="4" fill="#1C4444" />
                  </svg>
                </div>
              </div>

              {/* SVG Wheel */}
              <svg
                ref={wheelRef}
                width={wheelSize}
                height={wheelSize}
                className="absolute inset-0"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: isSpinning
                    ? 'transform 3s cubic-bezier(0.17, 0.67, 0.05, 0.99)'
                    : 'none',
                }}
              >
                <defs>
                  {/* Shadow filter for depth */}
                  <filter id="wheelShadow" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.15"/>
                  </filter>
                  {/* Inner shadow for segments */}
                  <filter id="segmentInner" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.2"/>
                  </filter>
                </defs>

                {/* Wheel background circle */}
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="#1C4444"
                  filter="url(#wheelShadow)"
                />

                {/* Segments */}
                <g>
                  {segmentsWithAngles.map((segment) => {
                    const endAngle = segment.startAngle + segment.angle
                    const labelPos = getLabelPosition(center, center, radius, segment.startAngle, segment.angle)
                    const labelRotation = segment.startAngle + segment.angle / 2

                    return (
                      <g key={segment.id}>
                        {/* Segment path */}
                        <path
                          d={describeArc(center, center, radius - 2, segment.startAngle, endAngle)}
                          fill={segment.color}
                          stroke="#F4EBE7"
                          strokeWidth="1"
                          filter="url(#segmentInner)"
                        />

                        {/* Segment label */}
                        <text
                          x={labelPos.x}
                          y={labelPos.y}
                          fill={segment.textColor}
                          fontSize={segment.angle > 30 ? "14" : "11"}
                          fontWeight="600"
                          fontFamily="IBM Plex Sans, sans-serif"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          style={{
                            transform: `rotate(${labelRotation}deg)`,
                            transformOrigin: `${labelPos.x}px ${labelPos.y}px`,
                            letterSpacing: '0.05em',
                          }}
                        >
                          {segment.label}
                        </text>

                        {/* Sub-label for context */}
                        {segment.angle > 25 && (
                          <text
                            x={labelPos.x}
                            y={labelPos.y + 14}
                            fill={segment.textColor}
                            fontSize="8"
                            fontFamily="IBM Plex Sans, sans-serif"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            opacity="0.8"
                            style={{
                              transform: `rotate(${labelRotation}deg)`,
                              transformOrigin: `${labelPos.x}px ${labelPos.y + 14}px`,
                              letterSpacing: '0.1em',
                              textTransform: 'uppercase',
                            }}
                          >
                            {segment.isFreeShipping ? 'SHIP' : 'OFF'}
                          </text>
                        )}
                      </g>
                    )
                  })}
                </g>

                {/* Center hub - luxurious gold */}
                <defs>
                  <linearGradient id="centerGold" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F4D03F" />
                    <stop offset="30%" stopColor="#D4AF37" />
                    <stop offset="70%" stopColor="#B8962F" />
                    <stop offset="100%" stopColor="#D4AF37" />
                  </linearGradient>
                  <radialGradient id="centerHighlight" cx="30%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Outer hub ring */}
                <circle
                  cx={center}
                  cy={center}
                  r="36"
                  fill="url(#centerGold)"
                  stroke="#B8962F"
                  strokeWidth="1"
                />

                {/* Inner hub */}
                <circle
                  cx={center}
                  cy={center}
                  r="28"
                  fill="#1C4444"
                />

                {/* Hub highlight */}
                <circle
                  cx={center}
                  cy={center}
                  r="28"
                  fill="url(#centerHighlight)"
                />

                {/* Hub text */}
                <text
                  x={center}
                  y={center - 4}
                  fill="#D4AF37"
                  fontSize="9"
                  fontFamily="IBM Plex Sans, sans-serif"
                  fontWeight="500"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  letterSpacing="0.15em"
                >
                  AYONNE
                </text>
                <text
                  x={center}
                  y={center + 8}
                  fill="#FFFFFF"
                  fontSize="7"
                  fontFamily="IBM Plex Sans, sans-serif"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  letterSpacing="0.1em"
                  opacity="0.7"
                >
                  REWARDS
                </text>
              </svg>

              {/* Tick marks around the wheel */}
              <div className="absolute inset-0 rounded-full pointer-events-none">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-0.5 h-2 bg-[#D4AF37]/40"
                    style={{
                      top: 2,
                      left: '50%',
                      marginLeft: -1,
                      transformOrigin: `50% ${wheelSize / 2 - 2}px`,
                      transform: `rotate(${i * 15}deg)`,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Legend removed - hiding probabilities for better UX */}

            {error && (
              <div className="text-red-600 text-center mb-4 text-sm bg-red-50 py-2 px-4 rounded-lg">
                {error}
              </div>
            )}

            <button
              onClick={spin}
              disabled={isSpinning}
              className={`w-full py-4 rounded-xl font-medium tracking-wider uppercase text-sm transition-all ${
                isSpinning
                  ? 'bg-[#1C4444]/20 text-[#1C4444]/40 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#D4AF37] via-[#F4D03F] to-[#D4AF37] text-[#1C4444] hover:shadow-lg hover:shadow-[#D4AF37]/30 active:scale-[0.98]'
              }`}
              style={{
                backgroundSize: isSpinning ? '100%' : '200%',
                animation: isSpinning ? 'none' : 'shimmer 3s linear infinite',
              }}
            >
              {isSpinning ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Revealing...
                </span>
              ) : (
                'Reveal My Offer'
              )}
            </button>

            <p className="text-center text-xs text-[#1C4444]/40 mt-4">
              One spin per analysis • 24h validity
            </p>
          </>
        ) : (
          /* Prize Display */
          <div className="text-center">
            {/* Accessibility: Screen reader announcement */}
            <div
              role="status"
              aria-live="polite"
              className="sr-only"
            >
              Congratulations! You won {prize.discountPercent > 0
                ? `${prize.discountPercent} percent off`
                : 'free shipping'}.
              Your code is {prize.code}.
            </div>

            {/* Prize badge */}
            <div className="relative w-32 h-32 mx-auto mb-6">
              {/* Glowing ring */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] animate-pulse opacity-30" />

              {/* Main badge */}
              <div className="absolute inset-2 rounded-full bg-gradient-to-br from-[#D4AF37] via-[#F4D03F] to-[#B8962F] flex items-center justify-center shadow-lg">
                <div className="text-center">
                  <span className="text-[#1C4444] text-3xl font-light block">
                    {prize.discountPercent > 0 ? `${prize.discountPercent}%` : 'FREE'}
                  </span>
                  <span className="text-[#1C4444]/70 text-xs tracking-wider uppercase">
                    {prize.discountPercent > 0 ? 'off' : 'shipping'}
                  </span>
                </div>
              </div>

              {/* Sparkles */}
              <div className="absolute -top-1 -right-1 text-[#D4AF37] animate-pulse">✦</div>
              <div className="absolute -bottom-1 -left-1 text-[#D4AF37] animate-pulse delay-100">✦</div>
            </div>

            <div className="bg-[#1C4444]/5 rounded-2xl p-5 mb-5">
              <p className="text-xs text-[#1C4444]/50 uppercase tracking-wider mb-2">Your Discount Code</p>
              <div className="flex items-center justify-center gap-3">
                <code className="text-2xl font-mono font-semibold text-[#1C4444] tracking-wider">
                  {prize.code}
                </code>
                <button
                  onClick={copyCode}
                  className="p-2.5 bg-white hover:bg-[#D4AF37]/10 rounded-lg transition-colors border border-[#1C4444]/10"
                  aria-label="Copy code"
                >
                  {copied ? (
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-[#1C4444]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
              {copied && (
                <p className="text-green-600 text-xs mt-2">Copied to clipboard!</p>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-[#D4AF37] mb-6">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Expires in {formatTimeRemaining(prize.expiresAt)}</span>
            </div>

            <button
              onClick={onClose}
              className="w-full py-4 bg-[#1C4444] text-white rounded-xl font-medium tracking-wider uppercase text-sm hover:bg-[#2D5A5A] transition-all active:scale-[0.98]"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>

      {/* Add shimmer animation */}
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>
    </div>
  )
}
