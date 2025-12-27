'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface AdviceItem {
  title: string
  tip: string
  priority: 'high' | 'medium' | 'low'
}

interface SkincareAdviceProps {
  advice: AdviceItem[]
}

export default function SkincareAdvice({ advice }: SkincareAdviceProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0)

  if (!advice || advice.length === 0) {
    return null
  }

  // Group by priority
  const highPriority = advice.filter(a => a.priority === 'high')
  const otherAdvice = advice.filter(a => a.priority !== 'high')

  const priorityColors = {
    high: 'bg-[#1C4444] text-white',
    medium: 'bg-[#1C4444]/20 text-[#1C4444]',
    low: 'bg-[#1C4444]/10 text-[#1C4444]',
  }

  const priorityLabels = {
    high: 'Essential',
    medium: 'Recommended',
    low: 'Good to Know',
  }

  return (
    <div className="bg-white rounded-xl p-6">
      <h3 className="text-lg font-medium text-[#1C4444] mb-2">Personalized Skincare Tips</h3>
      <p className="text-[#1C4444]/60 text-sm mb-6">
        Expert advice tailored to your skin&apos;s unique needs
      </p>

      {/* Essential Tips - Always visible */}
      {highPriority.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-[#1C4444] text-white text-xs px-2 py-1 rounded">
              Essential
            </span>
            <span className="text-[#1C4444]/50 text-xs">
              Start with these
            </span>
          </div>

          <div className="space-y-3">
            {highPriority.slice(0, 3).map((item, idx) => (
              <div
                key={idx}
                className="bg-[#F4EBE7] rounded-lg p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#1C4444] text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-[#1C4444] font-medium mb-1">{item.title}</h4>
                    <p className="text-[#1C4444]/70 text-sm">{item.tip}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other Tips - Accordion style */}
      {otherAdvice.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-[#1C4444]/20 text-[#1C4444] text-xs px-2 py-1 rounded">
              More Tips
            </span>
          </div>

          <div className="space-y-2">
            {otherAdvice.map((item, idx) => (
              <div
                key={idx}
                className="border border-[#1C4444]/10 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-[#F4EBE7]/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded',
                      priorityColors[item.priority]
                    )}>
                      {priorityLabels[item.priority]}
                    </span>
                    <span className="text-[#1C4444] font-medium text-sm">
                      {item.title}
                    </span>
                  </div>
                  <svg
                    className={cn(
                      'w-5 h-5 text-[#1C4444]/50 transition-transform',
                      expandedIndex === idx && 'rotate-180'
                    )}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {expandedIndex === idx && (
                  <div className="px-4 pb-4 pt-0">
                    <p className="text-[#1C4444]/70 text-sm pl-[52px]">
                      {item.tip}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Routine Reminder */}
      <div className="mt-6 p-4 bg-[#1C4444]/5 rounded-lg">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-[#1C4444] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-[#1C4444] font-medium text-sm">Consistency is Key</p>
            <p className="text-[#1C4444]/60 text-xs mt-1">
              Follow your skincare routine morning and night for at least 4-6 weeks before expecting visible results.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
