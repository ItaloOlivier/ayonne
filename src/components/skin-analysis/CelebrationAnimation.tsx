'use client'

import { useEffect, useState } from 'react'

interface CelebrationAnimationProps {
  type: 'confetti' | 'score_up' | 'streak' | 'achievement'
  message?: string
  onComplete?: () => void
  autoPlay?: boolean
}

export default function CelebrationAnimation({
  type,
  message,
  onComplete,
  autoPlay = true,
}: CelebrationAnimationProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [particles, setParticles] = useState<Array<{ id: number; x: number; color: string; delay: number }>>([])

  useEffect(() => {
    if (!isPlaying) return

    // Generate confetti particles
    if (type === 'confetti') {
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: ['#1C4444', '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1'][Math.floor(Math.random() * 5)],
        delay: Math.random() * 0.5,
      }))
      setParticles(newParticles)
    }

    const timer = setTimeout(() => {
      setIsPlaying(false)
      onComplete?.()
    }, 3000)

    return () => clearTimeout(timer)
  }, [isPlaying, type, onComplete])

  if (!isPlaying) return null

  if (type === 'confetti') {
    return (
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute w-3 h-3 animate-confetti"
            style={{
              left: `${particle.x}%`,
              backgroundColor: particle.color,
              animationDelay: `${particle.delay}s`,
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          />
        ))}
        {message && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-8 py-6 shadow-2xl animate-bounce-in">
              <p className="text-2xl font-bold text-[#1C4444] text-center">{message}</p>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (type === 'score_up') {
    return (
      <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
        <div className="animate-score-up">
          <div className="bg-gradient-to-br from-green-400 to-emerald-500 text-white rounded-2xl px-8 py-6 shadow-2xl">
            <div className="text-center">
              <div className="text-5xl font-bold mb-2 animate-pulse">↑</div>
              <p className="text-xl font-bold">{message || 'Score Improved!'}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (type === 'streak') {
    return (
      <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center bg-black/20">
        <div className="animate-bounce-in">
          <div className="bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-2xl px-10 py-8 shadow-2xl">
            <div className="text-center">
              <div className="text-6xl mb-3">🔥</div>
              <p className="text-2xl font-bold">{message || 'Streak Extended!'}</p>
              <p className="text-sm opacity-80 mt-2">Keep it up!</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (type === 'achievement') {
    return (
      <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center bg-black/30">
        <div className="animate-achievement-unlock">
          <div className="bg-gradient-to-br from-[#1C4444] to-[#2d6a6a] text-white rounded-2xl px-10 py-8 shadow-2xl">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-12 h-12 text-yellow-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <p className="text-sm opacity-80 uppercase tracking-wide">Achievement Unlocked</p>
              <p className="text-xl font-bold mt-2">{message || 'New Badge!'}</p>
            </div>
          </div>
        </div>
        {/* Sparkles */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-sparkle"
            style={{
              left: `${50 + Math.cos(i * 45 * Math.PI / 180) * 30}%`,
              top: `${50 + Math.sin(i * 45 * Math.PI / 180) * 30}%`,
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>
    )
  }

  return null
}

// Inline celebration for smaller contexts
interface InlineCelebrationProps {
  show: boolean
  type: 'improvement' | 'milestone' | 'purchase'
  value?: string
}

export function InlineCelebration({ show, type, value }: InlineCelebrationProps) {
  const [visible, setVisible] = useState(show)

  useEffect(() => {
    if (show) {
      setVisible(true)
      const timer = setTimeout(() => setVisible(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [show])

  if (!visible) return null

  const config = {
    improvement: { color: 'from-green-400 to-emerald-500', icon: '📈', text: `+${value} points!` },
    milestone: { color: 'from-purple-400 to-pink-500', icon: '🎯', text: 'Milestone reached!' },
    purchase: { color: 'from-blue-400 to-indigo-500', icon: '🛒', text: 'Added to cart!' },
  }

  const { color, icon, text } = config[type]

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${color} text-white text-sm font-medium animate-slide-in`}>
      <span>{icon}</span>
      <span>{value ? text : config[type].text}</span>
    </div>
  )
}

// Score comparison animation
interface ScoreComparisonProps {
  previousScore: number
  currentScore: number
  animate?: boolean
}

export function ScoreComparison({ previousScore, currentScore, animate = true }: ScoreComparisonProps) {
  const [displayScore, setDisplayScore] = useState(animate ? previousScore : currentScore)
  const improvement = currentScore - previousScore
  const isImproved = improvement > 0

  useEffect(() => {
    if (!animate) return

    const duration = 1500
    const steps = 30
    const stepValue = improvement / steps
    let current = previousScore

    const interval = setInterval(() => {
      current += stepValue
      if ((stepValue > 0 && current >= currentScore) || (stepValue < 0 && current <= currentScore)) {
        setDisplayScore(currentScore)
        clearInterval(interval)
      } else {
        setDisplayScore(Math.round(current))
      }
    }, duration / steps)

    return () => clearInterval(interval)
  }, [animate, previousScore, currentScore, improvement])

  return (
    <div className="text-center">
      <div className="text-6xl font-bold text-[#1C4444] mb-2">{displayScore}</div>
      {improvement !== 0 && (
        <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full ${
          isImproved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          <svg className={`w-4 h-4 ${isImproved ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
          <span className="font-medium">{Math.abs(improvement)} points</span>
        </div>
      )}
    </div>
  )
}
