'use client'

import { useRef, useCallback, useState, useEffect } from 'react'
import { CapturedImage, CaptureStep, AngleConfig, STEPS_ORDER } from './types'
import ProgressThumbnails from './ProgressThumbnails'

interface ManualCameraCaptureProps {
  currentStep: Exclude<CaptureStep, 'review'>
  currentConfig: AngleConfig
  capturedImages: Map<string, CapturedImage>
  facingMode: 'user' | 'environment'
  onCapture: (image: CapturedImage) => void
  onSwitchCamera: () => void
  onCancel: () => void
}

export default function ManualCameraCapture({
  currentStep,
  currentConfig,
  capturedImages,
  facingMode,
  onCapture,
  onSwitchCamera,
  onCancel,
}: ManualCameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)

  // Start camera on mount
  useEffect(() => {
    let mounted = true

    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facingMode,
            width: { ideal: 1280 },
            height: { ideal: 1280 },
          },
          audio: false,
        })

        if (mounted && videoRef.current) {
          videoRef.current.srcObject = mediaStream
          videoRef.current.play()
          setStream(mediaStream)
        }
      } catch (err) {
        console.error('Camera error:', err)
      }
    }

    startCamera()

    return () => {
      mounted = false
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [facingMode])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [stream])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Mirror the image for selfie camera
    if (facingMode === 'user') {
      context.translate(canvas.width, 0)
      context.scale(-1, 1)
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `skin-analysis-${currentStep}.jpg`, { type: 'image/jpeg' })
        const preview = canvas.toDataURL('image/jpeg')

        onCapture({
          file,
          preview,
          angle: currentStep,
        })
      }
    }, 'image/jpeg', 0.9)
  }, [currentStep, facingMode, onCapture])

  const captureWithCountdown = useCallback(() => {
    setCountdown(3)

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer)
          if (prev === 1) {
            capturePhoto()
          }
          return null
        }
        return prev - 1
      })
    }, 1000)
  }, [capturePhoto])

  return (
    <>
      {/* Camera viewfinder */}
      <div className="relative aspect-square max-w-md mx-auto rounded-xl overflow-hidden bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
        />

        {/* Face guide overlay - Enhanced with face silhouette */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Outer glow ring */}
          <div
            className="absolute w-[72%] h-[82%] border border-white/20 rounded-[40%] transition-transform duration-300"
            style={{ transform: currentConfig.silhouetteTransform || '' }}
          />
          {/* Main guide outline */}
          <div
            className="relative w-[70%] h-[80%] border-2 border-white/60 rounded-[40%] transition-transform duration-300"
            style={{ transform: currentConfig.silhouetteTransform || '' }}
          >
            {/* Face feature guides (subtle) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {/* Eye level line */}
              <div className="absolute top-[35%] left-[15%] right-[15%] border-t border-dashed border-white/20" />
              {/* Nose line */}
              <div className="absolute top-[35%] bottom-[35%] left-1/2 border-l border-dashed border-white/20" style={{ transform: 'translateX(-50%)' }} />
            </div>
          </div>
          {/* Animated scan line */}
          <div
            className="absolute w-[68%] h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent animate-scan-line"
            style={{ transform: currentConfig.silhouetteTransform || '' }}
          />
        </div>

        {/* Corner brackets */}
        <div className="absolute inset-0 pointer-events-none">
          <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.6">
            <path d="M15 40 L15 20 L35 20" />
            <path d="M185 40 L185 20 L165 20" />
            <path d="M15 160 L15 180 L35 180" />
            <path d="M185 160 L185 180 L165 180" />
          </svg>
        </div>

        {/* Elegant countdown overlay */}
        {countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="relative">
              {/* Animated ring */}
              <div className="absolute inset-0 w-32 h-32 -m-4 rounded-full border-4 border-white/30 animate-pulse-ring" />
              {/* Countdown number */}
              <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center animate-countdown-pulse">
                <span className="text-white text-5xl font-light">{countdown}</span>
              </div>
            </div>
          </div>
        )}

        {/* Elegant guide text */}
        <div className="absolute top-4 left-0 right-0 text-center">
          <span className="inline-flex items-center gap-2 bg-white/95 backdrop-blur-sm text-[#1C4444] text-xs px-5 py-2.5 rounded-full shadow-luxury tracking-wide">
            <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
            {currentConfig.guideText}
          </span>
        </div>

        {/* Premium camera controls */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
          <div className="flex items-center justify-center gap-6">
            {/* Cancel */}
            <button
              onClick={onCancel}
              className="w-14 h-14 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-all duration-300 backdrop-blur-sm"
              aria-label="Cancel"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Premium capture button */}
            <button
              onClick={captureWithCountdown}
              disabled={countdown !== null}
              className="w-20 h-20 rounded-full bg-white hover:scale-105 flex items-center justify-center transition-all duration-300 shadow-luxury-lg disabled:opacity-50 disabled:hover:scale-100"
              aria-label="Take photo"
            >
              <div className="w-16 h-16 rounded-full border-[3px] border-[#1C4444] flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-[#1C4444]/10" />
              </div>
            </button>

            {/* Switch camera */}
            <button
              onClick={onSwitchCamera}
              className="w-14 h-14 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-all duration-300 backdrop-blur-sm"
              aria-label="Switch camera"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Hidden canvas for capturing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Elegant thumbnails of captured photos */}
      <div className="mt-6">
        <ProgressThumbnails
          capturedImages={capturedImages}
          currentStep={currentStep}
          useGoldRing={false}
        />
      </div>
    </>
  )
}
