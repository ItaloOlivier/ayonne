'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'
import { useLiveCamera, CaptureFrame } from '@/hooks/useLiveCamera'
import { initFaceDetector, FaceDetectionStream, FaceDetectionResult } from '@/lib/skin-analysis/face-detection'
import { getQualityTier } from '@/lib/skin-analysis/image-quality'

interface LiveCameraCaptureProps {
  angle: 'front' | 'left' | 'right'
  onCapture: (frame: CaptureFrame) => void
  onCancel: () => void
  onUploadFallback?: () => void
  autoCapture?: boolean
  showGuide?: boolean
}

const ANGLE_CONFIGS = {
  front: {
    label: 'Front View',
    guideText: 'Center your face',
    instruction: 'Look directly at the camera',
    silhouetteTransform: '',
  },
  left: {
    label: 'Left Profile',
    guideText: 'Show your left side',
    instruction: 'Turn head 45° to the right',
    silhouetteTransform: 'rotateY(35deg)',
  },
  right: {
    label: 'Right Profile',
    guideText: 'Show your right side',
    instruction: 'Turn head 45° to the left',
    silhouetteTransform: 'rotateY(-35deg)',
  },
}

/**
 * Live Camera Capture Component
 *
 * Features:
 * - Real-time quality monitoring with visual feedback
 * - Optional face detection for positioning guidance
 * - Smart auto-capture when conditions are optimal
 * - Frame burst capture for best quality selection
 * - Smooth progress indicator for auto-capture countdown
 */
