'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { quickQualityCheck } from '@/lib/skin-analysis/image-quality'

export interface CaptureFrame {
  blob: Blob
  dataUrl: string
  qualityScore: number
  timestamp: number
}

export interface LiveCameraState {
  stream: MediaStream | null
  isActive: boolean
  error: string | null
  facingMode: 'user' | 'environment'
  qualityScore: number
  isAcceptable: boolean
  mainIssue: string | null
  isReadyForCapture: boolean
  steadyDuration: number
  autoCaptureProgress: number
}

export interface UseLiveCameraOptions {
  autoCaptureThreshold?: number // Quality score threshold (default: 70)
  autoCaptureDelay?: number // Seconds to hold good quality (default: 1.5)
  burstCount?: number // Number of frames to capture in burst (default: 3)
  burstInterval?: number // ms between burst frames (default: 200)
  onAutoCapture?: (frames: CaptureFrame[]) => void
  onQualityChange?: (score: number, isAcceptable: boolean) => void
}

const DEFAULT_OPTIONS: Required<Omit<UseLiveCameraOptions, 'onAutoCapture' | 'onQualityChange'>> = {
  autoCaptureThreshold: 70,
  autoCaptureDelay: 1.5,
  burstCount: 3,
  burstInterval: 200,
}

/**
 * Hook for live camera with quality monitoring and smart auto-capture
 *
 * Features:
 * - Real-time quality assessment
 * - Auto-capture when quality is stable
 * - Frame burst mode for best frame selection
 * - Face detection ready (expandable)
 */
