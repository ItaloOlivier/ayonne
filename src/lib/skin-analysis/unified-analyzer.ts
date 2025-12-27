/**
 * Unified Skin Analyzer
 *
 * Intelligently selects the best analysis method based on:
 * - Available features
 * - Analysis complexity
 * - User context
 *
 * This is the recommended entry point for all skin analyses.
 */

import { FEATURES } from '@/lib/features'
import { callAnthropicAPIWithCaching } from './analyzer'
import { analyzeWithToolUse } from './tool-use-analyzer'
import { analyzeWithExtendedThinking, shouldUseExtendedThinking } from './extended-thinking'
import { parseAIJsonResponse, getSmartFallbackAnalysis } from './analyzer'
import { SkinType, DetectedCondition } from './conditions'

export interface UnifiedAnalysisResult {
  skinType: SkinType | null
  conditions: DetectedCondition[]
  method: 'standard' | 'tool-use' | 'extended-thinking'
  confidence: number
  metadata: {
    cacheHit?: boolean
    toolCalls?: string[]
    thinkingSummary?: string
    processingTime?: number
  }
}

export interface AnalysisOptions {
  // User context
  customerId?: string
  userAge?: number
  previousAnalysesCount?: number
  reportedConcerns?: string[]

  // Analysis options
  includeRecommendations?: boolean
  forceMethod?: 'standard' | 'tool-use' | 'extended-thinking'
}

const STANDARD_ANALYSIS_PROMPT = `Analyze this skin image for a professional skincare assessment.

Identify:
1. Primary skin type (oily, dry, combination, normal, sensitive)
2. Visible conditions with confidence levels (0-1)
3. Location and severity of each condition

Return ONLY valid JSON:
{
  "skinType": "oily|dry|combination|normal|sensitive",
  "conditions": [
    {
      "id": "condition_id",
      "name": "Condition Name",
      "confidence": 0.85,
      "description": "What you observed"
    }
  ]
}

Condition IDs: acne, large_pores, oiliness, dryness, dehydration, fine_lines, wrinkles, hyperpigmentation, redness, dullness, uneven_texture, dark_circles`

/**
 * Analyze skin using the optimal method for the context
 */
export async function analyzeSkin(
  imageBase64: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp',
  options: AnalysisOptions = {}
): Promise<UnifiedAnalysisResult> {
  const startTime = Date.now()

  // Determine which method to use
  const method = selectAnalysisMethod(options)

  console.log(`[UNIFIED] Selected analysis method: ${method}`)

  let result: UnifiedAnalysisResult

  switch (method) {
    case 'extended-thinking':
      result = await runExtendedThinkingAnalysis(imageBase64, mediaType, options)
      break

    case 'tool-use':
      result = await runToolUseAnalysis(imageBase64, mediaType)
      break

    case 'standard':
    default:
      result = await runStandardAnalysis(imageBase64, mediaType)
      break
  }

  result.metadata.processingTime = Date.now() - startTime
  console.log(`[UNIFIED] Analysis complete in ${result.metadata.processingTime}ms`)

  return result
}

/**
 * Select the optimal analysis method based on context and available features
 */
function selectAnalysisMethod(
  options: AnalysisOptions
): 'standard' | 'tool-use' | 'extended-thinking' {
  // Allow forcing a specific method
  if (options.forceMethod) {
    const method = options.forceMethod
    // Verify the feature is enabled
    if (method === 'extended-thinking' && !FEATURES.EXTENDED_THINKING) {
      console.warn('[UNIFIED] Extended thinking requested but not enabled, falling back')
      return 'standard'
    }
    if (method === 'tool-use' && !FEATURES.TOOL_USE) {
      console.warn('[UNIFIED] Tool use requested but not enabled, falling back')
      return 'standard'
    }
    return method
  }

  // Check if extended thinking is warranted
  if (
    shouldUseExtendedThinking({
      previousAnalyses: options.previousAnalysesCount,
      reportedConcerns: options.reportedConcerns,
    })
  ) {
    return 'extended-thinking'
  }

  // Use tool use if recommendations are needed
  if (options.includeRecommendations && FEATURES.TOOL_USE) {
    return 'tool-use'
  }

  // Default to standard analysis (with caching)
  return 'standard'
}

