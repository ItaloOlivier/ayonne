'use client'

interface TrendChartProps {
  data: { date: string; score: number }[]
  height?: number
  showLabels?: boolean
  color?: string
  title?: string
}

export default function TrendChart({
  data,
  height = 150,
  showLabels = true,
  color = '#1C4444',
  title,
}: TrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-[#1C4444]/50 text-sm">
        No data available
      </div>
    )
  }

  if (data.length === 1) {
    return (
      <div className="flex items-center justify-center h-32 text-[#1C4444]/50 text-sm">
        Need at least 2 analyses to show trends
      </div>
    )
  }

  // Calculate chart dimensions
  const padding = { top: 20, right: 20, bottom: showLabels ? 30 : 10, left: 35 }
  const chartWidth = 100 // percentage
  const chartHeight = height - padding.top - padding.bottom

  // Get min/max for scaling
  const scores = data.map(d => d.score)
  const minScore = Math.min(...scores)
  const maxScore = Math.max(...scores)
  const scoreRange = maxScore - minScore || 1 // Prevent division by zero

  // Add some padding to the range
  const paddedMin = Math.max(0, minScore - 5)
  const paddedMax = Math.min(100, maxScore + 5)
  const paddedRange = paddedMax - paddedMin || 1

  // Calculate points for the line
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100
    const y = 100 - ((d.score - paddedMin) / paddedRange) * 100
    return { x, y, ...d }
  })

  // Create SVG path
  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ')

  // Create area path (for gradient fill)
  const areaPath = `${linePath} L ${points[points.length - 1].x} 100 L ${points[0].x} 100 Z`

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="w-full">
      {title && (
        <h4 className="text-sm font-medium text-[#1C4444] mb-2">{title}</h4>
      )}
      <div className="relative" style={{ height }}>
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-between text-xs text-[#1C4444]/50 py-2">
          <span>{paddedMax}</span>
          <span>{Math.round((paddedMax + paddedMin) / 2)}</span>
          <span>{paddedMin}</span>
        </div>

        {/* Chart area */}
        <div className="absolute left-8 right-0 top-0 bottom-0">
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="w-full h-full"
            style={{ paddingBottom: showLabels ? '24px' : '0' }}
          >
            {/* Grid lines */}
            <line x1="0" y1="0" x2="100" y2="0" stroke="#e5e7eb" strokeWidth="0.5" />
            <line x1="0" y1="50" x2="100" y2="50" stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="2,2" />
            <line x1="0" y1="100" x2="100" y2="100" stroke="#e5e7eb" strokeWidth="0.5" />

            {/* Area fill with gradient */}
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d={areaPath}
              fill="url(#areaGradient)"
              className="transition-all duration-500"
            />

            {/* Line */}
            <path
              d={linePath}
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              className="transition-all duration-500"
            />

            {/* Data points */}
            {points.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r="3"
                fill="white"
                stroke={color}
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>

          {/* X-axis labels */}
          {showLabels && (
            <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-[#1C4444]/50">
              {data.length <= 5 ? (
                data.map((d, i) => (
                  <span key={i} className="text-center" style={{ width: `${100 / data.length}%` }}>
                    {formatDate(d.date)}
                  </span>
                ))
              ) : (
                <>
                  <span>{formatDate(data[0].date)}</span>
                  <span>{formatDate(data[Math.floor(data.length / 2)].date)}</span>
                  <span>{formatDate(data[data.length - 1].date)}</span>
                </>
              )}
            </div>
          )}

          {/* Tooltip hints - show score on hover */}
          {points.map((p, i) => (
            <div
              key={i}
              className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
              }}
            >
              <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#1C4444] text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                {formatDate(p.date)}: {p.score}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
