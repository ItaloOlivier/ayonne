/**
 * Image Quality Validation System
 *
 * Provides pre-analysis quality checks to ensure consistent
 * skin analysis results by validating:
 * - Image resolution
 * - Lighting conditions
 * - Blur/sharpness
 * - Face detection confidence
 * - Color balance
 */

/**
 * Quality assessment result
 */
export interface ImageQualityAssessment {
  overall: 'excellent' | 'good' | 'acceptable' | 'poor'
  score: number // 0-100
  passesMinimum: boolean
  factors: {
    resolution: QualityFactor
    brightness: QualityFactor
    contrast: QualityFactor
    sharpness: QualityFactor
    colorBalance: QualityFactor
  }
  recommendations: string[]
}

export interface QualityFactor {
  score: number // 0-100
  status: 'excellent' | 'good' | 'acceptable' | 'poor'
  message: string
}

/**
 * Quality thresholds for skin analysis
 */
export const QUALITY_THRESHOLDS = {
  // Minimum acceptable values
  MIN_WIDTH: 640,
  MIN_HEIGHT: 640,
  IDEAL_WIDTH: 1280,
  IDEAL_HEIGHT: 1280,

  // Brightness (0-255 average)
  MIN_BRIGHTNESS: 60,
  MAX_BRIGHTNESS: 200,
  IDEAL_BRIGHTNESS_MIN: 100,
  IDEAL_BRIGHTNESS_MAX: 160,

  // Contrast (standard deviation of brightness)
  MIN_CONTRAST: 30,
  IDEAL_CONTRAST: 50,

  // Sharpness (Laplacian variance)
  MIN_SHARPNESS: 100,
  IDEAL_SHARPNESS: 500,

  // Color balance (RGB channel deviation)
  MAX_COLOR_DEVIATION: 30,
  IDEAL_COLOR_DEVIATION: 15,

  // Overall minimum score to proceed
  MIN_OVERALL_SCORE: 40,
  GOOD_OVERALL_SCORE: 70,
}

/**
 * Assess image quality from raw pixel data
 *
 * @param imageData - Canvas ImageData object
 * @param width - Image width
 * @param height - Image height
 */
export function assessImageQuality(
  imageData: ImageData,
  width: number,
  height: number
): ImageQualityAssessment {
  const pixels = imageData.data
  const recommendations: string[] = []

  // 1. Resolution check
  const resolution = assessResolution(width, height)
  if (resolution.status === 'poor') {
    recommendations.push('Move closer or use a higher resolution camera')
  }

  // 2. Brightness analysis
  const brightness = assessBrightness(pixels)
  if (brightness.status === 'poor') {
    if (brightness.score < 50) {
      recommendations.push('Find better lighting - the image is too dark')
    } else {
      recommendations.push('Reduce lighting - the image is overexposed')
    }
  }

  // 3. Contrast analysis
  const contrast = assessContrast(pixels)
  if (contrast.status === 'poor') {
    recommendations.push('Improve lighting to add more contrast to facial features')
  }

  // 4. Sharpness estimation
  const sharpness = assessSharpness(pixels, width, height)
  if (sharpness.status === 'poor') {
    recommendations.push('Hold the camera steady and ensure your face is in focus')
  }

  // 5. Color balance
  const colorBalance = assessColorBalance(pixels)
  if (colorBalance.status === 'poor') {
    recommendations.push('Use natural lighting for more accurate skin tone detection')
  }

  // Calculate overall score (weighted average)
  const weights = {
    resolution: 0.15,
    brightness: 0.25,
    contrast: 0.15,
    sharpness: 0.30,
    colorBalance: 0.15,
  }

  const overallScore = Math.round(
    resolution.score * weights.resolution +
    brightness.score * weights.brightness +
    contrast.score * weights.contrast +
    sharpness.score * weights.sharpness +
    colorBalance.score * weights.colorBalance
  )

  // Determine overall rating
  let overall: ImageQualityAssessment['overall']
  if (overallScore >= 85) {
    overall = 'excellent'
  } else if (overallScore >= 70) {
    overall = 'good'
  } else if (overallScore >= QUALITY_THRESHOLDS.MIN_OVERALL_SCORE) {
    overall = 'acceptable'
  } else {
    overall = 'poor'
  }

  // Add general recommendation if poor quality
  if (overall === 'poor' && recommendations.length === 0) {
    recommendations.push('Please retake the photo with better conditions')
  }

  return {
    overall,
    score: overallScore,
    passesMinimum: overallScore >= QUALITY_THRESHOLDS.MIN_OVERALL_SCORE,
    factors: {
      resolution,
      brightness,
      contrast,
      sharpness,
      colorBalance,
    },
    recommendations,
  }
}