export default function LiveCameraCapture({
  angle,
  onCapture,
  onCancel,
  onUploadFallback,
  autoCapture = true,
  showGuide = true,
}: LiveCameraCaptureProps) {
  const [faceDetection, setFaceDetection] = useState<FaceDetectionResult | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [showFlash, setShowFlash] = useState(false)
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null)
  const [faceDetectionSupported, setFaceDetectionSupported] = useState(false)

  const faceDetectionStreamRef = useRef<FaceDetectionStream | null>(null)
  const config = ANGLE_CONFIGS[angle]

  const handleAutoCapture = useCallback((frames: CaptureFrame[]) => {
    if (frames.length === 0) return

    setIsCapturing(true)
    setShowFlash(true)

    // Get the best frame
    const bestFrame = frames[0] // Already sorted by quality

    // Show preview briefly
    setCapturedPreview(bestFrame.dataUrl)

    // Flash effect
    setTimeout(() => setShowFlash(false), 150)

    // Return the captured frame after brief preview
    setTimeout(() => {
      onCapture(bestFrame)
    }, 500)
  }, [onCapture])

  const {
    isActive,
    error,
    qualityScore,
    isAcceptable,
    mainIssue,
    autoCaptureProgress,
    isReadyForCapture,
    setVideoRef,
    setCanvasRef,
    startCamera,
    stopCamera,
    switchCamera,
    captureBurst,
    startQualityMonitoring,
    stopQualityMonitoring,
    resetAutoCapture,
  } = useLiveCamera({
    autoCaptureThreshold: 70,
    autoCaptureDelay: 1.5,
    onAutoCapture: autoCapture ? handleAutoCapture : undefined,
  })

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Initialize face detection
  useEffect(() => {
    initFaceDetector().then(supported => {
      setFaceDetectionSupported(supported)
    })
  }, [])

  // Start camera on mount
  useEffect(() => {
    startCamera('user').then(() => {
      startQualityMonitoring()
    }).catch(() => {
      // Error handled in hook
    })

    return () => {
      stopCamera()
      stopQualityMonitoring()
      if (faceDetectionStreamRef.current) {
        faceDetectionStreamRef.current.stop()
      }
    }
  }, [])

  // Setup face detection when video is ready
  useEffect(() => {
    if (videoRef.current && faceDetectionSupported && isActive) {
      faceDetectionStreamRef.current = new FaceDetectionStream(
        videoRef.current,
        (result) => setFaceDetection(result)
      )
      faceDetectionStreamRef.current.start(300)
    }

    return () => {
      if (faceDetectionStreamRef.current) {
        faceDetectionStreamRef.current.stop()
      }
    }
  }, [faceDetectionSupported, isActive])

  // Manual capture
  const handleManualCapture = useCallback(async () => {
    setIsCapturing(true)
    setShowFlash(true)

    const frames = await captureBurst()
    if (frames.length > 0) {
      const bestFrame = frames[0]
      setCapturedPreview(bestFrame.dataUrl)

      setTimeout(() => setShowFlash(false), 150)
      setTimeout(() => {
        onCapture(bestFrame)
      }, 500)
    } else {
      setIsCapturing(false)
      setShowFlash(false)
    }
  }, [captureBurst, onCapture])

  const tier = getQualityTier(qualityScore)

  // Get combined feedback from quality and face detection
  const getFeedback = (): string | null => {
    if (mainIssue) return mainIssue
    if (faceDetection && !faceDetection.isWellPositioned) {
      return faceDetection.positionFeedback
    }
    return null
  }

  const feedback = getFeedback()
  const isOptimal = qualityScore >= 70 && (!faceDetection || faceDetection.isWellPositioned)

  if (error) {
    return (
      <div className="text-center p-8 space-y-5">
        <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <p className="text-red-700 font-medium mb-2">{error}</p>
          <p className="text-[#1C4444]/60 text-sm">
            Please allow camera access in your browser settings, or upload a photo instead.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => startCamera('user')}
            className="w-full py-3 px-6 bg-[#1C4444] text-white rounded-lg font-medium tracking-wide hover:bg-[#1C4444]/90 transition-colors uppercase text-sm"
          >
            Try Again
          </button>
          {onUploadFallback && (
            <button
              onClick={onUploadFallback}
              className="w-full py-3 px-6 border-2 border-[#1C4444]/20 text-[#1C4444] rounded-lg font-medium tracking-wide hover:border-[#1C4444]/40 hover:bg-[#1C4444]/5 transition-colors uppercase text-sm"
            >
              Upload Photo Instead
            </button>
          )}
        </div>
        <p className="text-[#1C4444]/40 text-xs">
          Your photos are analyzed securely.<br />
          We respect your privacy.
        </p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Camera viewport */}
      <div className="relative aspect-square max-w-md mx-auto rounded-xl overflow-hidden bg-black">
        {/* Video feed */}
        <video
          ref={(el) => {
            videoRef.current = el
            setVideoRef(el)
          }}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
        />

        {/* Canvas for capture (hidden) */}
        <canvas
          ref={(el) => {
            canvasRef.current = el
            setCanvasRef(el)
          }}
          className="hidden"
        />

        {/* Capture preview overlay */}
        {capturedPreview && (
          <div className="absolute inset-0 z-30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={capturedPreview}
              alt="Captured"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Flash effect */}
        {showFlash && (
          <div className="absolute inset-0 bg-white z-40 animate-capture-flash" />
        )}

        {/* Face guide overlay */}
        {showGuide && !capturedPreview && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Outer glow ring */}
            <div
              className={cn(
                'absolute w-[72%] h-[82%] border rounded-[40%] transition-all duration-300',
                isOptimal ? 'border-[#D4AF37]/40' : 'border-white/20'
              )}
              style={{ transform: config.silhouetteTransform }}
            />
            {/* Main guide */}
            <div
              className={cn(
                'relative w-[70%] h-[80%] border-2 rounded-[40%] transition-all duration-300',
                isOptimal ? 'border-[#D4AF37]' : 'border-white/60'
              )}
              style={{ transform: config.silhouetteTransform }}
            >
              {/* Feature guides */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="absolute top-[35%] left-[15%] right-[15%] border-t border-dashed border-white/20" />
                <div className="absolute top-[35%] bottom-[35%] left-1/2 border-l border-dashed border-white/20" style={{ transform: 'translateX(-50%)' }} />
              </div>
            </div>
            {/* Scan line */}
            <div
              className={cn(
                'absolute w-[68%] h-0.5 bg-gradient-to-r from-transparent to-transparent animate-scan-line',
                isOptimal ? 'via-[#D4AF37]/70' : 'via-white/50'
              )}
              style={{ transform: config.silhouetteTransform }}
            />
          </div>
        )}

        {/* Corner brackets */}
        <div className="absolute inset-0 pointer-events-none">
          <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.6">
            <path d="M15 40 L15 20 L35 20" />
            <path d="M185 40 L185 20 L165 20" />
            <path d="M15 160 L15 180 L35 180" />
            <path d="M185 160 L185 180 L165 180" />
          </svg>
        </div>

        {/* Quality badge (top left) */}
        <div className="absolute top-4 left-4 z-20">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-sm transition-all duration-300"
            style={{
              backgroundColor: `${tier.color}20`,
              borderColor: tier.color,
              borderWidth: 1,
            }}
          >
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                qualityScore >= 70 ? 'animate-pulse' : ''
              )}
              style={{ backgroundColor: tier.color }}
            />
            <span
              className="text-xs font-medium"
              style={{ color: tier.color }}
            >
              {tier.tier}
            </span>
          </div>
        </div>

        {/* Auto-capture progress (top right) */}
        {autoCapture && autoCaptureProgress > 0 && (
          <div className="absolute top-4 right-4 z-20">
            <div className="relative w-10 h-10">
              {/* Background circle */}
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="2"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="#D4AF37"
                  strokeWidth="2"
                  strokeDasharray="100"
                  strokeDashoffset={100 - (autoCaptureProgress * 100)}
                  strokeLinecap="round"
                  className="transition-all duration-200"
                />
              </svg>
              {/* Camera icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* Guide text (top center) */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
          <span className="inline-flex items-center gap-2 bg-white/95 backdrop-blur-sm text-[#1C4444] text-xs px-5 py-2.5 rounded-full shadow-luxury tracking-wide">
            <div className={cn(
              'w-2 h-2 rounded-full',
              isOptimal ? 'bg-[#D4AF37] animate-pulse' : 'bg-[#1C4444]/40'
            )} />
            {config.guideText}
          </span>
        </div>

        {/* Feedback message */}
        {feedback && !capturedPreview && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20">
            <div className="flex items-center gap-2 px-4 py-2 bg-black/70 backdrop-blur-sm rounded-lg text-white animate-elegant-fade-in">
              <svg
                className="w-4 h-4 text-amber-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span className="text-sm">{feedback}</span>
            </div>
          </div>
        )}

        {/* Ready to capture indicator */}
        {isOptimal && !feedback && !capturedPreview && autoCapture && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20">
            <div className="flex items-center gap-2 px-4 py-2 bg-[#1C4444]/90 backdrop-blur-sm rounded-lg text-white animate-elegant-fade-in">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-sm">
                {isReadyForCapture ? 'Capturing...' : 'Hold steady...'}
              </span>
            </div>
          </div>
        )}

        {/* Camera controls */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
          <div className="flex items-center justify-center gap-6">
            {/* Cancel */}
            <button
              onClick={onCancel}
              disabled={isCapturing}
              className="w-14 h-14 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-all duration-300 backdrop-blur-sm disabled:opacity-50"
              aria-label="Cancel"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Capture button */}
            <button
              onClick={handleManualCapture}
              disabled={isCapturing}
              className={cn(
                'w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-luxury-lg disabled:opacity-50',
                isOptimal ? 'bg-white hover:scale-105' : 'bg-white/80'
              )}
              aria-label="Take photo"
            >
              <div className={cn(
                'w-16 h-16 rounded-full border-[3px] flex items-center justify-center transition-colors',
                isOptimal ? 'border-[#D4AF37]' : 'border-[#1C4444]'
              )}>
                <div className={cn(
                  'w-12 h-12 rounded-full transition-colors',
                  isOptimal ? 'bg-[#D4AF37]/20' : 'bg-[#1C4444]/10'
                )} />
              </div>
            </button>

            {/* Switch camera */}
            <button
              onClick={switchCamera}
              disabled={isCapturing}
              className="w-14 h-14 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-all duration-300 backdrop-blur-sm disabled:opacity-50"
              aria-label="Switch camera"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Auto-capture info */}
      {autoCapture && !capturedPreview && (
        <p className="text-center text-[#1C4444]/50 text-xs mt-4">
          Photo will be taken automatically when lighting is optimal
        </p>
      )}
    </div>
  )
}
