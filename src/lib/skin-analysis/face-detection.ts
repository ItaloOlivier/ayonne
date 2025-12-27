/**
 * Face Detection Utilities
 *
 * Uses the browser's FaceDetector API when available,
 * with a fallback to basic face position estimation.
 */

export interface FaceDetectionResult {
  detected: boolean
  confidence: number
  boundingBox?: {
    x: number
    y: number
    width: number
    height: number
  }
  isWellPositioned: boolean
  positionFeedback: string | null
  landmarks?: {
    leftEye?: { x: number; y: number }
    rightEye?: { x: number; y: number }
    nose?: { x: number; y: number }
    mouth?: { x: number; y: number }
  }
}

// Check if FaceDetector API is available
const isFaceDetectorSupported = typeof window !== 'undefined' && 'FaceDetector' in window

let faceDetector: FaceDetector | null = null

/**
 * Initialize the face detector
 */
export async function initFaceDetector(): Promise<boolean> {
  if (!isFaceDetectorSupported) {
    console.log('[FACE_DETECTION] FaceDetector API not supported, using fallback')
    return false
  }

  try {
    // FaceDetector is defined in our global type declarations below
    faceDetector = new window.FaceDetector({
      fastMode: true,
      maxDetectedFaces: 1,
    })
    console.log('[FACE_DETECTION] FaceDetector API initialized')
    return true
  } catch (error) {
    console.warn('[FACE_DETECTION] Failed to initialize FaceDetector:', error)
    return false
  }
}

/**
 * Detect faces in an image or video frame
 */
export async function detectFace(
  source: HTMLVideoElement | HTMLCanvasElement | ImageBitmap,
  frameWidth: number,
  frameHeight: number
): Promise<FaceDetectionResult> {
  // Try native FaceDetector API
  if (faceDetector) {
    try {
      const faces = await faceDetector.detect(source)

      if (faces.length > 0) {
        const face = faces[0]
        const box = face.boundingBox

        // Check if face is well-positioned
        const { isWellPositioned, feedback } = checkFacePosition(
          box,
          frameWidth,
          frameHeight
        )

        // Extract landmarks if available
        const landmarks: FaceDetectionResult['landmarks'] = {}
        if (face.landmarks) {
          for (const landmark of face.landmarks) {
            const location = landmark.locations[0]
            if (landmark.type === 'eye' && !landmarks.leftEye) {
              landmarks.leftEye = { x: location.x, y: location.y }
            } else if (landmark.type === 'eye' && !landmarks.rightEye) {
              landmarks.rightEye = { x: location.x, y: location.y }
            } else if (landmark.type === 'nose') {
              landmarks.nose = { x: location.x, y: location.y }
            } else if (landmark.type === 'mouth') {
              landmarks.mouth = { x: location.x, y: location.y }
            }
          }
        }

        return {
          detected: true,
          confidence: 0.9,
          boundingBox: {
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height,
          },
          isWellPositioned,
          positionFeedback: feedback,
          landmarks: Object.keys(landmarks).length > 0 ? landmarks : undefined,
        }
      }

      return {
        detected: false,
        confidence: 0,
        isWellPositioned: false,
        positionFeedback: 'No face detected',
      }
    } catch (error) {
      console.warn('[FACE_DETECTION] Detection failed:', error)
    }
  }

  // Fallback: Use basic brightness/contrast analysis to estimate face presence
  return fallbackFaceDetection(source, frameWidth, frameHeight)
}

/**
 * Check if the detected face is well-positioned for skin analysis
 */
function checkFacePosition(
  box: DOMRectReadOnly,
  frameWidth: number,
  frameHeight: number
): { isWellPositioned: boolean; feedback: string | null } {
  const centerX = box.x + box.width / 2
  const centerY = box.y + box.height / 2

  const frameCenterX = frameWidth / 2
  const frameCenterY = frameHeight / 2

  // Calculate deviation from center (as percentage of frame)
  const xDeviation = Math.abs(centerX - frameCenterX) / frameWidth
  const yDeviation = Math.abs(centerY - frameCenterY) / frameHeight

  // Check face size relative to frame
  const faceAreaRatio = (box.width * box.height) / (frameWidth * frameHeight)
  const idealMinRatio = 0.15 // Face should be at least 15% of frame
  const idealMaxRatio = 0.50 // Face shouldn't exceed 50% of frame

  // Position checks
  if (xDeviation > 0.15) {
    return {
      isWellPositioned: false,
      feedback: centerX < frameCenterX ? 'Move right' : 'Move left',
    }
  }

  if (yDeviation > 0.15) {
    return {
      isWellPositioned: false,
      feedback: centerY < frameCenterY ? 'Move down' : 'Move up',
    }
  }

  // Size checks
  if (faceAreaRatio < idealMinRatio) {
    return {
      isWellPositioned: false,
      feedback: 'Move closer',
    }
  }

  if (faceAreaRatio > idealMaxRatio) {
    return {
      isWellPositioned: false,
      feedback: 'Move back',
    }
  }

  return {
    isWellPositioned: true,
    feedback: null,
  }
}