/**
 * Assess resolution quality
 */
function assessResolution(width: number, height: number): QualityFactor {
  const minDimension = Math.min(width, height)

  let score: number
  let status: QualityFactor['status']
  let message: string

  if (minDimension >= QUALITY_THRESHOLDS.IDEAL_WIDTH) {
    score = 100
    status = 'excellent'
    message = 'High resolution image'
  } else if (minDimension >= 1000) {
    score = 85
    status = 'good'
    message = 'Good resolution'
  } else if (minDimension >= QUALITY_THRESHOLDS.MIN_WIDTH) {
    score = 60
    status = 'acceptable'
    message = 'Acceptable resolution'
  } else {
    score = Math.max(0, (minDimension / QUALITY_THRESHOLDS.MIN_WIDTH) * 40)
    status = 'poor'
    message = 'Resolution too low for accurate analysis'
  }

  return { score, status, message }
}

/**
 * Assess brightness from pixel data
 */
function assessBrightness(pixels: Uint8ClampedArray): QualityFactor {
  let totalBrightness = 0
  const pixelCount = pixels.length / 4

  for (let i = 0; i < pixels.length; i += 4) {
    // Luminance formula: 0.299*R + 0.587*G + 0.114*B
    const luminance = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2]
    totalBrightness += luminance
  }

  const avgBrightness = totalBrightness / pixelCount

  let score: number
  let status: QualityFactor['status']
  let message: string

  const { MIN_BRIGHTNESS, MAX_BRIGHTNESS, IDEAL_BRIGHTNESS_MIN, IDEAL_BRIGHTNESS_MAX } =
    QUALITY_THRESHOLDS

  if (avgBrightness >= IDEAL_BRIGHTNESS_MIN && avgBrightness <= IDEAL_BRIGHTNESS_MAX) {
    score = 100
    status = 'excellent'
    message = 'Excellent lighting'
  } else if (avgBrightness >= MIN_BRIGHTNESS && avgBrightness <= MAX_BRIGHTNESS) {
    // Calculate score based on distance from ideal range
    const distanceFromIdeal = avgBrightness < IDEAL_BRIGHTNESS_MIN
      ? IDEAL_BRIGHTNESS_MIN - avgBrightness
      : avgBrightness - IDEAL_BRIGHTNESS_MAX
    const maxDistance = Math.max(
      IDEAL_BRIGHTNESS_MIN - MIN_BRIGHTNESS,
      MAX_BRIGHTNESS - IDEAL_BRIGHTNESS_MAX
    )
    score = 100 - (distanceFromIdeal / maxDistance) * 40
    status = score >= 70 ? 'good' : 'acceptable'
    message = avgBrightness < IDEAL_BRIGHTNESS_MIN ? 'Slightly dark' : 'Slightly bright'
  } else {
    score = avgBrightness < MIN_BRIGHTNESS
      ? Math.max(0, (avgBrightness / MIN_BRIGHTNESS) * 40)
      : Math.max(0, ((255 - avgBrightness) / (255 - MAX_BRIGHTNESS)) * 40)
    status = 'poor'
    message = avgBrightness < MIN_BRIGHTNESS ? 'Too dark' : 'Overexposed'
  }

  return { score, status, message }
}