/**
 * Run standard analysis with prompt caching
 */
async function runStandardAnalysis(
  imageBase64: string,
  mediaType: string
): Promise<UnifiedAnalysisResult> {
  const userContent = [
    {
      type: 'image',
      source: {
        type: 'base64',
        media_type: mediaType,
        data: imageBase64,
      },
    },
    {
      type: 'text',
      text: STANDARD_ANALYSIS_PROMPT,
    },
  ]

  const { text, cacheMetrics } = await callAnthropicAPIWithCaching(userContent, {
    isMultiAngle: false,
    maxTokens: 1024,
  })

  if (!text) {
    const fallback = getSmartFallbackAnalysis()
    return {
      skinType: fallback.skinType,
      conditions: fallback.conditions,
      method: 'standard',
      confidence: 0.6,
      metadata: {
        cacheHit: false,
      },
    }
  }

  const parsed = parseAIJsonResponse<{
    skinType: SkinType
    conditions: DetectedCondition[]
  }>(text)

  if (!parsed) {
    const fallback = getSmartFallbackAnalysis()
    return {
      skinType: fallback.skinType,
      conditions: fallback.conditions,
      method: 'standard',
      confidence: 0.5,
      metadata: {
        cacheHit: cacheMetrics?.cacheHitRate ? cacheMetrics.cacheHitRate > 0 : false,
      },
    }
  }

  return {
    skinType: parsed.skinType,
    conditions: parsed.conditions || [],
    method: 'standard',
    confidence: 0.85,
    metadata: {
      cacheHit: cacheMetrics?.cacheHitRate ? cacheMetrics.cacheHitRate > 0 : false,
    },
  }
}

/**
 * Run tool-use analysis with dynamic product lookup
 */
async function runToolUseAnalysis(
  imageBase64: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp'
): Promise<UnifiedAnalysisResult> {
  try {
    const result = await analyzeWithToolUse(imageBase64, mediaType)

    return {
      skinType: result.skinType,
      conditions: result.conditions,
      method: 'tool-use',
      confidence: 0.9,
      metadata: {
        toolCalls: result.toolCalls,
      },
    }
  } catch (error) {
    console.error('[UNIFIED] Tool use analysis failed:', error)
    return runStandardAnalysis(imageBase64, mediaType)
  }
}

/**
 * Run extended thinking analysis for complex cases
 */
async function runExtendedThinkingAnalysis(
  imageBase64: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp',
  options: AnalysisOptions
): Promise<UnifiedAnalysisResult> {
  try {
    const result = await analyzeWithExtendedThinking(imageBase64, mediaType, {
      userAge: options.userAge,
      reportedConcerns: options.reportedConcerns,
    })

    return {
      skinType: result.skinType,
      conditions: result.conditions,
      method: 'extended-thinking',
      confidence: result.confidence,
      metadata: {
        thinkingSummary:
          result.thinking.length > 200
            ? result.thinking.substring(0, 200) + '...'
            : result.thinking,
      },
    }
  } catch (error) {
    console.error('[UNIFIED] Extended thinking analysis failed:', error)
    return runStandardAnalysis(imageBase64, mediaType)
  }
}

/**
 * Get the current feature configuration
 */
export function getAnalyzerCapabilities(): {
  promptCaching: boolean
  streaming: boolean
  toolUse: boolean
  extendedThinking: boolean
} {
  return {
    promptCaching: FEATURES.PROMPT_CACHING,
    streaming: FEATURES.STREAMING,
    toolUse: FEATURES.TOOL_USE,
    extendedThinking: FEATURES.EXTENDED_THINKING,
  }
}
