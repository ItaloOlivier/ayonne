'use client'

interface SkinHealthScoreProps {
  score: number
  previousScore?: number
  size?: 'sm' | 'md' | 'lg'
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e' // green
  if (score >= 60) return '#84cc16' // lime
  if (score >= 40) return '#eab308' // yellow
  if (score >= 20) return '#f97316' // orange
  return '#ef4444' // red
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Fair'
  if (score >= 20) return 'Needs Attention'
  return 'Needs Care'
}

export default function SkinHealthScore({ score, previousScore, size = 'md' }: SkinHealthScoreProps) {
  const color = getScoreColor(score)
  const label = getScoreLabel(score)

  // Calculate trend
  const trend = previousScore !== undefined ? score - previousScore : 0
  const trendDirection = trend > 0 ? 'up' : trend < 0 ? 'down' : 'neutral'

  // Size configurations
  const sizes = {
    sm: { container: 'w-20 h-20', text: 'text-xl', label: 'text-xs', stroke: 6 },
    md: { container: 'w-32 h-32', text: 'text-3xl', label: 'text-sm', stroke: 8 },
    lg: { container: 'w-40 h-40', text: 'text-4xl', label: 'text-base', stroke: 10 },
  }

  const sizeConfig = sizes[size]

  // SVG circle calculations
  const radius = 45
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference
  const offset = circumference - progress

  return (
    <div className="flex flex-col items-center">
      <div className={`relative ${sizeConfig.container}`}>
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={sizeConfig.stroke}
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={sizeConfig.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Score text in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`${sizeConfig.text} font-semibold text-[#1C4444]`}>
            {score}
          </span>
          {previousScore !== undefined && trend !== 0 && (
            <div className={`flex items-center gap-0.5 ${trend > 0 ? 'text-green-600' : 'text-red-500'}`}>
              {trendDirection === 'up' ? (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
                </svg>
              ) : (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                </svg>
              )}
              <span className="text-xs font-medium">{Math.abs(trend)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Label below */}
      <span className={`mt-2 ${sizeConfig.label} font-medium`} style={{ color }}>
        {label}
      </span>
    </div>
  )
}

// Helper function to calculate health score from conditions
export function calculateHealthScore(conditions: Array<{ id: string; confidence: number }>): number {
  const CONDITION_WEIGHTS: Record<string, number> = {
    acne: 15,
    wrinkles: 12,
    dark_spots: 10,
    fine_lines: 8,
    redness: 10,
    dryness: 8,
    oiliness: 6,
    dark_circles: 7,
    enlarged_pores: 6,
    large_pores: 6,
    sun_damage: 10,
    dullness: 5,
    uneven_texture: 6,
    dehydration: 7,
  }

  let totalDeduction = 0

  for (const condition of conditions) {
    const weight = CONDITION_WEIGHTS[condition.id] || 5
    totalDeduction += condition.confidence * weight
  }

  return Math.max(0, Math.round(100 - totalDeduction))
}
