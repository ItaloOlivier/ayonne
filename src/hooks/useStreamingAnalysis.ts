'use client'

import { useState, useCallback, useRef } from 'react'

interface DetectedCondition {
  id: string
  name: string
  confidence: number
  description?: string
}

interface AnalysisProgress {
  status: string
  skinType?: string
  conditions: DetectedCondition[]
  complete: boolean
  error?: string
  analysisId?: string
}

interface StreamingAnalysisResult {
  analyze: (imageFile: File) => Promise<void>
  progress: AnalysisProgress
  isAnalyzing: boolean
  reset: () => void
}

/**
 * Hook for streaming skin analysis with real-time feedback
 *
 * Usage:
 * ```tsx
 * const { analyze, progress, isAnalyzing } = useStreamingAnalysis()
 *
 * // Start analysis
 * await analyze(imageFile)
 *
 * // Track progress
 * if (progress.skinType) {
 *   console.log('Detected:', progress.skinType)
 * }
 *
 * // Check completion
 * if (progress.complete) {
 *   router.push(`/skin-analysis/results/${progress.analysisId}`)
 * }
 * ```
 */
export function useStreamingAnalysis(): StreamingAnalysisResult {
  const [progress, setProgress] = useState<AnalysisProgress>({
    status: 'idle',
    conditions: [],
    complete: false,
  })
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const reset = useCallback(() => {
    setProgress({
      status: 'idle',
      conditions: [],
      complete: false,
    })
    setIsAnalyzing(false)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])

  const analyze = useCallback(async (imageFile: File) => {
    // Cancel any existing analysis
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    setIsAnalyzing(true)
    setProgress({
      status: 'Preparing image...',
      conditions: [],
      complete: false,
    })

    const formData = new FormData()
    formData.append('image', imageFile)

    try {
      const response = await fetch('/api/skin-analysis/analyze-stream', {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        const error = await response.json()
        setProgress(p => ({
          ...p,
          error: error.error || 'Analysis failed',
          complete: true,
        }))
        setIsAnalyzing(false)
        return
      }

      const reader = response.body?.getReader()
      if (!reader) {
        setProgress(p => ({
          ...p,
          error: 'Failed to start analysis',
          complete: true,
        }))
        setIsAnalyzing(false)
        return
      }

      const decoder = new TextDecoder()
      const seenConditions = new Set<string>()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value)
        const lines = text.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue

          try {
            const event = JSON.parse(line.slice(6))

            switch (event.type) {
              case 'status':
                setProgress(p => ({ ...p, status: event.message }))
                break

              case 'partial':
                if (event.field === 'skinType') {
                  setProgress(p => ({
                    ...p,
                    skinType: event.value,
                    status: `Detected ${event.value} skin`,
                  }))
                }
                break

              case 'condition':
                if (!seenConditions.has(event.id)) {
                  seenConditions.add(event.id)
                  setProgress(p => ({
                    ...p,
                    conditions: [
                      ...p.conditions,
                      {
                        id: event.id,
                        name: event.name,
                        confidence: event.confidence,
                      },
                    ],
                    status: `Found: ${event.name}`,
                  }))
                }
                break

              case 'complete':
                setProgress(p => ({
                  ...p,
                  complete: true,
                  status: 'Analysis complete',
                  skinType: event.analysis?.skinType || p.skinType,
                  conditions: event.analysis?.conditions || p.conditions,
                  analysisId: event.analysisId,
                }))
                break

              case 'error':
                setProgress(p => ({
                  ...p,
                  error: event.message,
                  complete: true,
                }))
                break
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        // Analysis was cancelled
        return
      }
      setProgress(p => ({
        ...p,
        error: 'Analysis failed. Please try again.',
        complete: true,
      }))
    } finally {
      setIsAnalyzing(false)
    }
  }, [])

  return { analyze, progress, isAnalyzing, reset }
}
