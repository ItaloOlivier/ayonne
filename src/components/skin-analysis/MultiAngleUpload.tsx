'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import LiveCameraCapture from './LiveCameraCapture'
import { CaptureFrame } from '@/hooks/useLiveCamera'
import { FEATURES } from '@/lib/features'

export interface CapturedImage {
  file: File
  preview: string
  angle: 'front' | 'left' | 'right'
}

interface MultiAngleUploadProps {
  onImagesComplete: (images: CapturedImage[]) => void
  onCancel?: () => void
  isLoading?: boolean
}

type CaptureStep = 'front' | 'left' | 'right' | 'review'

interface AngleConfig {
  id: CaptureStep
  label: string
  instruction: string
  tips: string[]
  silhouetteTransform: string
  guideText: string
}

const ANGLE_CONFIGS: Record<Exclude<CaptureStep, 'review'>, AngleConfig> = {
  front: {
    id: 'front',
    label: 'Front View',
    instruction: 'Look directly at the camera',
    tips: [
      'Center your face in the frame',
      'Relax your expression naturally',
      'Ensure soft, even lighting',
    ],
    silhouetteTransform: '',
    guideText: 'Center your face',
  },
  left: {
    id: 'left',
    label: 'Left Profile',
    instruction: 'Gently turn to show your left side',
    tips: [
      'Turn your head 45° to the right',
      'Keep your chin parallel to the floor',
      'Let your natural beauty shine through',
    ],
    silhouetteTransform: 'rotateY(35deg)',
    guideText: 'Show your left side',
  },
  right: {
    id: 'right',
    label: 'Right Profile',
    instruction: 'Gently turn to show your right side',
    tips: [
      'Turn your head 45° to the left',
      'Keep your chin parallel to the floor',
      'Almost there — one more angle',
    ],
    silhouetteTransform: 'rotateY(-35deg)',
    guideText: 'Show your right side',
  },
}

const STEPS_ORDER: Exclude<CaptureStep, 'review'>[] = ['front', 'left', 'right']

