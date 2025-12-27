/**
 * Tool Use Analyzer
 *
 * Enables Claude to dynamically query products, check ingredient compatibility,
 * and build personalized routines during skin analysis.
 */

import { FEATURES } from '@/lib/features'
import { buildCachedSystemMessage } from './cached-prompts'
import { skinAnalysisTools } from './tools'
import { handleToolCall } from './tool-handlers'
import { parseAIJsonResponse, getSmartFallbackAnalysis } from './analyzer'
import { SkinType, DetectedCondition } from './conditions'

interface ToolUseAnalysisResult {
  skinType: SkinType | null
  conditions: DetectedCondition[]
  recommendations: Array<{
    productId: string
    productName: string
    productSlug: string
    reason: string
  }>
  routine?: {
    morning: unknown
    evening: unknown
    weeklyTreatments: string[]
  }
  toolCalls: string[]
}

const TOOL_USE_PROMPT = `Analyze this skin image and provide personalized product recommendations.

After analyzing the skin:
1. First, identify the skin type and conditions
2. Use lookup_products to find suitable products for the detected conditions
3. Use check_ingredient_compatibility to ensure recommended products work together
4. Use build_routine to create a personalized AM/PM routine

Return your final analysis as JSON with skinType, conditions, and a summary of your product research.`

/**
 * Analyze skin with tool use enabled
 *
 * This allows Claude to dynamically query the product database
 * and build personalized recommendations during analysis.
 */
export async function analyzeWithToolUse(
  imageBase64: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp'
): Promise<ToolUseAnalysisResult> {
  if (!FEATURES.TOOL_USE) {
    // Fallback to basic analysis if tool use is disabled
    const fallback = getSmartFallbackAnalysis()
    return {
      ...fallback,
      recommendations: [],
      toolCalls: [],
    }
  }

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured')
  }

  // Build initial messages
  const messages: Array<{ role: string; content: unknown }> = [
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
          text: TOOL_USE_PROMPT,
        },
      ],
    },
  ]

  // Track tool calls for logging
  const toolCalls: string[] = []

  // Build system message with caching
  const systemMessage = FEATURES.PROMPT_CACHING
    ? buildCachedSystemMessage(false)
    : undefined

  let response = await callClaudeWithTools(
    messages,
    systemMessage,
    ANTHROPIC_API_KEY
  )

  // Handle tool use loop (max 5 iterations to prevent infinite loops)
  let iterations = 0
  const maxIterations = 5

  while (response.stop_reason === 'tool_use' && iterations < maxIterations) {
    iterations++
    const toolResults: Array<{
      type: 'tool_result'
      tool_use_id: string
      content: string
    }> = []

    // Process all tool calls in the response
    for (const block of response.content) {
      if (block.type === 'tool_use' && block.name && block.id) {
        console.log(`[TOOL_USE] Calling tool: ${block.name}`)
        toolCalls.push(block.name)

        const result = await handleToolCall(
          block.name,
          block.input as Record<string, unknown>
        )

        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: result,
        })
      }
    }

    // Add assistant response and tool results to messages
    messages.push({ role: 'assistant', content: response.content })
    messages.push({ role: 'user', content: toolResults })

    // Continue the conversation
    response = await callClaudeWithTools(messages, systemMessage, ANTHROPIC_API_KEY)
  }

  // Extract final text response
  let finalText = ''
  for (const block of response.content) {
    if (block.type === 'text') {
      finalText += block.text
    }
  }

  // Parse the analysis result
  const parsed = parseAIJsonResponse<{
    skinType: SkinType
    conditions: DetectedCondition[]
    recommendations?: Array<{
      productId: string
      productName: string
      productSlug: string
      reason: string
    }>
    routine?: {
      morning: unknown
      evening: unknown
      weeklyTreatments: string[]
    }
  }>(finalText)

  if (!parsed) {
    const fallback = getSmartFallbackAnalysis()
    return {
      ...fallback,
      recommendations: [],
      toolCalls,
    }
  }

  return {
    skinType: parsed.skinType,
    conditions: parsed.conditions || [],
    recommendations: parsed.recommendations || [],
    routine: parsed.routine,
    toolCalls,
  }
}

/**
 * Call Claude API with tools enabled
 */
async function callClaudeWithTools(
  messages: Array<{ role: string; content: unknown }>,
  systemMessage: unknown,
  apiKey: string
): Promise<{
  stop_reason: string
  content: Array<{
    type: string
    text?: string
    id?: string
    name?: string
    input?: unknown
  }>
}> {
  const requestBody: Record<string, unknown> = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    tools: skinAnalysisTools,
    messages,
  }

  if (systemMessage) {
    requestBody.system = systemMessage
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[TOOL_USE] API error:', errorText)
    throw new Error(`Anthropic API error: ${response.status}`)
  }

  return response.json()
}

/**
 * Get ingredient recommendations for detected conditions
 *
 * Standalone function that uses tool handlers directly
 * without making an API call.
 */
export async function getIngredientRecommendations(
  skinType: string,
  conditions: string[]
): Promise<{
  ingredients: string[]
  routine: unknown
  compatibility: unknown
}> {
  const { handleToolCall } = await import('./tool-handlers')

  // Get routine recommendation
  const routineResult = await handleToolCall('build_routine', {
    skinType,
    conditions,
  })
  const routine = JSON.parse(routineResult)

  // Get key ingredients
  const keyIngredients = routine.routine?.keyIngredients || []

  // Check compatibility if we have multiple ingredients
  let compatibility = null
  if (keyIngredients.length >= 2) {
    const compatResult = await handleToolCall('check_ingredient_compatibility', {
      ingredients: keyIngredients,
    })
    compatibility = JSON.parse(compatResult)
  }

  return {
    ingredients: keyIngredients,
    routine: routine.routine,
    compatibility,
  }
}
