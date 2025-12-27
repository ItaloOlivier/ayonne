/**
 * Server-side Image Preprocessing
 *
 * Normalizes images before AI analysis to improve consistency:
 * - Auto white balance correction
 * - Exposure normalization
 * - Contrast enhancement
 * - Noise reduction
 */

import sharp from 'sharp'

export interface PreprocessingOptions {
  normalizeExposure?: boolean
  correctWhiteBalance?: boolean
  enhanceContrast?: boolean
  reduceNoise?: boolean
  targetWidth?: number
}

export interface PreprocessingResult {
  buffer: Buffer
  base64: string
  applied: string[]
  originalStats: ImageStats
  processedStats: ImageStats
}

export interface ImageStats {
  width: number
  height: number
  brightness: number
  contrast: number
  colorTemperature: 'warm' | 'neutral' | 'cool'
}

const DEFAULT_OPTIONS: PreprocessingOptions = {
  normalizeExposure: true,
  correctWhiteBalance: true,
  enhanceContrast: true,
  reduceNoise: false, // Can blur fine details
  targetWidth: 1280,
}

/**
 * Preprocess image for optimal AI analysis
 */
export async function preprocessImage(
  imageBuffer: Buffer,
  options: PreprocessingOptions = {}
): Promise<PreprocessingResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const applied: string[] = []

  // Get original image metadata and stats
  const originalMetadata = await sharp(imageBuffer).metadata()
  const originalStats = await analyzeImageStats(imageBuffer)

  let processor = sharp(imageBuffer)

  // 1. Resize if needed (maintain aspect ratio)
  if (opts.targetWidth && originalMetadata.width && originalMetadata.width > opts.targetWidth) {
    processor = processor.resize(opts.targetWidth, null, {
      withoutEnlargement: true,
      fit: 'inside',
    })
    applied.push('resize')
  }

  // 2. Normalize exposure if image is too dark or bright
  if (opts.normalizeExposure) {
    const adjustment = calculateExposureAdjustment(originalStats.brightness)
    if (adjustment !== 0) {
      processor = processor.modulate({
        brightness: 1 + adjustment,
      })
      applied.push(`exposure:${adjustment > 0 ? '+' : ''}${Math.round(adjustment * 100)}%`)
    }
  }

  // 3. Correct white balance if color cast detected
  if (opts.correctWhiteBalance && originalStats.colorTemperature !== 'neutral') {
    const tintAdjustment = originalStats.colorTemperature === 'warm' ? -10 : 10
    processor = processor.tint({ r: tintAdjustment, g: 0, b: -tintAdjustment })
    applied.push(`whiteBalance:${originalStats.colorTemperature}`)
  }

  // 4. Enhance contrast if image is flat
  if (opts.enhanceContrast && originalStats.contrast < 40) {
    processor = processor.linear(1.1, -(128 * 0.1)) // Slight contrast boost
    applied.push('contrast:+10%')
  }

  // 5. Light noise reduction (only if specifically requested)
  if (opts.reduceNoise) {
    processor = processor.median(3) // 3x3 median filter for light noise reduction
    applied.push('denoise')
  }

  // 6. Ensure consistent output format
  processor = processor.jpeg({
    quality: 92,
    mozjpeg: true, // Better compression
  })

  const processedBuffer = await processor.toBuffer()
  const processedStats = await analyzeImageStats(processedBuffer)

  return {
    buffer: processedBuffer,
    base64: processedBuffer.toString('base64'),
    applied,
    originalStats,
    processedStats,
  }
}

/**
 * Analyze image statistics
 */
