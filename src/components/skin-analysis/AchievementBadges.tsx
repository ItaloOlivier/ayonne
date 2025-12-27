'use client'

import { useState, useEffect } from 'react'

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlockedAt?: string
  progress?: number // 0-100
  maxProgress?: number
}

interface AchievementBadgesProps {
  achievements: Achievement[]
  showLocked?: boolean
}

const ACHIEVEMENT_DEFINITIONS: Record<string, { name: string; description: string; icon: string }> = {
  first_analysis: {
    name: 'First Steps',
    description: 'Complete your first skin analysis',
    icon: 'sparkle',
  },
  streak_3: {
    name: 'Getting Started',
    description: 'Maintain a 3-day analysis streak',
    icon: 'fire',
  },
  streak_7: {
    name: 'Week Warrior',
    description: 'Maintain a 7-day analysis streak',
    icon: 'fire',
  },
  streak_30: {
    name: 'Consistency Queen',
    description: 'Maintain a 30-day analysis streak',
    icon: 'crown',
  },
  improvement_5: {
    name: 'Making Progress',
    description: 'Improve your skin score by 5 points',
    icon: 'trending_up',
  },
  improvement_10: {
    name: 'Glow Up',
    description: 'Improve your skin score by 10 points',
    icon: 'star',
  },
  improvement_20: {
    name: 'Transformation',
    description: 'Improve your skin score by 20 points',
    icon: 'trophy',
  },
  analyses_5: {
    name: 'Dedicated',
    description: 'Complete 5 skin analyses',
    icon: 'target',
  },
  analyses_10: {
    name: 'Skin Expert',
    description: 'Complete 10 skin analyses',
    icon: 'medal',
  },
  analyses_25: {
    name: 'Skincare Guru',
    description: 'Complete 25 skin analyses',
    icon: 'gem',
  },
  perfect_score: {
    name: 'Flawless',
    description: 'Achieve a skin score of 90+',
    icon: 'diamond',
  },
  early_bird: {
    name: 'Early Bird',
    description: 'Complete an analysis before 8am',
    icon: 'sun',
  },
  night_owl: {
    name: 'Night Owl',
    description: 'Complete an analysis after 10pm',
    icon: 'moon',
  },
  purchased_recommended: {
    name: 'Taking Action',
    description: 'Purchase a recommended product',
    icon: 'shopping_bag',
  },
}

const IconComponent = ({ icon, className }: { icon: string; className?: string }) => {
  const icons: Record<string, React.ReactNode> = {
    sparkle: (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
      </svg>
    ),
    fire: (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 23c-3.866 0-7-3.134-7-7 0-2.526 1.394-4.792 3.5-6.217-.056.366-.086.74-.086 1.122 0 2.126.813 4.065 2.143 5.52.274.3.664.41 1.024.29.36-.12.645-.42.748-.79.103-.37.042-.77-.16-1.09A5.965 5.965 0 0111 12c0-.878.188-1.715.526-2.469.341-.758.832-1.437 1.444-1.994.615.557 1.104 1.237 1.445 1.995.338.754.526 1.59.526 2.469 0 .987-.238 1.918-.661 2.739-.203.32-.264.72-.16 1.09.103.37.388.67.748.79.36.12.75.01 1.024-.29A7.945 7.945 0 0017 12c0-.382-.03-.756-.086-1.122C18.606 12.208 20 14.474 20 17c0 3.866-3.134 7-7 7z"/>
      </svg>
    ),
    crown: (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5m14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/>
      </svg>
    ),
    trending_up: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    star: (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    ),
    trophy: (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/>
      </svg>
    ),
    target: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
    medal: (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 8a4 4 0 100 8 4 4 0 000-8zm0 10a6 6 0 110-12 6 6 0 010 12zm0-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
      </svg>
    ),
    gem: (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2L2 7l10 15L22 7 12 2zm0 2.8L18.5 7 12 16 5.5 7 12 4.8z"/>
      </svg>
    ),
    diamond: (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M6 2l-6 8 12 12 12-12-6-8H6zm3.5 2h5l3 4-8.5 8.5-3-4 3.5-8.5z"/>
      </svg>
    ),
    sun: (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 7a5 5 0 100 10 5 5 0 000-10zm0-5v2m0 16v2m9-9h-2M5 12H3m15.36-6.36l-1.41 1.41M7.05 16.95l-1.41 1.41m12.72 0l-1.41-1.41M7.05 7.05L5.64 5.64"/>
      </svg>
    ),
    moon: (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 3a9 9 0 109 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 01-4.4 2.26 5.403 5.403 0 01-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/>
      </svg>
    ),
    shopping_bag: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
  }

  return <>{icons[icon] || icons.star}</>
}