export default function MultiAngleUpload({
  onImagesComplete,
  onCancel,
  isLoading,
}: MultiAngleUploadProps) {
  const [currentStep, setCurrentStep] = useState<CaptureStep>('front')
  const [capturedImages, setCapturedImages] = useState<Map<string, CapturedImage>>(new Map())
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [countdown, setCountdown] = useState<number | null>(null)
  const [useUploadMode, setUseUploadMode] = useState(false)
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false)
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unknown'>('unknown')

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [cameraStream])

  // Check camera permission state
  const checkCameraPermission = useCallback(async (): Promise<'prompt' | 'granted' | 'denied'> => {
    try {
      // Try the Permissions API first (not available on all browsers)
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({ name: 'camera' as PermissionName })
        return result.state as 'prompt' | 'granted' | 'denied'
      }
    } catch {
      // Permissions API not supported or error - that's okay
    }
    // Default to 'prompt' if we can't determine the state
    return 'prompt'
  }, [])

  // Handle the initial camera button click - show permission prompt
  const handleCameraButtonClick = useCallback(async () => {
    const permission = await checkCameraPermission()
    setPermissionState(permission)

    if (permission === 'granted') {
      // Already have permission, start camera directly
      startCameraDirectly()
    } else {
      // Show permission explanation prompt
      setShowPermissionPrompt(true)
    }
  }, [checkCameraPermission])

  // Start camera directly (after permission granted or user clicks "Allow Camera")
  const startCameraDirectly = useCallback(async () => {
    setShowPermissionPrompt(false)
    setCameraError(null)
    setIsCameraActive(true)

    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop())
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 1280 },
        },
        audio: false,
      })

      setCameraStream(stream)
      setPermissionState('granted')

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
    } catch (err) {
      console.error('Camera error:', err)
      setPermissionState('denied')
      setCameraError('Unable to access camera. Please check permissions.')
      setIsCameraActive(false)
    }
  }, [facingMode, cameraStream])

  // Alias for compatibility with retakePhoto
  const startCamera = startCameraDirectly

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }
    setIsCameraActive(false)
  }, [cameraStream])

  const switchCamera = useCallback(async () => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(newFacingMode)

    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: newFacingMode,
          width: { ideal: 1280 },
          height: { ideal: 1280 },
        },
        audio: false,
      })

      setCameraStream(stream)

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
    } catch (err) {
      console.error('Camera switch error:', err)
    }
  }, [facingMode, cameraStream])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || currentStep === 'review') return

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

        const newImage: CapturedImage = {
          file,
          preview,
          angle: currentStep as 'front' | 'left' | 'right',
        }

        setCapturedImages(prev => {
          const newMap = new Map(prev)
          newMap.set(currentStep, newImage)
          return newMap
        })

        // Move to next step
        const currentIndex = STEPS_ORDER.indexOf(currentStep as Exclude<CaptureStep, 'review'>)
        if (currentIndex < STEPS_ORDER.length - 1) {
          setCurrentStep(STEPS_ORDER[currentIndex + 1])
        } else {
          // All photos captured, go to review
          setCurrentStep('review')
          stopCamera()
        }
      }
    }, 'image/jpeg', 0.9)
  }, [currentStep, facingMode, stopCamera])

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

  const retakePhoto = useCallback((angle: Exclude<CaptureStep, 'review'>) => {
    setCapturedImages(prev => {
      const newMap = new Map(prev)
      newMap.delete(angle)
      return newMap
    })
    setCurrentStep(angle)
    startCamera()
  }, [startCamera])

  const handleComplete = useCallback(() => {
    const images = Array.from(capturedImages.values())
    if (images.length === 3) {
      onImagesComplete(images)
    }
  }, [capturedImages, onImagesComplete])

  const handleCancel = useCallback(() => {
    stopCamera()
    onCancel?.()
  }, [stopCamera, onCancel])

  // Handle capture from LiveCameraCapture (smart auto-capture mode)
  const handleLiveCameraCapture = useCallback((frame: CaptureFrame) => {
    if (currentStep === 'review') return

    const file = new File([frame.blob], `skin-analysis-${currentStep}.jpg`, { type: 'image/jpeg' })

    const newImage: CapturedImage = {
      file,
      preview: frame.dataUrl,
      angle: currentStep as 'front' | 'left' | 'right',
    }

    setCapturedImages(prev => {
      const newMap = new Map(prev)
      newMap.set(currentStep, newImage)
      return newMap
    })

    // Move to next step
    const currentIndex = STEPS_ORDER.indexOf(currentStep as Exclude<CaptureStep, 'review'>)
    if (currentIndex < STEPS_ORDER.length - 1) {
      setCurrentStep(STEPS_ORDER[currentIndex + 1])
    } else {
      // All photos captured, go to review
      setCurrentStep('review')
      stopCamera()
    }
  }, [currentStep, stopCamera])

  const handleLiveCameraCancel = useCallback(() => {
    setIsCameraActive(false)
    stopCamera()
  }, [stopCamera])

  // Switch to upload mode when camera fails
  const handleUploadFallback = useCallback(() => {
    setIsCameraActive(false)
    stopCamera()
    setUseUploadMode(true)
  }, [stopCamera])

  // Handle file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || currentStep === 'review') return

    // Create preview from file
    const reader = new FileReader()
    reader.onload = (e) => {
      const preview = e.target?.result as string

      const newImage: CapturedImage = {
        file,
        preview,
        angle: currentStep as 'front' | 'left' | 'right',
      }

      setCapturedImages(prev => {
        const newMap = new Map(prev)
        newMap.set(currentStep, newImage)
        return newMap
      })

      // Move to next step
      const currentIndex = STEPS_ORDER.indexOf(currentStep as Exclude<CaptureStep, 'review'>)
      if (currentIndex < STEPS_ORDER.length - 1) {
        setCurrentStep(STEPS_ORDER[currentIndex + 1])
      } else {
        // All photos captured, go to review
        setCurrentStep('review')
      }
    }
    reader.readAsDataURL(file)

    // Reset the input so the same file can be selected again
    event.target.value = ''
  }, [currentStep])

  const triggerFileUpload = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const currentConfig = currentStep !== 'review' ? ANGLE_CONFIGS[currentStep] : null
  const completedCount = capturedImages.size
  const progress = (completedCount / 3) * 100

  // Review screen
  if (currentStep === 'review') {
    return (
      <div className="space-y-8 animate-elegant-fade-in">
        {/* Success header with celebration */}
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#C9A227] flex items-center justify-center shadow-luxury animate-bounce-in">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-light text-[#1C4444] mb-2 tracking-wide">Beautifully Captured</h3>
          <p className="text-[#1C4444]/60 text-sm">
            Your photos are ready for our advanced AI analysis
          </p>
        </div>

        {/* Photo grid with luxury styling */}
        <div className="grid grid-cols-3 gap-4">
          {STEPS_ORDER.map((angle, index) => {
            const image = capturedImages.get(angle)
            const config = ANGLE_CONFIGS[angle]
            return (
              <div
                key={angle}
                className="relative animate-elegant-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="aspect-square rounded-xl overflow-hidden shadow-luxury border border-[#1C4444]/10 group">
                  {image ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image.preview}
                        alt={config.label}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {/* Elegant overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1C4444]/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <button
                        onClick={() => retakePhoto(angle)}
                        disabled={isLoading}
                        className="absolute bottom-2 right-2 bg-white/95 hover:bg-white text-[#1C4444] p-2 rounded-full shadow-luxury opacity-0 group-hover:opacity-100 transition-all duration-300 disabled:opacity-50"
                        aria-label={`Retake ${config.label}`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                      {/* Gold checkmark badge */}
                      <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#C9A227] flex items-center justify-center shadow-sm">
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#1C4444]/5">
                      <span className="text-[#1C4444]/30 text-xs">Missing</span>
                    </div>
                  )}
                </div>
                <p className="text-center text-[#1C4444]/70 text-xs mt-2 font-medium tracking-wide">{config.label}</p>
              </div>
            )
          })}
        </div>

        {/* Premium action buttons */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleComplete}
            disabled={isLoading || capturedImages.size < 3}
            className="w-full btn-primary btn-luxury py-4 text-sm tracking-widest disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Preparing Analysis...
              </span>
            ) : (
              'Begin My Skin Analysis'
            )}
          </button>
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="w-full py-3 text-[#1C4444]/60 hover:text-[#1C4444] text-sm tracking-wide transition-colors disabled:opacity-50"
          >
            Start Over
          </button>
        </div>

        <p className="text-center text-[#1C4444]/40 text-xs tracking-wide">
          Our dermatologist-grade AI will analyze all three perspectives
        </p>
      </div>
    )
  }

  // Camera capture screen
  return (
    <div className="space-y-6">
      {/* Elegant progress stepper */}
      <div className="space-y-4">
        {/* Step label */}
        <div className="text-center">
          <p className="text-[#1C4444]/50 text-xs tracking-widest uppercase mb-1">
            Step {STEPS_ORDER.indexOf(currentStep as Exclude<CaptureStep, 'review'>) + 1} of 3
          </p>
          <h3 className="text-xl font-light text-[#1C4444] tracking-wide">{currentConfig?.label}</h3>
        </div>

        {/* Premium step indicators */}
        <div className="flex items-center justify-center gap-3">
          {STEPS_ORDER.map((step, index) => {
            const isCompleted = capturedImages.has(step)
            const isCurrent = step === currentStep
            const isPending = !isCompleted && !isCurrent

            return (
              <div key={step} className="flex items-center">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 stepper-dot',
                    isCompleted && 'stepper-dot-complete',
                    isCurrent && 'bg-[#1C4444] text-white stepper-dot-active',
                    isPending && 'bg-[#1C4444]/10 text-[#1C4444]/40'
                  )}
                >
                  {isCompleted ? (
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                {/* Connector line */}
                {index < STEPS_ORDER.length - 1 && (
                  <div
                    className={cn(
                      'w-8 h-0.5 mx-1 transition-all duration-300',
                      capturedImages.has(step) ? 'bg-[#D4AF37]' : 'bg-[#1C4444]/10'
                    )}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Camera error */}
      {cameraError && (
        <div className="text-center p-8 space-y-5">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="text-red-700 font-medium mb-2">{cameraError}</p>
            <p className="text-[#1C4444]/60 text-sm">
              Please allow camera access in your browser settings, or upload a photo instead.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                setCameraError(null)
                startCamera()
              }}
              className="w-full py-3 px-6 bg-[#1C4444] text-white rounded-lg font-medium tracking-wide hover:bg-[#1C4444]/90 transition-colors uppercase text-sm"
            >
              Try Again
            </button>
            <button
              onClick={() => {
                setCameraError(null)
                setUseUploadMode(true)
              }}
              className="w-full py-3 px-6 border-2 border-[#1C4444]/20 text-[#1C4444] rounded-lg font-medium tracking-wide hover:border-[#1C4444]/40 hover:bg-[#1C4444]/5 transition-colors uppercase text-sm"
            >
              Upload Photo Instead
            </button>
          </div>
          <p className="text-[#1C4444]/40 text-xs">
            Your photos are analyzed securely.<br />
            We respect your privacy.
          </p>
        </div>
      )}

      {/* Hidden file input for upload mode */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Upload mode UI */}
      {useUploadMode && !isCameraActive ? (
        <div className="text-center space-y-6 animate-elegant-fade-in">
          <div className="card-luxury p-8 space-y-6">
            {/* Upload icon */}
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#1C4444]/10 to-[#1C4444]/5 flex items-center justify-center">
              <svg className="w-10 h-10 text-[#1C4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>

            {/* Instruction */}
            <div>
              <p className="text-lg text-[#1C4444] mb-2 tracking-wide">
                Upload your {currentConfig?.label.toLowerCase()}
              </p>
              <p className="text-[#1C4444]/60 text-sm">
                {currentConfig?.instruction}
              </p>
            </div>

            {/* Tips */}
            <div className="bg-[#F4EBE7]/50 rounded-lg p-4">
              <ul className="space-y-3">
                {currentConfig?.tips.map((tip, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 text-[#1C4444]/70 text-sm"
                  >
                    <div className="w-5 h-5 rounded-full bg-[#1C4444]/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-[#1C4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <button
            onClick={triggerFileUpload}
            className="btn-primary btn-luxury w-full py-4 text-sm tracking-widest"
          >
            Choose Photo
          </button>

          <button
            onClick={() => setUseUploadMode(false)}
            className="text-[#1C4444]/70 hover:text-[#1C4444] text-sm tracking-wide transition-colors"
          >
            Try Camera Again
          </button>

          <button
            onClick={handleCancel}
            className="text-[#1C4444]/50 hover:text-[#1C4444] text-sm tracking-wide transition-colors"
          >
            Cancel
          </button>

          {/* Progress thumbnails */}
          {capturedImages.size > 0 && (
            <div className="flex justify-center gap-3 pt-4">
              {STEPS_ORDER.map((angle, index) => {
                const image = capturedImages.get(angle)
                const isCurrent = angle === currentStep
                return (
                  <div
                    key={angle}
                    className={cn(
                      'relative w-14 h-14 rounded-xl overflow-hidden transition-all duration-300',
                      image ? 'shadow-luxury' : '',
                      isCurrent && !image && 'ring-2 ring-[#D4AF37] ring-offset-2'
                    )}
                  >
                    {image ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={image.preview}
                          alt={ANGLE_CONFIGS[angle].label}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#C9A227] flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </>
                    ) : (
                      <div className={cn(
                        'w-full h-full flex items-center justify-center transition-colors',
                        isCurrent ? 'bg-[#D4AF37]/20' : 'bg-[#1C4444]/5'
                      )}>
                        <span className={cn(
                          'text-xs font-medium',
                          isCurrent ? 'text-[#D4AF37]' : 'text-[#1C4444]/30'
                        )}>
                          {index + 1}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : !isCameraActive && !cameraError && !useUploadMode ? (
        /* Start camera button */
        <div className="text-center space-y-6 animate-elegant-fade-in">
          <div className="card-luxury p-8 space-y-6">
            {/* Elegant camera icon */}
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#1C4444]/10 to-[#1C4444]/5 flex items-center justify-center animate-gentle-glow">
              <svg className="w-10 h-10 text-[#1C4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
              </svg>
            </div>

            {/* Instruction */}
            <div>
              <p className="text-lg text-[#1C4444] mb-2 tracking-wide">{currentConfig?.instruction}</p>
            </div>

            {/* Tips with elegant styling */}
            <div className="bg-[#F4EBE7]/50 rounded-lg p-4">
              <ul className="space-y-3">
                {currentConfig?.tips.map((tip, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 text-[#1C4444]/70 text-sm animate-fade-in"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="w-5 h-5 rounded-full bg-[#1C4444]/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-[#1C4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <button
            onClick={handleCameraButtonClick}
            className="btn-primary btn-luxury w-full py-4 text-sm tracking-widest"
          >
            Open Camera
          </button>

          <button
            onClick={() => setUseUploadMode(true)}
            className="text-[#1C4444]/70 hover:text-[#1C4444] text-sm tracking-wide transition-colors"
          >
            Upload Photo Instead
          </button>

          <button
            onClick={handleCancel}
            className="text-[#1C4444]/50 hover:text-[#1C4444] text-sm tracking-wide transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : null}

      {/* Camera Permission Request Modal */}
      {showPermissionPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm mx-4 overflow-hidden animate-elegant-fade-in">
            {/* Header with camera icon */}
            <div className="bg-gradient-to-br from-[#1C4444] to-[#1C4444]/90 p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
              </div>
              <h3 className="text-white text-xl font-light tracking-wide">Camera Access Needed</h3>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-[#1C4444]/80 text-center text-sm leading-relaxed">
                To analyze your skin accurately, we need to capture photos of your face from multiple angles.
              </p>

              {permissionState === 'denied' ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-amber-800 text-sm text-center">
                    <strong>Camera access was denied.</strong> Please enable camera permissions in your browser settings, then try again.
                  </p>
                </div>
              ) : (
                <div className="bg-[#F4EBE7]/50 rounded-lg p-4 space-y-2">
                  <p className="text-[#1C4444]/70 text-xs text-center">
                    When prompted, tap <strong>&quot;Allow&quot;</strong> to enable camera access.
                  </p>
                </div>
              )}

              {/* Privacy note */}
              <div className="flex items-center justify-center gap-2 text-[#1C4444]/50 text-xs">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Your photos are analyzed securely and privately</span>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 pt-0 space-y-3">
              <button
                onClick={startCameraDirectly}
                className="w-full py-3 px-6 bg-[#1C4444] text-white rounded-lg font-medium tracking-wide hover:bg-[#1C4444]/90 transition-colors uppercase text-sm"
              >
                {permissionState === 'denied' ? 'Try Again' : 'Allow Camera Access'}
              </button>
              <button
                onClick={() => {
                  setShowPermissionPrompt(false)
                  setUseUploadMode(true)
                }}
                className="w-full py-3 px-6 border-2 border-[#1C4444]/20 text-[#1C4444] rounded-lg font-medium tracking-wide hover:border-[#1C4444]/40 hover:bg-[#1C4444]/5 transition-colors uppercase text-sm"
              >
                Upload Photo Instead
              </button>
              <button
                onClick={() => setShowPermissionPrompt(false)}
                className="w-full py-2 text-[#1C4444]/50 hover:text-[#1C4444] text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isCameraActive && (
        <div className="relative">
          {/* Smart Auto-Capture Mode (with quality monitoring) */}
          {FEATURES.SMART_AUTO_CAPTURE ? (
            <>
              <LiveCameraCapture
                angle={currentStep as 'front' | 'left' | 'right'}
                onCapture={handleLiveCameraCapture}
                onCancel={handleLiveCameraCancel}
                onUploadFallback={handleUploadFallback}
                autoCapture={true}
                showGuide={true}
              />

              {/* Progress thumbnails for smart mode */}
              {capturedImages.size > 0 && (
                <div className="flex justify-center gap-3 mt-6">
                  {STEPS_ORDER.map((angle, index) => {
                    const image = capturedImages.get(angle)
                    const isCurrent = angle === currentStep
                    return (
                      <div
                        key={angle}
                        className={cn(
                          'relative w-14 h-14 rounded-xl overflow-hidden transition-all duration-300',
                          image ? 'shadow-luxury' : '',
                          isCurrent && !image && 'ring-2 ring-[#D4AF37] ring-offset-2'
                        )}
                      >
                        {image ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={image.preview}
                              alt={ANGLE_CONFIGS[angle].label}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#C9A227] flex items-center justify-center">
                              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </>
                        ) : (
                          <div className={cn(
                            'w-full h-full flex items-center justify-center transition-colors',
                            isCurrent ? 'bg-[#D4AF37]/20' : 'bg-[#1C4444]/5'
                          )}>
                            <span className={cn(
                              'text-xs font-medium',
                              isCurrent ? 'text-[#D4AF37]' : 'text-[#1C4444]/30'
                            )}>
                              {index + 1}
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          ) : (
            /* Fallback: Basic Camera Mode (manual capture) */
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
                    style={{ transform: currentConfig?.silhouetteTransform || '' }}
                  />
                  {/* Main guide outline */}
                  <div
                    className="relative w-[70%] h-[80%] border-2 border-white/60 rounded-[40%] transition-transform duration-300"
                    style={{ transform: currentConfig?.silhouetteTransform || '' }}
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
                    style={{ transform: currentConfig?.silhouetteTransform || '' }}
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
                    {currentConfig?.guideText}
                  </span>
                </div>

                {/* Premium camera controls */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
                  <div className="flex items-center justify-center gap-6">
                    {/* Cancel */}
                    <button
                      onClick={handleCancel}
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
                      onClick={switchCamera}
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
              {capturedImages.size > 0 && (
                <div className="flex justify-center gap-3 mt-6">
                  {STEPS_ORDER.map((angle, index) => {
                    const image = capturedImages.get(angle)
                    const isCurrent = angle === currentStep
                    return (
                      <div
                        key={angle}
                        className={cn(
                          'relative w-14 h-14 rounded-xl overflow-hidden transition-all duration-300',
                          image ? 'shadow-luxury' : '',
                          isCurrent && !image && 'ring-2 ring-[#1C4444] ring-offset-2'
                        )}
                      >
                        {image ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={image.preview}
                              alt={ANGLE_CONFIGS[angle].label}
                              className="w-full h-full object-cover"
                            />
                            {/* Gold checkmark */}
                            <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#C9A227] flex items-center justify-center">
                              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </>
                        ) : (
                          <div className={cn(
                            'w-full h-full flex items-center justify-center transition-colors',
                            isCurrent ? 'bg-[#1C4444]/10' : 'bg-[#1C4444]/5'
                          )}>
                            <span className={cn(
                              'text-xs font-medium',
                              isCurrent ? 'text-[#1C4444]' : 'text-[#1C4444]/30'
                            )}>
                              {index + 1}
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