/**
 * Fallback face detection using brightness/skin-tone analysis
 * This is a simple heuristic when FaceDetector API is not available
 */
async function fallbackFaceDetection(
  source: HTMLVideoElement | HTMLCanvasElement | ImageBitmap,
  frameWidth: number,
  frameHeight: number
): Promise<FaceDetectionResult> {
  // Create a canvas to analyze the image
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    return {
      detected: false,
      confidence: 0,
      isWellPositioned: false,
      positionFeedback: 'Detection unavailable',
    }
  }

  // Sample at lower resolution
  const sampleWidth = 160
  const sampleHeight = 160
  canvas.width = sampleWidth
  canvas.height = sampleHeight

  ctx.drawImage(source, 0, 0, sampleWidth, sampleHeight)
  const imageData = ctx.getImageData(0, 0, sampleWidth, sampleHeight)
  const pixels = imageData.data

  // Analyze center region for skin-like colors
  const centerX = sampleWidth / 2
  const centerY = sampleHeight / 2
  const regionSize = sampleWidth * 0.4 // 40% of frame

  let skinPixels = 0
  let totalPixels = 0

  for (let y = Math.floor(centerY - regionSize / 2); y < centerY + regionSize / 2; y++) {
    for (let x = Math.floor(centerX - regionSize / 2); x < centerX + regionSize / 2; x++) {
      const i = (y * sampleWidth + x) * 4
      const r = pixels[i]
      const g = pixels[i + 1]
      const b = pixels[i + 2]

      // Simple skin color detection in RGB space
      // Works reasonably well for various skin tones
      if (isSkinColor(r, g, b)) {
        skinPixels++
      }
      totalPixels++
    }
  }

  const skinRatio = skinPixels / totalPixels

  // If >30% of center region appears to be skin, assume face is present
  const detected = skinRatio > 0.3
  const confidence = Math.min(1, skinRatio * 2) // Scale to 0-1

  return {
    detected,
    confidence,
    isWellPositioned: detected && skinRatio > 0.4,
    positionFeedback: detected
      ? skinRatio < 0.4 ? 'Center your face' : null
      : 'Position your face in frame',
  }
}

/**
 * Simple skin color detection
 * Uses heuristics that work across various skin tones
 */
function isSkinColor(r: number, g: number, b: number): boolean {
  // Rule 1: Basic skin tone detection (works for lighter skin)
  const rule1 = r > 95 && g > 40 && b > 20 &&
    r > g && r > b &&
    Math.abs(r - g) > 15 &&
    r - g > 0 // Red should be higher than green

  // Rule 2: Works better for darker skin tones
  const rule2 = r > 60 && g > 30 && b > 15 &&
    r > g && r > b &&
    (r - g) > 5 &&
    (r - b) > 10

  // Rule 3: YCbCr color space heuristic
  const y = 0.299 * r + 0.587 * g + 0.114 * b
  const cb = 128 + (-0.169 * r - 0.331 * g + 0.500 * b)
  const cr = 128 + (0.500 * r - 0.419 * g - 0.081 * b)

  const rule3 = y > 80 && cb > 77 && cb < 127 && cr > 133 && cr < 173

  return rule1 || rule2 || rule3
}

/**
 * Continuous face detection for video stream
 */
export class FaceDetectionStream {
  private video: HTMLVideoElement
  private callback: (result: FaceDetectionResult) => void
  private intervalId: NodeJS.Timeout | null = null
  private isRunning = false

  constructor(
    video: HTMLVideoElement,
    callback: (result: FaceDetectionResult) => void
  ) {
    this.video = video
    this.callback = callback
  }

  start(intervalMs: number = 200) {
    if (this.isRunning) return

    this.isRunning = true
    this.intervalId = setInterval(async () => {
      if (this.video.readyState >= 2) {
        const result = await detectFace(
          this.video,
          this.video.videoWidth,
          this.video.videoHeight
        )
        this.callback(result)
      }
    }, intervalMs)
  }

  stop() {
    this.isRunning = false
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }
}

// Type declaration for FaceDetector API
declare global {
  interface Window {
    FaceDetector: {
      new(options?: { fastMode?: boolean; maxDetectedFaces?: number }): FaceDetector
    }
  }

  interface FaceDetector {
    detect(source: HTMLVideoElement | HTMLCanvasElement | ImageBitmap): Promise<DetectedFace[]>
  }

  interface DetectedFace {
    boundingBox: DOMRectReadOnly
    landmarks?: Array<{
      type: 'eye' | 'nose' | 'mouth'
      locations: Array<{ x: number; y: number }>
    }>
  }
}
