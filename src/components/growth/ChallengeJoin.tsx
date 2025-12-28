'use client'

import { useState } from 'react'

interface ChallengeJoinProps {
  analysisId: string
  onSuccess?: () => void
  onClose?: () => void
}

const CHALLENGE_BENEFITS = [
  {
    icon: '📊',
    title: 'Track Your Progress',
    description: 'See your skin improve with weekly check-ins',
  },
  {
    icon: '🏆',
    title: 'Earn Rewards',
    description: 'Up to 25% off + exclusive badges',
  },
  {
    icon: '📸',
    title: 'Transformation Photos',
    description: 'Compare Day 1 vs Day 30 results',
  },
  {
    icon: '🎁',
    title: 'Referral Bonuses',
    description: 'Free samples when friends join',
  },
]

const TIMELINE = [
  { day: 1, label: 'Baseline', reward: null },
  { day: 7, label: 'Week 1 Check-in', reward: '10% off' },
  { day: 14, label: 'Midpoint', reward: '15% off' },
  { day: 21, label: 'Final Push', reward: 'Badge' },
  { day: 30, label: 'Transformation', reward: '25% off' },
]

export default function ChallengeJoin({ analysisId, onSuccess, onClose }: ChallengeJoinProps) {
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'intro' | 'confirm' | 'success'>('intro')

  const handleJoin = async () => {
    setJoining(true)
    setError(null)

    try {
      const res = await fetch('/api/challenge/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisId }),
      })

      const data = await res.json()

      if (data.success) {
        setStep('success')
        setTimeout(() => {
          onSuccess?.()
        }, 2000)
      } else {
        setError(data.error || 'Failed to join challenge')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setJoining(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {step === 'intro' && (
          <IntroStep
            onContinue={() => setStep('confirm')}
            onClose={onClose}
          />
        )}

        {step === 'confirm' && (
          <ConfirmStep
            joining={joining}
            error={error}
            onJoin={handleJoin}
            onBack={() => setStep('intro')}
          />
        )}

        {step === 'success' && <SuccessStep />}
      </div>
    </div>
  )
}

function IntroStep({ onContinue, onClose }: { onContinue: () => void; onClose?: () => void }) {
  return (
    <>
      {/* Header with gradient */}
      <div className="bg-gradient-to-br from-[#1C4444] to-[#2D5A5A] p-8 text-white relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#D4AF37]/20 rounded-full" />
        <div className="absolute -bottom-5 -left-5 w-24 h-24 bg-[#D4AF37]/10 rounded-full" />

        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        <div className="relative">
          <div className="text-[#D4AF37] text-xs tracking-[0.2em] uppercase mb-2">
            Transform Your Skin
          </div>
          <h2 className="text-3xl font-light mb-2">
            30-Day Glow Challenge
          </h2>
          <p className="text-white/80 text-sm">
            Commit to your skin for 30 days and unlock exclusive rewards
          </p>
        </div>
      </div>

      {/* Benefits */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          {CHALLENGE_BENEFITS.map((benefit, i) => (
            <div key={i} className="bg-[#F4EBE7] rounded-xl p-4">
              <span className="text-2xl mb-2 block">{benefit.icon}</span>
              <h3 className="font-medium text-[#1C4444] text-sm mb-1">{benefit.title}</h3>
              <p className="text-[#1C4444]/60 text-xs">{benefit.description}</p>
            </div>
          ))}
        </div>

        {/* Timeline preview */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-[#1C4444] mb-3">Your 30-Day Journey</h3>
          <div className="space-y-2">
            {TIMELINE.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#1C4444]/10 flex items-center justify-center text-xs font-medium text-[#1C4444]">
                  {item.day}
                </div>
                <div className="flex-1">
                  <span className="text-sm text-[#1C4444]">{item.label}</span>
                </div>
                {item.reward && (
                  <span className="text-xs bg-[#D4AF37]/10 text-[#9A8428] px-2 py-1 rounded-full">
                    {item.reward}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onContinue}
          className="w-full bg-[#1C4444] text-white py-4 rounded-xl font-medium hover:bg-[#2D5A5A] transition-colors"
        >
          Start My Challenge
        </button>

        <p className="text-center text-xs text-[#1C4444]/50 mt-4">
          Your current analysis will be your Day 1 baseline
        </p>
      </div>
    </>
  )
}

function ConfirmStep({
  joining,
  error,
  onJoin,
  onBack,
}: {
  joining: boolean
  error: string | null
  onJoin: () => void
  onBack: () => void
}) {
  return (
    <div className="p-8">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-[#1C4444]/60 hover:text-[#1C4444] mb-6 text-sm"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">✨</span>
        </div>
        <h2 className="text-2xl font-light text-[#1C4444] mb-2">Ready to Glow?</h2>
        <p className="text-[#1C4444]/70 text-sm">
          Confirm to start your 30-day transformation journey
        </p>
      </div>

      <div className="bg-[#F4EBE7] rounded-xl p-4 mb-6">
        <h3 className="font-medium text-[#1C4444] text-sm mb-3">Your Commitment</h3>
        <ul className="space-y-2 text-sm text-[#1C4444]/70">
          <li className="flex items-start gap-2">
            <span className="text-[#D4AF37]">✓</span>
            Weekly skin analysis check-ins
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#D4AF37]">✓</span>
            Follow your personalized skincare routine
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#D4AF37]">✓</span>
            Track your progress for 30 days
          </li>
        </ul>
      </div>

      <div className="bg-[#1C4444]/5 rounded-xl p-4 mb-6">
        <h3 className="font-medium text-[#1C4444] text-sm mb-3">What You&apos;ll Earn</h3>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-2xl font-light text-[#D4AF37]">25%</div>
            <div className="text-xs text-[#1C4444]/60">Off Complete</div>
          </div>
          <div>
            <div className="text-2xl font-light text-[#D4AF37]">5</div>
            <div className="text-xs text-[#1C4444]/60">Badges</div>
          </div>
          <div>
            <div className="text-2xl font-light text-[#D4AF37]">+10%</div>
            <div className="text-xs text-[#1C4444]/60">For Sharing</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <button
        onClick={onJoin}
        disabled={joining}
        className="w-full bg-gradient-to-r from-[#D4AF37] via-[#E5C048] to-[#D4AF37] text-[#1C4444] py-4 rounded-xl font-medium disabled:opacity-50 transition-all hover:shadow-lg"
      >
        {joining ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Starting Challenge...
          </span>
        ) : (
          'Confirm & Start'
        )}
      </button>
    </div>
  )
}

function SuccessStep() {
  return (
    <div className="p-8 text-center">
      <div className="relative w-24 h-24 mx-auto mb-6">
        {/* Animated rings */}
        <div className="absolute inset-0 rounded-full bg-[#D4AF37]/20 animate-ping" />
        <div className="absolute inset-2 rounded-full bg-[#D4AF37]/30 animate-pulse" />
        <div className="absolute inset-4 rounded-full bg-[#D4AF37] flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      <h2 className="text-2xl font-light text-[#1C4444] mb-2">Challenge Started!</h2>
      <p className="text-[#1C4444]/70 mb-6">
        Your 30-day glow journey begins now
      </p>

      <div className="bg-[#F4EBE7] rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#1C4444]">First Badge Earned</span>
          <span className="bg-[#D4AF37]/10 text-[#9A8428] px-3 py-1 rounded-full text-sm flex items-center gap-1">
            <span>🌱</span> Challenge Started
          </span>
        </div>
      </div>

      <p className="text-xs text-[#1C4444]/50">
        Redirecting to your challenge dashboard...
      </p>
    </div>
  )
}