/**
 * Assess contrast from pixel data
 */
function assessContrast(pixels: Uint8ClampedArray): QualityFactor {
  const luminances: number[] = []
  const pixelCount = pixels.length / 4

  for (let i = 0; i < pixels.length; i += 4) {
    const luminance = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2]
    luminances.push(luminance)
  }

  // Calculate standard deviation
  const mean = luminances.reduce((a, b) => a + b, 0) / pixelCount
  const variance = luminances.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / pixelCount
  const stdDev = Math.sqrt(variance)

  let score: number
  let status: QualityFactor['status']
  let message: string

  if (stdDev >= QUALITY_THRESHOLDS.IDEAL_CONTRAST) {
    score = 100
    status = 'excellent'
    message = 'Good contrast'
  } else if (stdDev >= QUALITY_THRESHOLDS.MIN_CONTRAST) {
    score = 60 + ((stdDev - QUALITY_THRESHOLDS.MIN_CONTRAST) /
      (QUALITY_THRESHOLDS.IDEAL_CONTRAST - QUALITY_THRESHOLDS.MIN_CONTRAST)) * 40
    status = score >= 70 ? 'good' : 'acceptable'
    message = 'Acceptable contrast'
  } else {
    score = (stdDev / QUALITY_THRESHOLDS.MIN_CONTRAST) * 60
    status = 'poor'
    message = 'Low contrast - facial features may not be clearly visible'
  }

  return { score: Math.round(score), status, message }
}

/**
 * Estimate sharpness using Laplacian variance
 * Higher variance = sharper image
 */
function assessSharpness(
  pixels: Uint8ClampedArray,
  width: number,
  height: number
): QualityFactor {
  // Convert to grayscale array
  const gray = new Float32Array(width * height)
  for (let i = 0; i < pixels.length; i += 4) {
    gray[i / 4] = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2]
  }

  // Apply Laplacian filter (3x3 kernel: [0,-1,0; -1,4,-1; 0,-1,0])
  let sumLaplacian = 0
  let sumSquared = 0
  let count = 0

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x
      const laplacian =
        4 * gray[idx] -
        gray[idx - 1] -
        gray[idx + 1] -
        gray[idx - width] -
        gray[idx + width]

      sumLaplacian += laplacian
      sumSquared += laplacian * laplacian
      count++
    }
  }

  // Variance of Laplacian
  const mean = sumLaplacian / count
  const variance = (sumSquared / count) - (mean * mean)

  let score: number
  let status: QualityFactor['status']
  let message: string

  if (variance >= QUALITY_THRESHOLDS.IDEAL_SHARPNESS) {
    score = 100
    status = 'excellent'
    message = 'Sharp and clear'
  } else if (variance >= QUALITY_THRESHOLDS.MIN_SHARPNESS) {
    score = 60 + ((variance - QUALITY_THRESHOLDS.MIN_SHARPNESS) /
      (QUALITY_THRESHOLDS.IDEAL_SHARPNESS - QUALITY_THRESHOLDS.MIN_SHARPNESS)) * 40
    status = score >= 70 ? 'good' : 'acceptable'
    message = 'Acceptable sharpness'
  } else {
    score = (variance / QUALITY_THRESHOLDS.MIN_SHARPNESS) * 60
    status = 'poor'
    message = 'Image is blurry'
  }

  return { score: Math.round(Math.max(0, Math.min(100, score))), status, message }
}

/**
 * Assess color balance by checking RGB channel deviation
 */
