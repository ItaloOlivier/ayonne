'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface TransformationRevealProps {
  baselineImage: string
  finalImage: string
  baselineHealthScore: number
  finalHealthScore: number
  baselineSkinAge: number
  finalSkinAge: number
  completionRewardCode: string
  onShare: () => void
  onClose: () => void
  shareRewardEarned?: boolean
  shareRewardCode?: string
}

export default function TransformationReveal({
  baselineImage,
  finalImage,
  baselineHealthScore,
  finalHealthScore,
  baselineSkinAge,
  finalSkinAge,
  completionRewardCode,
  onShare,
  onClose,
  shareRewardEarned,
  shareRewardCode,
}: TransformationRevealProps) {
  const [revealed, setRevealed] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [copied, setCopied] = useState(false)
  const [sliderPosition, setSliderPosition] = useState(50)

  const healthImprovement = finalHealthScore - baselineHealthScore
  const ageImprovement = baselineSkinAge - finalSkinAge

  useEffect(() => {
    // Start reveal animation after mount
    const timer = setTimeout(() => {
      setRevealed(true)
      setTimeout(() => setShowConfetti(true), 500)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const textArea = document.createElement('textarea')
      textArea.value = code
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 overflow-y-auto">
      {/* Confetti effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-20px',
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              <div
                className="w-3 h-3 rounded-sm"
                style={{
                  backgroundColor: ['#D4AF37', '#1C4444', '#E5C048', '#2D5A5A', '#F4EBE7'][
                    Math.floor(Math.random() * 5)
                  ],
                  transform: `rotate(${Math.random() * 360}deg)`,
                }}
              />
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-[#1C4444]/40 hover:text-[#1C4444] transition-colors z-10 bg-white rounded-full shadow-md"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="bg-gradient-to-br from-[#D4AF37] via-[#E5C048] to-[#D4AF37] p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/sparkle-pattern.png')] opacity-10" />

          <div className="relative">
            <div className="text-[#1C4444]/60 text-xs tracking-[0.3em] uppercase mb-2">
              Challenge Complete
            </div>
            <h1 className="text-3xl font-light text-[#1C4444] mb-2">
              Your Transformation
            </h1>
            <p className="text-[#1C4444]/70">
              30 days of dedication. Real results.
            </p>
          </div>
        </div>

        <div className="p-8">
          {/* Before/After comparison slider */}
          <div className="mb-8">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#1C4444]/5">
              {/* Final image (underneath) */}
              <div className="absolute inset-0">
                <Image
                  src={finalImage}
                  alt="Day 30 - After"
                  fill
                  className="object-cover"
                />
                <div className="absolute bottom-4 right-4 bg-[#D4AF37] text-[#1C4444] px-3 py-1 rounded-full text-sm font-medium">
                  Day 30
                </div>
              </div>

              {/* Baseline image (on top, clipped) */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${sliderPosition}%` }}
              >
                <div className="relative w-full h-full" style={{ width: `${100 / (sliderPosition / 100)}%` }}>
                  <Image
                    src={baselineImage}
                    alt="Day 1 - Before"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="absolute bottom-4 left-4 bg-[#1C4444] text-white px-3 py-1 rounded-full text-sm font-medium">
                  Day 1
                </div>
              </div>

              {/* Slider handle */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
                style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#1C4444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                  </svg>
                </div>
              </div>

              {/* Slider input (invisible, for interaction) */}
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPosition}
                onChange={(e) => setSliderPosition(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
                aria-label="Comparison slider"
              />
            </div>
            <p className="text-center text-sm text-[#1C4444]/50 mt-2">
              Drag to compare before & after
            </p>
          </div>

          {/* Stats improvement */}
          <div
            className={`grid grid-cols-2 gap-4 mb-8 transition-all duration-1000 ${
              revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="bg-gradient-to-br from-[#1C4444] to-[#2D5A5A] rounded-2xl p-6 text-white text-center">
              <div className="text-4xl font-light mb-1">
                {healthImprovement > 0 ? '+' : ''}{healthImprovement}
              </div>
              <div className="text-white/70 text-sm">Health Score</div>
              <div className="flex items-center justify-center gap-2 mt-2 text-xs">
                <span className="text-white/50">{baselineHealthScore}</span>
                <svg className="w-4 h-4 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <span className="text-[#D4AF37] font-medium">{finalHealthScore}</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#D4AF37] to-[#B8962F] rounded-2xl p-6 text-[#1C4444] text-center">
              <div className="text-4xl font-light mb-1">
                {ageImprovement > 0 ? '-' : '+'}{Math.abs(ageImprovement)} yrs
              </div>
              <div className="text-[#1C4444]/70 text-sm">Skin Age</div>
              <div className="flex items-center justify-center gap-2 mt-2 text-xs">
                <span className="text-[#1C4444]/50">{baselineSkinAge}</span>
                <svg className="w-4 h-4 text-[#1C4444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <span className="text-[#1C4444] font-medium">{finalSkinAge}</span>
              </div>
            </div>
          </div>

          {/* Badge earned */}
          <div
            className={`bg-[#F4EBE7] rounded-2xl p-6 text-center mb-6 transition-all duration-1000 delay-300 ${
              revealed ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
            }`}
          >
            <div className="w-20 h-20 bg-gradient-to-br from-[#D4AF37] to-[#B8962F] rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
              <span className="text-4xl">✨</span>
            </div>
            <h3 className="text-lg font-medium text-[#1C4444] mb-1">Glow Master</h3>
            <p className="text-sm text-[#1C4444]/60">
              You completed the 30-Day Glow Challenge!
            </p>
          </div>

          {/* Reward codes */}
          <div className="space-y-3 mb-6">
            {/* Completion reward */}
            <div className="bg-[#1C4444]/5 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#1C4444]">25% Off Reward</p>
                  <p className="text-xs text-[#1C4444]/60">Your completion bonus</p>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-[#D4AF37] font-mono font-medium">
                    {completionRewardCode}
                  </code>
                  <button
                    onClick={() => copyCode(completionRewardCode)}
                    className="p-2 hover:bg-[#1C4444]/10 rounded-lg transition-colors"
                    aria-label="Copy code"
                  >
                    {copied ? (
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-[#1C4444]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Share reward */}
            {shareRewardEarned && shareRewardCode ? (
              <div className="bg-[#D4AF37]/10 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#1C4444]">+10% Share Bonus</p>
                    <p className="text-xs text-[#1C4444]/60">Thanks for sharing!</p>
                  </div>
                  <code className="text-[#D4AF37] font-mono font-medium">
                    {shareRewardCode}
                  </code>
                </div>
              </div>
            ) : (
              <button
                onClick={onShare}
                className="w-full bg-gradient-to-r from-[#1C4444] to-[#2D5A5A] text-white py-4 rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-3"
              >
                <span>Share Your Transformation</span>
                <span className="bg-white/20 text-xs px-2 py-1 rounded-full">+10% off</span>
              </button>
            )}
          </div>

          {/* Referral CTA */}
          <div className="bg-gradient-to-r from-[#F4EBE7] to-[#FFF9F5] rounded-xl p-4 border border-[#D4AF37]/20">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xl">🎁</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#1C4444] mb-1">
                  Invite a friend to the challenge
                </p>
                <p className="text-xs text-[#1C4444]/60 mb-2">
                  They get 10% off, you get a free product sample!
                </p>
                <button className="text-xs text-[#D4AF37] font-medium hover:underline">
                  Get Referral Link →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
