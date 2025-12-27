'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStreamingAnalysis } from '@/hooks/useStreamingAnalysis'

interface Props {
  imageFile: File | null
  onComplete?: (analysisId: string) => void
  onError?: (error: string) => void
}

/**
 * Streaming Analysis View Component
 *
 * Displays real-time progress as skin analysis proceeds:
 * - Animated spinner during processing
 * - Skin type revealed when detected
 * - Conditions appear one by one with confidence bars
 * - Auto-redirects to results on completion
 */
export default function StreamingAnalysisView({ imageFile, onComplete, onError }: Props) {
  const router = useRouter()
  const { analyze, progress, isAnalyzing } = useStreamingAnalysis()

  // Start analysis when image is provided
  useEffect(() => {
    if (imageFile && !isAnalyzing && !progress.complete) {
      analyze(imageFile)
    }
  }, [imageFile, analyze, isAnalyzing, progress.complete])

  // Handle completion
  useEffect(() => {
    if (progress.complete && !progress.error && progress.analysisId) {
      onComplete?.(progress.analysisId)
      // Auto-redirect to results after brief delay
      const timer = setTimeout(() => {
        router.push(`/skin-analysis/results/${progress.analysisId}`)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [progress.complete, progress.error, progress.analysisId, onComplete, router])

  // Handle errors
  useEffect(() => {
    if (progress.error) {
      onError?.(progress.error)
    }
  }, [progress.error, onError])

  return (
    <div className="bg-white rounded-2xl p-8 shadow-luxury animate-elegant-fade-in">
      {/* Status Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-[#1C4444]/10 flex items-center justify-center">
            {progress.complete && !progress.error ? (
              <svg className="w-6 h-6 text-[#1C4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : progress.error ? (
              <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <div className="w-6 h-6 border-2 border-[#1C4444] border-t-transparent rounded-full animate-spin" />
            )}
          </div>
          {!progress.complete && !progress.error && (
            <div className="absolute inset-0 rounded-full animate-pulse-ring bg-[#1C4444]/20" />
          )}
        </div>
        <div>
          <h3 className="text-lg font-medium text-[#1C4444]">
            {progress.complete && !progress.error
              ? 'Analysis Complete'
              : progress.error
                ? 'Analysis Failed'
                : 'Analyzing Your Skin'}
          </h3>
          <p className="text-sm text-[#1C4444]/60">{progress.status}</p>
        </div>
      </div>

      {/* Error State */}
      {progress.error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-lg mb-6">
          <p className="text-sm text-red-700">{progress.error}</p>
        </div>
      )}

      {/* Skin Type - Appears when detected */}
      {progress.skinType && (
        <div className="mb-6 animate-elegant-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#1C4444]/5 rounded-full">
            <span className="text-sm text-[#1C4444]/60">Skin Type:</span>
            <span className="text-sm font-medium text-[#1C4444] capitalize">
              {progress.skinType}
            </span>
          </div>
        </div>
      )}

      {/* Conditions - Appear as detected */}
      {progress.conditions.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-[#1C4444]/60 uppercase tracking-wider">
            Detected Conditions
          </h4>
          <div className="space-y-2">
            {progress.conditions.map((condition, index) => (
              <div
                key={condition.id}
                className="flex items-center justify-between p-3 bg-[#F4EBE7] rounded-lg animate-slide-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <span className="text-sm font-medium text-[#1C4444]">
                  {condition.name}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-[#1C4444]/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#1C4444] rounded-full transition-all duration-500"
                      style={{ width: `${condition.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-[#1C4444]/60 w-10">
                    {Math.round(condition.confidence * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading placeholder when no conditions yet */}
      {!progress.error && progress.conditions.length === 0 && !progress.complete && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-[#1C4444]/60 uppercase tracking-wider">
            Detecting Conditions...
          </h4>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-[#F4EBE7]/50 rounded-lg animate-pulse"
              >
                <div className="w-24 h-4 bg-[#1C4444]/10 rounded" />
                <div className="w-20 h-2 bg-[#1C4444]/10 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completion message */}
      {progress.complete && !progress.error && (
        <div className="mt-6 p-4 bg-gradient-to-r from-[#1C4444]/5 to-transparent rounded-lg border border-[#1C4444]/10 animate-elegant-fade-in">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[#D4AF37]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-[#1C4444] font-medium">
              Redirecting to your personalized results...
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
