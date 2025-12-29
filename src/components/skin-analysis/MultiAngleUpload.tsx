'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import LiveCameraCapture from './LiveCameraCapture'
import { CaptureFrame } from '@/hooks/useLiveCamera'
import { FEATURES } from '@/lib/features'
import {
  CapturedImage,
  CaptureStep,
  ANGLE_CONFIGS,
  STEPS_ORDER,
  ReviewScreen,
  CaptureStepIndicator,
  CameraErrorScreen,
  UploadModeUI,
  StartCameraUI,
  ManualCameraCapture,
  ProgressThumbnails,
} from './multi-angle'

// Re-export types for backwards compatibility
export type { CapturedImage } from './multi-angle'

interface MultiAngleUploadProps {
  onImagesComplete: (images: CapturedImage[]) => void
  onCancel?: () => void
  isLoading?: boolean
}

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
  const [useUploadMode, setUseUploadMode] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [cameraStream])

  const startCamera = useCallback(async () => {
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
    } catch (err) {
      console.error('Camera error:', err)
      setCameraError('Unable to access camera. Please check permissions.')
      setIsCameraActive(false)
    }
  }, [facingMode, cameraStream])

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
    } catch (err) {
      console.error('Camera switch error:', err)
    }
  }, [facingMode, cameraStream])

  // Move to next step after capturing
  const advanceToNextStep = useCallback(() => {
    const currentIndex = STEPS_ORDER.indexOf(currentStep as Exclude<CaptureStep, 'review'>)
    if (currentIndex < STEPS_ORDER.length - 1) {
      setCurrentStep(STEPS_ORDER[currentIndex + 1])
    } else {
      setCurrentStep('review')
      stopCamera()
    }
  }, [currentStep, stopCamera])

  // Handle capture from ManualCameraCapture
  const handleManualCapture = useCallback((image: CapturedImage) => {
    setCapturedImages(prev => {
      const newMap = new Map(prev)
      newMap.set(image.angle, image)
      return newMap
    })
    advanceToNextStep()
  }, [advanceToNextStep])

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

    advanceToNextStep()
  }, [currentStep, advanceToNextStep])

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

      advanceToNextStep()
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }, [currentStep, advanceToNextStep])

  const triggerFileUpload = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

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

  const currentConfig = currentStep !== 'review' ? ANGLE_CONFIGS[currentStep] : null

  // Review screen
  if (currentStep === 'review') {
    return (
      <ReviewScreen
        capturedImages={capturedImages}
        isLoading={isLoading}
        onRetake={retakePhoto}
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    )
  }

  // Camera capture screen
  return (
    <div className="space-y-6">
      {/* Progress stepper */}
      <CaptureStepIndicator
        currentStep={currentStep}
        currentConfig={currentConfig!}
        capturedImages={capturedImages}
      />

      {/* Camera error */}
      {cameraError && (
        <CameraErrorScreen
          error={cameraError}
          onRetry={() => {
            setCameraError(null)
            startCamera()
          }}
          onUploadFallback={() => {
            setCameraError(null)
            setUseUploadMode(true)
          }}
        />
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
        <UploadModeUI
          currentConfig={currentConfig!}
          capturedImages={capturedImages}
          currentStep={currentStep}
          onUploadClick={triggerFileUpload}
          onTryCameraAgain={() => setUseUploadMode(false)}
          onCancel={handleCancel}
        />
      ) : !isCameraActive && !cameraError ? (
        /* Start camera button */
        <StartCameraUI
          currentConfig={currentConfig!}
          onStartCamera={startCamera}
          onCancel={handleCancel}
        />
      ) : isCameraActive && (
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
              <div className="mt-6">
                <ProgressThumbnails
                  capturedImages={capturedImages}
                  currentStep={currentStep}
                  useGoldRing={true}
                />
              </div>
            </>
          ) : (
            /* Fallback: Basic Camera Mode (manual capture) */
            <ManualCameraCapture
              currentStep={currentStep}
              currentConfig={currentConfig!}
              capturedImages={capturedImages}
              facingMode={facingMode}
              onCapture={handleManualCapture}
              onSwitchCamera={switchCamera}
              onCancel={handleCancel}
            />
          )}
        </div>
      )}
    </div>
  )
}