export function useLiveCamera(options: UseLiveCameraOptions = {}) {
  const {
    autoCaptureThreshold = DEFAULT_OPTIONS.autoCaptureThreshold,
    autoCaptureDelay = DEFAULT_OPTIONS.autoCaptureDelay,
    burstCount = DEFAULT_OPTIONS.burstCount,
    burstInterval = DEFAULT_OPTIONS.burstInterval,
    onAutoCapture,
    onQualityChange,
  } = options

  const [state, setState] = useState<LiveCameraState>({
    stream: null,
    isActive: false,
    error: null,
    facingMode: 'user',
    qualityScore: 0,
    isAcceptable: false,
    mainIssue: null,
    isReadyForCapture: false,
    steadyDuration: 0,
    autoCaptureProgress: 0,
  })

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const qualityCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const steadyStartRef = useRef<number | null>(null)
  const autoCaptureEnabledRef = useRef(true)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (state.stream) {
        state.stream.getTracks().forEach(track => track.stop())
      }
      if (qualityCheckIntervalRef.current) {
        clearInterval(qualityCheckIntervalRef.current)
      }
    }
  }, [])

  /**
   * Start the camera stream
   */
  const startCamera = useCallback(async (facingMode: 'user' | 'environment' = 'user') => {
    setState(prev => ({ ...prev, error: null, isActive: true }))

    try {
      // Stop existing stream
      if (state.stream) {
        state.stream.getTracks().forEach(track => track.stop())
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 1280 },
        },
        audio: false,
      })

      setState(prev => ({
        ...prev,
        stream,
        facingMode,
        isActive: true,
        error: null,
      }))

      // Attach to video element if available
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      return stream
    } catch (err) {
      console.error('Camera error:', err)
      const errorMessage = 'Unable to access camera. Please check permissions.'
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isActive: false,
        stream: null,
      }))
      throw new Error(errorMessage)
    }
  }, [state.stream])

  /**
   * Stop the camera stream
   */
  const stopCamera = useCallback(() => {
    if (state.stream) {
      state.stream.getTracks().forEach(track => track.stop())
    }
    if (qualityCheckIntervalRef.current) {
      clearInterval(qualityCheckIntervalRef.current)
    }
    setState(prev => ({
      ...prev,
      stream: null,
      isActive: false,
      qualityScore: 0,
      isAcceptable: false,
      mainIssue: null,
      isReadyForCapture: false,
      steadyDuration: 0,
      autoCaptureProgress: 0,
    }))
  }, [state.stream])

  /**
   * Switch between front and back camera
   */
  const switchCamera = useCallback(async () => {
    const newFacingMode = state.facingMode === 'user' ? 'environment' : 'user'
    await startCamera(newFacingMode)
  }, [state.facingMode, startCamera])

  /**
   * Capture a single frame
   */
  const captureFrame = useCallback((): CaptureFrame | null => {
    if (!videoRef.current || !canvasRef.current) return null

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    if (!ctx || video.readyState < 2) return null

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Mirror for front camera
    if (state.facingMode === 'user') {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }

    ctx.drawImage(video, 0, 0)

    // Get quality score for this frame
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const quality = quickQualityCheck(imageData.data, canvas.width, canvas.height)

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)

    return new Promise<CaptureFrame>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve({
            blob,
            dataUrl,
            qualityScore: quality.score,
            timestamp: Date.now(),
          })
        }
      }, 'image/jpeg', 0.9)
    }) as unknown as CaptureFrame
  }, [state.facingMode])

  /**
   * Capture a burst of frames and return the best one
   */
  const captureBurst = useCallback(async (): Promise<CaptureFrame[]> => {
    const frames: CaptureFrame[] = []

    for (let i = 0; i < burstCount; i++) {
      const frame = await new Promise<CaptureFrame | null>((resolve) => {
        setTimeout(async () => {
          if (!videoRef.current || !canvasRef.current) {
            resolve(null)
            return
          }

          const video = videoRef.current
          const canvas = canvasRef.current
          const ctx = canvas.getContext('2d')

          if (!ctx || video.readyState < 2) {
            resolve(null)
            return
          }

          canvas.width = video.videoWidth
          canvas.height = video.videoHeight

          if (state.facingMode === 'user') {
            ctx.translate(canvas.width, 0)
            ctx.scale(-1, 1)
          }

          ctx.drawImage(video, 0, 0)

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const quality = quickQualityCheck(imageData.data, canvas.width, canvas.height)

          const dataUrl = canvas.toDataURL('image/jpeg', 0.9)

          canvas.toBlob((blob) => {
            if (blob) {
              resolve({
                blob,
                dataUrl,
                qualityScore: quality.score,
                timestamp: Date.now(),
              })
            } else {
              resolve(null)
            }
          }, 'image/jpeg', 0.9)
        }, i * burstInterval)
      })

      if (frame) {
        frames.push(frame)
      }
    }

    // Sort by quality score, best first
    return frames.sort((a, b) => b.qualityScore - a.qualityScore)
  }, [burstCount, burstInterval, state.facingMode])

  /**
   * Get the best frame from a burst
   */
  const getBestFrame = useCallback((frames: CaptureFrame[]): CaptureFrame | null => {
    if (frames.length === 0) return null
    return frames.reduce((best, current) =>
      current.qualityScore > best.qualityScore ? current : best
    )
  }, [])

  /**
   * Start quality monitoring with auto-capture
   */
  const startQualityMonitoring = useCallback(() => {
    if (qualityCheckIntervalRef.current) {
      clearInterval(qualityCheckIntervalRef.current)
    }

    steadyStartRef.current = null

    qualityCheckIntervalRef.current = setInterval(() => {
      if (!videoRef.current || !canvasRef.current || !state.isActive) return

      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')

      if (!ctx || video.readyState < 2) return

      // Sample at lower resolution for performance
      const sampleWidth = 320
      const sampleHeight = 320
      canvas.width = sampleWidth
      canvas.height = sampleHeight

      ctx.drawImage(video, 0, 0, sampleWidth, sampleHeight)
      const imageData = ctx.getImageData(0, 0, sampleWidth, sampleHeight)
      const result = quickQualityCheck(imageData.data, sampleWidth, sampleHeight)

      const isGoodQuality = result.score >= autoCaptureThreshold && result.isAcceptable

      // Track steady good quality duration
      if (isGoodQuality) {
        if (!steadyStartRef.current) {
          steadyStartRef.current = Date.now()
        }
        const steadyMs = Date.now() - steadyStartRef.current
        const steadySecs = steadyMs / 1000
        const progress = Math.min(1, steadySecs / autoCaptureDelay)

        setState(prev => ({
          ...prev,
          qualityScore: result.score,
          isAcceptable: result.isAcceptable,
          mainIssue: result.mainIssue,
          isReadyForCapture: steadySecs >= autoCaptureDelay,
          steadyDuration: steadySecs,
          autoCaptureProgress: progress,
        }))

        // Trigger auto-capture
        if (steadySecs >= autoCaptureDelay && autoCaptureEnabledRef.current && onAutoCapture) {
          autoCaptureEnabledRef.current = false // Prevent multiple triggers
          captureBurst().then(frames => {
            onAutoCapture(frames)
          })
        }

        onQualityChange?.(result.score, result.isAcceptable)
      } else {
        // Reset steady tracking
        steadyStartRef.current = null
        autoCaptureEnabledRef.current = true

        setState(prev => ({
          ...prev,
          qualityScore: result.score,
          isAcceptable: result.isAcceptable,
          mainIssue: result.mainIssue,
          isReadyForCapture: false,
          steadyDuration: 0,
          autoCaptureProgress: 0,
        }))

        onQualityChange?.(result.score, result.isAcceptable)
      }
    }, 200) // Check every 200ms
  }, [state.isActive, autoCaptureThreshold, autoCaptureDelay, onAutoCapture, onQualityChange, captureBurst])

  /**
   * Stop quality monitoring
   */
  const stopQualityMonitoring = useCallback(() => {
    if (qualityCheckIntervalRef.current) {
      clearInterval(qualityCheckIntervalRef.current)
      qualityCheckIntervalRef.current = null
    }
    steadyStartRef.current = null
  }, [])

  /**
   * Reset auto-capture to allow it to trigger again
   */
  const resetAutoCapture = useCallback(() => {
    autoCaptureEnabledRef.current = true
    steadyStartRef.current = null
    setState(prev => ({
      ...prev,
      isReadyForCapture: false,
      steadyDuration: 0,
      autoCaptureProgress: 0,
    }))
  }, [])

  /**
   * Set the video element ref
   */
  const setVideoRef = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el
    if (el && state.stream) {
      el.srcObject = state.stream
      el.play()
    }
  }, [state.stream])

  /**
   * Set the canvas element ref
   */
  const setCanvasRef = useCallback((el: HTMLCanvasElement | null) => {
    canvasRef.current = el
  }, [])

  return {
    // State
    ...state,

    // Refs
    videoRef,
    canvasRef,
    setVideoRef,
    setCanvasRef,

    // Camera controls
    startCamera,
    stopCamera,
    switchCamera,

    // Capture controls
    captureFrame,
    captureBurst,
    getBestFrame,

    // Quality monitoring
    startQualityMonitoring,
    stopQualityMonitoring,
    resetAutoCapture,
  }
}