export default function AchievementBadges({ achievements, showLocked = true }: AchievementBadgesProps) {
  const [selectedBadge, setSelectedBadge] = useState<Achievement | null>(null)
  const [newlyUnlocked, setNewlyUnlocked] = useState<string | null>(null)

  // Check for newly unlocked achievements (within last 5 seconds)
  useEffect(() => {
    const recent = achievements.find(a => {
      if (!a.unlockedAt) return false
      const unlockTime = new Date(a.unlockedAt).getTime()
      const now = Date.now()
      return now - unlockTime < 5000
    })
    if (recent) {
      setNewlyUnlocked(recent.id)
      setTimeout(() => setNewlyUnlocked(null), 3000)
    }
  }, [achievements])

  const unlockedAchievements = achievements.filter(a => a.unlockedAt)
  const lockedAchievements = showLocked
    ? Object.entries(ACHIEVEMENT_DEFINITIONS)
        .filter(([id]) => !achievements.find(a => a.id === id && a.unlockedAt))
        .map(([id, def]) => ({
          id,
          ...def,
          progress: achievements.find(a => a.id === id)?.progress || 0,
          maxProgress: achievements.find(a => a.id === id)?.maxProgress || 100,
        }))
    : []

  return (
    <div className="space-y-4">
      {/* Unlocked badges */}
      {unlockedAchievements.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-[#1C4444]/60 mb-3">
            Unlocked ({unlockedAchievements.length})
          </h4>
          <div className="flex flex-wrap gap-3">
            {unlockedAchievements.map(achievement => {
              const def = ACHIEVEMENT_DEFINITIONS[achievement.id] || achievement
              const isNew = newlyUnlocked === achievement.id

              return (
                <button
                  key={achievement.id}
                  onClick={() => setSelectedBadge(achievement)}
                  className={`relative group w-14 h-14 rounded-xl bg-gradient-to-br from-[#1C4444] to-[#2d5a5a] flex items-center justify-center transition-all hover:scale-110 hover:shadow-lg ${
                    isNew ? 'animate-bounce ring-4 ring-yellow-400 ring-opacity-50' : ''
                  }`}
                >
                  <IconComponent icon={def.icon} className="w-7 h-7 text-white" />

                  {/* Shine effect for new badges */}
                  {isNew && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shine rounded-xl overflow-hidden" />
                  )}

                  {/* Tooltip */}
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="bg-[#1C4444] text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      {def.name}
                    </div>
                    <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 bg-[#1C4444] rotate-45" />
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Locked badges with progress */}
      {lockedAchievements.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-[#1C4444]/60 mb-3">
            Coming Up
          </h4>
          <div className="flex flex-wrap gap-3">
            {lockedAchievements.slice(0, 4).map(achievement => {
              const progress = achievement.progress || 0
              const maxProgress = achievement.maxProgress || 100
              const progressPercent = Math.min(100, (progress / maxProgress) * 100)

              return (
                <div
                  key={achievement.id}
                  className="relative w-14 h-14 rounded-xl bg-[#1C4444]/10 flex items-center justify-center overflow-hidden"
                >
                  <IconComponent icon={achievement.icon} className="w-7 h-7 text-[#1C4444]/30" />

                  {/* Progress fill */}
                  {progressPercent > 0 && (
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-[#1C4444]/20"
                      style={{ height: `${progressPercent}%` }}
                    />
                  )}

                  {/* Lock icon */}
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#1C4444]/50 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Badge detail modal */}
      {selectedBadge && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedBadge(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-xs w-full text-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-[#1C4444] to-[#2d5a5a] flex items-center justify-center mb-4">
              <IconComponent
                icon={ACHIEVEMENT_DEFINITIONS[selectedBadge.id]?.icon || 'star'}
                className="w-10 h-10 text-white"
              />
            </div>
            <h3 className="text-xl font-semibold text-[#1C4444] mb-2">
              {ACHIEVEMENT_DEFINITIONS[selectedBadge.id]?.name || selectedBadge.name}
            </h3>
            <p className="text-[#1C4444]/60 text-sm mb-4">
              {ACHIEVEMENT_DEFINITIONS[selectedBadge.id]?.description || selectedBadge.description}
            </p>
            {selectedBadge.unlockedAt && (
              <p className="text-xs text-[#1C4444]/40">
                Unlocked {new Date(selectedBadge.unlockedAt).toLocaleDateString()}
              </p>
            )}
            <button
              onClick={() => setSelectedBadge(null)}
              className="mt-4 px-6 py-2 bg-[#1C4444] text-white rounded-lg text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper to compute achievements based on user data
export function computeAchievements(data: {
  analysisCount: number
  currentStreak: number
  longestStreak: number
  currentScore: number
  firstScore: number
  analysisTimes: string[]
}): Achievement[] {
  const achievements: Achievement[] = []
  const now = new Date().toISOString()

  // First analysis
  if (data.analysisCount >= 1) {
    achievements.push({
      id: 'first_analysis',
      name: 'First Steps',
      description: 'Complete your first skin analysis',
      icon: 'sparkle',
      unlockedAt: now,
    })
  }

  // Streak achievements
  if (data.longestStreak >= 3) {
    achievements.push({
      id: 'streak_3',
      name: 'Getting Started',
      description: 'Maintain a 3-day analysis streak',
      icon: 'fire',
      unlockedAt: now,
    })
  } else if (data.currentStreak > 0) {
    achievements.push({
      id: 'streak_3',
      name: 'Getting Started',
      description: 'Maintain a 3-day analysis streak',
      icon: 'fire',
      progress: data.currentStreak,
      maxProgress: 3,
    })
  }

  if (data.longestStreak >= 7) {
    achievements.push({
      id: 'streak_7',
      name: 'Week Warrior',
      description: 'Maintain a 7-day analysis streak',
      icon: 'fire',
      unlockedAt: now,
    })
  }

  if (data.longestStreak >= 30) {
    achievements.push({
      id: 'streak_30',
      name: 'Consistency Queen',
      description: 'Maintain a 30-day analysis streak',
      icon: 'crown',
      unlockedAt: now,
    })
  }

  // Improvement achievements
  const improvement = data.currentScore - data.firstScore
  if (improvement >= 5) {
    achievements.push({
      id: 'improvement_5',
      name: 'Making Progress',
      description: 'Improve your skin score by 5 points',
      icon: 'trending_up',
      unlockedAt: now,
    })
  }

  if (improvement >= 10) {
    achievements.push({
      id: 'improvement_10',
      name: 'Glow Up',
      description: 'Improve your skin score by 10 points',
      icon: 'star',
      unlockedAt: now,
    })
  }

  if (improvement >= 20) {
    achievements.push({
      id: 'improvement_20',
      name: 'Transformation',
      description: 'Improve your skin score by 20 points',
      icon: 'trophy',
      unlockedAt: now,
    })
  }

  // Analysis count achievements
  if (data.analysisCount >= 5) {
    achievements.push({
      id: 'analyses_5',
      name: 'Dedicated',
      description: 'Complete 5 skin analyses',
      icon: 'target',
      unlockedAt: now,
    })
  } else {
    achievements.push({
      id: 'analyses_5',
      name: 'Dedicated',
      description: 'Complete 5 skin analyses',
      icon: 'target',
      progress: data.analysisCount,
      maxProgress: 5,
    })
  }

  if (data.analysisCount >= 10) {
    achievements.push({
      id: 'analyses_10',
      name: 'Skin Expert',
      description: 'Complete 10 skin analyses',
      icon: 'medal',
      unlockedAt: now,
    })
  }

  if (data.analysisCount >= 25) {
    achievements.push({
      id: 'analyses_25',
      name: 'Skincare Guru',
      description: 'Complete 25 skin analyses',
      icon: 'gem',
      unlockedAt: now,
    })
  }

  // Perfect score
  if (data.currentScore >= 90) {
    achievements.push({
      id: 'perfect_score',
      name: 'Flawless',
      description: 'Achieve a skin score of 90+',
      icon: 'diamond',
      unlockedAt: now,
    })
  }

  // Time-based achievements
  data.analysisTimes.forEach(time => {
    const hour = new Date(time).getHours()
    if (hour < 8 && !achievements.find(a => a.id === 'early_bird')) {
      achievements.push({
        id: 'early_bird',
        name: 'Early Bird',
        description: 'Complete an analysis before 8am',
        icon: 'sun',
        unlockedAt: now,
      })
    }
    if (hour >= 22 && !achievements.find(a => a.id === 'night_owl')) {
      achievements.push({
        id: 'night_owl',
        name: 'Night Owl',
        description: 'Complete an analysis after 10pm',
        icon: 'moon',
        unlockedAt: now,
      })
    }
  })

  return achievements
}