async function analyzeImageStats(imageBuffer: Buffer): Promise<ImageStats> {
  const metadata = await sharp(imageBuffer).metadata()
  const { data, info } = await sharp(imageBuffer)
    .resize(100, 100, { fit: 'cover' }) // Sample at low res for speed
    .raw()
    .toBuffer({ resolveWithObject: true })

  const pixels = data
  const pixelCount = info.width * info.height

  // Calculate average RGB values
  let sumR = 0, sumG = 0, sumB = 0
  let sumBrightness = 0
  const brightnessValues: number[] = []

  for (let i = 0; i < pixels.length; i += 3) {
    const r = pixels[i]
    const g = pixels[i + 1]
    const b = pixels[i + 2]

    sumR += r
    sumG += g
    sumB += b

    const brightness = 0.299 * r + 0.587 * g + 0.114 * b
    sumBrightness += brightness
    brightnessValues.push(brightness)
  }

  const avgR = sumR / pixelCount
  const avgG = sumG / pixelCount
  const avgB = sumB / pixelCount
  const avgBrightness = sumBrightness / pixelCount

  // Calculate contrast (standard deviation of brightness)
  const variance = brightnessValues.reduce((sum, val) =>
    sum + Math.pow(val - avgBrightness, 2), 0) / pixelCount
  const contrast = Math.sqrt(variance)

  // Determine color temperature
  let colorTemperature: ImageStats['colorTemperature']
  const rgDiff = avgR - avgG
  const gbDiff = avgG - avgB

  if (rgDiff > 15 && avgR > avgB + 10) {
    colorTemperature = 'warm'
  } else if (avgB > avgR + 10) {
    colorTemperature = 'cool'
  } else {
    colorTemperature = 'neutral'
  }

  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
    brightness: avgBrightness,
    contrast,
    colorTemperature,
  }
}

/**
 * Calculate exposure adjustment needed
 */
function calculateExposureAdjustment(brightness: number): number {
  const TARGET_BRIGHTNESS = 130 // Target average brightness

  // Only adjust if significantly off target
  if (brightness < 80) {
    // Too dark - brighten
    return Math.min(0.4, (TARGET_BRIGHTNESS - brightness) / 200)
  } else if (brightness > 180) {
    // Too bright - darken
    return Math.max(-0.3, (TARGET_BRIGHTNESS - brightness) / 200)
  }

  return 0
}

/**
 * Quick preprocessing for time-sensitive operations
 * Only applies essential normalizations
 */
export async function quickPreprocess(imageBuffer: Buffer): Promise<Buffer> {
  const stats = await analyzeImageStats(imageBuffer)

  let processor = sharp(imageBuffer)

  // Only normalize if significantly off
  if (stats.brightness < 70 || stats.brightness > 190) {
    const adjustment = calculateExposureAdjustment(stats.brightness)
    processor = processor.modulate({ brightness: 1 + adjustment })
  }

  return processor
    .jpeg({ quality: 92 })
    .toBuffer()
}

/**
 * Validate image meets minimum quality requirements
 */
export async function validateImageQuality(imageBuffer: Buffer): Promise<{
  valid: boolean
  issues: string[]
  stats: ImageStats
}> {
  const stats = await analyzeImageStats(imageBuffer)
  const issues: string[] = []

  // Check resolution
  if (stats.width < 400 || stats.height < 400) {
    issues.push('Resolution too low (minimum 400x400)')
  }

  // Check brightness
  if (stats.brightness < 40) {
    issues.push('Image too dark')
  } else if (stats.brightness > 220) {
    issues.push('Image overexposed')
  }

  // Check contrast
  if (stats.contrast < 20) {
    issues.push('Very low contrast')
  }

  return {
    valid: issues.length === 0,
    issues,
    stats,
  }
}

/**
 * Generate quality report for logging
 */
export function generateQualityReport(
  original: ImageStats,
  processed: ImageStats,
  applied: string[]
): string {
  const lines = [
    '=== Image Quality Report ===',
    `Resolution: ${original.width}x${original.height}`,
    `Original Brightness: ${original.brightness.toFixed(1)}`,
    `Processed Brightness: ${processed.brightness.toFixed(1)}`,
    `Original Contrast: ${original.contrast.toFixed(1)}`,
    `Processed Contrast: ${processed.contrast.toFixed(1)}`,
    `Color Temperature: ${original.colorTemperature}`,
    `Adjustments Applied: ${applied.length > 0 ? applied.join(', ') : 'none'}`,
    '===========================',
  ]

  return lines.join('\n')
}
