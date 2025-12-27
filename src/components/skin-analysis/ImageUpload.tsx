'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  onImageSelect: (file: File) => void
  isLoading?: boolean
}

type CaptureMode = 'select' | 'camera' | 'upload'

export default function ImageUpload({ onImageSelect, isLoading }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<CaptureMode>('select')
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')

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

  const validateFile = (file: File): boolean => {
    setError(null)

    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setError('Please upload a JPEG, PNG, or WebP image')
      return false
    }

    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      setError('Image must be less than 10MB')
      return false
    }

    return true
  }

  const handleFile = useCallback((file: File) => {
    if (!validateFile(file)) return

    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    onImageSelect(file)
  }, [onImageSelect])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }, [handleFile])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }, [handleFile])

  const clearPreview = useCallback(() => {
    setPreview(null)
    setError(null)
    setMode('select')
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }
  }, [cameraStream])

  const startCamera = useCallback(async () => {
    setCameraError(null)
    setMode('camera')

    try {
      // Stop any existing stream
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

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
    } catch (err) {
      console.error('Camera error:', err)
      setCameraError('Unable to access camera. Please check permissions or try uploading a photo instead.')
      setMode('select')
    }
  }, [facingMode, cameraStream])

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
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert to blob/file
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' })

        // Stop camera
        if (cameraStream) {
          cameraStream.getTracks().forEach(track => track.stop())
          setCameraStream(null)
        }

        // Set preview and trigger upload
        setPreview(canvas.toDataURL('image/jpeg'))
        onImageSelect(file)
        setMode('select')
      }
    }, 'image/jpeg', 0.9)
  }, [cameraStream, onImageSelect])

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }
    setMode('select')
  }, [cameraStream])

  // Preview state - show captured/uploaded image
  if (preview) {
    return (
      <div className="relative">
        <div className="relative aspect-square max-w-md mx-auto rounded-xl overflow-hidden border-2 border-[#1C4444]/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          {isLoading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-[#1C4444] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-[#1C4444] font-medium">Analyzing your skin...</p>
                <p className="text-[#1C4444]/60 text-sm mt-1">This may take 15-30 seconds</p>
              </div>
            </div>
          )}
        </div>
        {!isLoading && (
          <button
            onClick={clearPreview}
            className="absolute top-2 right-2 bg-white/90 hover:bg-white text-[#1C4444] p-2 rounded-full shadow-lg transition-colors"
            aria-label="Remove image"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    )
  }

  // Camera mode - show live camera feed
  if (mode === 'camera') {
    return (
      <div className="relative">
        <div className="relative aspect-square max-w-md mx-auto rounded-xl overflow-hidden bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
          />

          {/* Elegant woman's face silhouette overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg
              viewBox="0 0 200 280"
              className="w-[70%] h-[80%]"
              fill="none"
            >
              {/* Soft glow effect */}
              <defs>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                <linearGradient id="faceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
                  <stop offset="50%" stopColor="rgba(255,255,255,0.5)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.3)" />
                </linearGradient>
              </defs>

              {/* Woman's face silhouette - elegant and minimal */}
              <g filter="url(#glow)" stroke="url(#faceGradient)" strokeWidth="2.5" strokeLinecap="round">
                {/* Hair silhouette - flowing and feminine */}
                <path
                  d="M45 85
                     C35 95, 28 120, 30 150
                     C32 170, 35 185, 42 200"
                  opacity="0.4"
                />
                <path
                  d="M155 85
                     C165 95, 172 120, 170 150
                     C168 170, 165 185, 158 200"
                  opacity="0.4"
                />

                {/* Face outline - soft oval with defined jawline */}
                <path
                  d="M55 95
                     C45 110, 40 140, 42 165
                     C44 185, 55 210, 70 228
                     Q85 245, 100 250
                     Q115 245, 130 228
                     C145 210, 156 185, 158 165
                     C160 140, 155 110, 145 95"
                  strokeDasharray="0"
                  opacity="0.7"
                />

                {/* Forehead curve */}
                <path
                  d="M55 95
                     C60 70, 80 55, 100 52
                     C120 55, 140 70, 145 95"
                  opacity="0.5"
                />

                {/* Subtle eye level guide - dashed */}
                <line
                  x1="60" y1="120"
                  x2="85" y2="120"
                  strokeDasharray="3 3"
                  opacity="0.3"
                />
                <line
                  x1="115" y1="120"
                  x2="140" y2="120"
                  strokeDasharray="3 3"
                  opacity="0.3"
                />

                {/* Nose guide - very subtle */}
                <line
                  x1="100" y1="130"
                  x2="100" y2="165"
                  strokeDasharray="4 4"
                  opacity="0.2"
                />

                {/* Lips guide - gentle smile curve */}
                <path
                  d="M80 185 Q100 195 120 185"
                  strokeDasharray="4 4"
                  opacity="0.25"
                />
              </g>

              {/* Corner brackets for framing */}
              <g stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.6">
                {/* Top left */}
                <path d="M25 50 L25 35 L40 35" />
                {/* Top right */}
                <path d="M175 50 L175 35 L160 35" />
                {/* Bottom left */}
                <path d="M25 255 L25 270 L40 270" />
                {/* Bottom right */}
                <path d="M175 255 L175 270 L160 270" />
              </g>
            </svg>
          </div>

          {/* Position guide text with icon */}
          <div className="absolute top-4 left-0 right-0 text-center">
            <span className="inline-flex items-center gap-2 bg-black/60 backdrop-blur-sm text-white text-xs px-4 py-2 rounded-full shadow-lg">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Position your face in the frame
            </span>
          </div>

          {/* Camera controls overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
            <div className="flex items-center justify-center gap-4">
              {/* Cancel button */}
              <button
                onClick={stopCamera}
                className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
                aria-label="Cancel"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Capture button */}
              <button
                onClick={capturePhoto}
                className="w-16 h-16 rounded-full bg-white hover:bg-white/90 flex items-center justify-center transition-colors shadow-lg"
                aria-label="Take photo"
              >
                <div className="w-12 h-12 rounded-full border-4 border-[#1C4444]" />
              </button>

              {/* Switch camera button */}
              <button
                onClick={switchCamera}
                className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
                aria-label="Switch camera"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Hidden canvas for capturing */}
        <canvas ref={canvasRef} className="hidden" />

        <p className="text-center text-[#1C4444]/60 text-sm mt-4">
          Position your face in the outline and tap the button to capture
        </p>
      </div>
    )
  }

  // Selection mode - choose camera or upload
  return (
    <div className="space-y-4">
      {/* Camera error message */}
      {cameraError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{cameraError}</p>
        </div>
      )}

      {/* Two options: Camera and Upload */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Take Photo option */}
        <button
          onClick={startCamera}
          className="group relative border-2 border-dashed border-[#1C4444]/30 hover:border-[#1C4444] rounded-xl p-6 md:p-8 transition-all hover:bg-[#1C4444]/5"
        >
          <div className="text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-[#1C4444]/10 group-hover:bg-[#1C4444]/20 flex items-center justify-center transition-colors">
              <svg className="w-7 h-7 text-[#1C4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
              </svg>
            </div>
            <h3 className="text-base font-medium text-[#1C4444] mb-1">
              Take a Photo
            </h3>
            <p className="text-[#1C4444]/60 text-sm">
              Use your camera
            </p>
          </div>
        </button>

        {/* Upload option */}
        <div
          className={cn(
            'group relative border-2 border-dashed rounded-xl p-6 md:p-8 transition-all cursor-pointer',
            dragActive ? 'border-[#1C4444] bg-[#1C4444]/5' : 'border-[#1C4444]/30 hover:border-[#1C4444] hover:bg-[#1C4444]/5',
            error && 'border-red-500'
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleChange}
            className="hidden"
          />

          <div className="text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-[#1C4444]/10 group-hover:bg-[#1C4444]/20 flex items-center justify-center transition-colors">
              <svg className="w-7 h-7 text-[#1C4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <h3 className="text-base font-medium text-[#1C4444] mb-1">
              Upload a Photo
            </h3>
            <p className="text-[#1C4444]/60 text-sm">
              Choose from gallery
            </p>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-center text-red-600 text-sm font-medium">{error}</p>
      )}

      <p className="text-center text-[#1C4444]/50 text-xs">
        JPEG, PNG, or WebP up to 10MB
      </p>
    </div>
  )
}
