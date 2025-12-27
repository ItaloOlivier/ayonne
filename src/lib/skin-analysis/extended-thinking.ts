/**
 * Extended Thinking Analyzer
 *
 * Uses Claude's extended thinking capability for deeper reasoning
 * on complex skin analyses with multiple conditions or contradictions.
 */

import { FEATURES } from '@/lib/features'
import { buildCachedSystemMessage } from './cached-prompts'
import { parseAIJsonResponse, getSmartFallbackAnalysis } from './analyzer'
import { SkinType, DetectedCondition } from './conditions'

interface ExtendedThinkingResult {
  skinType: SkinType | null
  conditions: DetectedCondition[]
  thinking: string // The reasoning process
  confidence: number
  complexityFactors: string[]
}

const EXTENDED_THINKING_PROMPT = `Analyze this skin image with careful, step-by-step reasoning.

This is a complex case that requires deeper analysis. Please think through:

1. **Initial Observations**: What do you immediately notice about the skin?
2. **Potential Contradictions**: Are there any observations that seem contradictory?
3. **Multiple Conditions**: How do different conditions interact or overlap?
4. **Confidence Assessment**: How certain are you about each finding?
5. **Final Synthesis**: Reconcile all observations into a coherent assessment.

Take your time to reason through the analysis carefully before providing your final assessment.

Return your final analysis as JSON:
{
  "skinType": "oily|dry|combination|normal|sensitive",
  "conditions": [
    {
      "id": "condition_id",
      "name": "Condition Name",
      "confidence": 0.85,
      "description": "Detailed observation with reasoning"
    }
  ],
  "overallConfidence": 0.9,
  "complexityFactors": ["List of factors that made this analysis complex"]
}`

/**
 * Check if a case warrants extended thinking
 */
export function shouldUseExtendedThinking(context: {
  previousAnalyses?: number
  reportedConcerns?: string[]
  initialConditionCount?: number
}): boolean {
  if (!FEATURES.EXTENDED_THINKING) {
    return false
  }

  // Use extended thinking for complex cases:
  // 1. User has multiple previous analyses (tracking trends)
  if (context.previousAnalyses && context.previousAnalyses > 2) {
    return true
  }

  // 2. User reported many concerns
  if (context.reportedConcerns && context.reportedConcerns.length > 3) {
    return true
  }

  // 3. Initial quick analysis found many conditions
  if (context.initialConditionCount && context.initialConditionCount > 4) {
    return true
  }

  return false
}

/**
 * Analyze skin with extended thinking enabled
 *
 * Uses Claude's extended thinking for deeper reasoning on complex cases.
 * The thinking block shows the step-by-step reasoning process.
 */
export async function analyzeWithExtendedThinking(
  imageBase64: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp',
  context?: {
    userAge?: number
    previousSkinTypes?: string[]
    reportedConcerns?: string[]
  }
): Promise<ExtendedThinkingResult> {
  if (!FEATURES.EXTENDED_THINKING) {
    const fallback = getSmartFallbackAnalysis()
    return {
      ...fallback,
      thinking: 'Extended thinking is not enabled.',
      confidence: 0.7,
      complexityFactors: [],
    }
  }

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured')
  }

  // Build context prompt
  let contextPrompt = ''
  if (context) {
    if (context.userAge) {
      contextPrompt += `\nUser's age: ${context.userAge} years old.`
    }
    if (context.previousSkinTypes?.length) {
      contextPrompt += `\nPrevious skin type assessments: ${context.previousSkinTypes.join(', ')}.`
    }
    if (context.reportedConcerns?.length) {
      contextPrompt += `\nUser-reported concerns: ${context.reportedConcerns.join(', ')}.`
    }
  }

  // Build system message with caching
  const systemMessage = FEATURES.PROMPT_CACHING
    ? buildCachedSystemMessage(false)
    : undefined

  try {
    const requestBody: Record<string, unknown> = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16000,
      thinking: {
        type: 'enabled',
        budget_tokens: 10000, // Allow up to 10k tokens for reasoning
      },
      messages: [
        {
          role: 'user',
          content: [
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
              text: EXTENDED_THINKING_PROMPT + contextPrompt,
            },
          ],
        },
      ],
    }

    if (systemMessage) {
      requestBody.system = systemMessage
    }

    console.log('[EXTENDED_THINKING] Starting deep analysis...')

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      console.error('[EXTENDED_THINKING] API error:', await response.text())
      const fallback = getSmartFallbackAnalysis()
      return {
        ...fallback,
        thinking: 'Extended thinking unavailable.',
        confidence: 0.7,
        complexityFactors: [],
      }
    }

    const data = await response.json()

    // Extract thinking and response blocks
    let thinking = ''
    let analysisText = ''

    for (const block of data.content) {
      if (block.type === 'thinking') {
        thinking = block.thinking
        console.log('[EXTENDED_THINKING] Thinking block received:', thinking.length, 'chars')
      } else if (block.type === 'text') {
        analysisText = block.text
      }
    }

    // Parse the analysis
    const parsed = parseAIJsonResponse<{
      skinType: SkinType
      conditions: DetectedCondition[]
      overallConfidence?: number
      complexityFactors?: string[]
    }>(analysisText)

    if (!parsed) {
      const fallback = getSmartFallbackAnalysis()
      return {
        ...fallback,
        thinking: thinking || 'Analysis parsing failed.',
        confidence: 0.6,
        complexityFactors: ['Failed to parse structured response'],
      }
    }

    return {
      skinType: parsed.skinType,
      conditions: parsed.conditions || [],
      thinking,
      confidence: parsed.overallConfidence || 0.85,
      complexityFactors: parsed.complexityFactors || [],
    }
  } catch (error) {
    console.error('[EXTENDED_THINKING] Error:', error)
    const fallback = getSmartFallbackAnalysis()
    return {
      ...fallback,
      thinking: 'Extended thinking failed.',
      confidence: 0.5,
      complexityFactors: ['Error during analysis'],
    }
  }
}

/**
 * Get a summary of the thinking process for display
 */
export function summarizeThinking(thinking: string): string {
  if (!thinking || thinking.length < 100) {
    return 'Quick analysis performed.'
  }

  // Extract key points from thinking
  const lines = thinking.split('\n').filter(l => l.trim())
  const keyPoints: string[] = []

  for (const line of lines) {
    // Look for conclusion-like statements
    if (
      line.includes('conclude') ||
      line.includes('determine') ||
      line.includes('assess') ||
      line.includes('notice') ||
      line.includes('observe')
    ) {
      keyPoints.push(line.trim().substring(0, 100))
      if (keyPoints.length >= 3) break
    }
  }

  if (keyPoints.length === 0) {
    return `Deep analysis performed with ${thinking.length} characters of reasoning.`
  }

  return keyPoints.join(' ').substring(0, 200) + '...'
}