function assessColorBalance(pixels: Uint8ClampedArray): QualityFactor {
  let sumR = 0, sumG = 0, sumB = 0
  const pixelCount = pixels.length / 4

  for (let i = 0; i < pixels.length; i += 4) {
    sumR += pixels[i]
    sumG += pixels[i + 1]
    sumB += pixels[i + 2]
  }

  const avgR = sumR / pixelCount
  const avgG = sumG / pixelCount
  const avgB = sumB / pixelCount
  const avgAll = (avgR + avgG + avgB) / 3

  // Calculate deviation from balanced
  const deviation = Math.max(
    Math.abs(avgR - avgAll),
    Math.abs(avgG - avgAll),
    Math.abs(avgB - avgAll)
  )

  let score: number
  let status: QualityFactor['status']
  let message: string

  if (deviation <= QUALITY_THRESHOLDS.IDEAL_COLOR_DEVIATION) {
    score = 100
    status = 'excellent'
    message = 'Natural color balance'
  } else if (deviation <= QUALITY_THRESHOLDS.MAX_COLOR_DEVIATION) {
    score = 100 - ((deviation - QUALITY_THRESHOLDS.IDEAL_COLOR_DEVIATION) /
      (QUALITY_THRESHOLDS.MAX_COLOR_DEVIATION - QUALITY_THRESHOLDS.IDEAL_COLOR_DEVIATION)) * 40
    status = score >= 70 ? 'good' : 'acceptable'
    message = 'Slight color cast'
  } else {
    score = Math.max(0, 60 - (deviation - QUALITY_THRESHOLDS.MAX_COLOR_DEVIATION))
    status = 'poor'
    message = 'Strong color cast - may affect skin tone analysis'
  }

  return { score: Math.round(score), status, message }
}

/**
 * Get quality tier for display
 */
export function getQualityTier(score: number): {
  tier: string
  color: string
  description: string
} {
  if (score >= 85) {
    return {
      tier: 'Excellent',
      color: '#1C4444',
      description: 'Perfect conditions for accurate analysis',
    }
  } else if (score >= 70) {
    return {
      tier: 'Good',
      color: '#2D5A5A',
      description: 'Good quality for reliable results',
    }
  } else if (score >= QUALITY_THRESHOLDS.MIN_OVERALL_SCORE) {
    return {
      tier: 'Acceptable',
      color: '#8B7355',
      description: 'Usable but results may be less accurate',
    }
  } else {
    return {
      tier: 'Poor',
      color: '#996B4A',
      description: 'Please retake for better results',
    }
  }
}

/**
 * Quick quality check for real-time feedback
 * Faster but less comprehensive than full assessment
 */
export function quickQualityCheck(
  pixels: Uint8ClampedArray,
  width: number,
  height: number
): {
  isAcceptable: boolean
  mainIssue: string | null
  score: number
} {
  // Quick brightness check
  let totalBrightness = 0
  const sampleSize = Math.min(10000, pixels.length / 4)
  const step = Math.floor(pixels.length / 4 / sampleSize) * 4

  for (let i = 0; i < pixels.length; i += step) {
    totalBrightness += 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2]
  }

  const avgBrightness = totalBrightness / sampleSize

  // Quick resolution check
  const minDimension = Math.min(width, height)

  // Determine main issue
  let mainIssue: string | null = null
  let score = 70 // Default acceptable

  if (minDimension < QUALITY_THRESHOLDS.MIN_WIDTH) {
    mainIssue = 'Resolution too low'
    score = 30
  } else if (avgBrightness < QUALITY_THRESHOLDS.MIN_BRIGHTNESS) {
    mainIssue = 'Too dark'
    score = 40
  } else if (avgBrightness > QUALITY_THRESHOLDS.MAX_BRIGHTNESS) {
    mainIssue = 'Too bright'
    score = 40
  } else if (avgBrightness >= QUALITY_THRESHOLDS.IDEAL_BRIGHTNESS_MIN &&
             avgBrightness <= QUALITY_THRESHOLDS.IDEAL_BRIGHTNESS_MAX) {
    score = 85
  }

  return {
    isAcceptable: score >= QUALITY_THRESHOLDS.MIN_OVERALL_SCORE,
    mainIssue,
    score,
  }
}
