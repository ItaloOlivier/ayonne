import { NextRequest } from 'next/server'
import { getCustomerIdFromCookie } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  validateImageFile,
  checkAnalysisRateLimit,
  generateSessionId,
  compressImage,
  uploadImage,
  parseAIJsonResponse,
  buildAnalysisResults,
  getSmartFallbackAnalysis,
} from '@/lib/skin-analysis/analyzer'
import { buildCachedSystemMessage } from '@/lib/skin-analysis/cached-prompts'
import { FEATURES } from '@/lib/features'
import { SkinType, DetectedCondition } from '@/lib/skin-analysis/conditions'

/**
 * Streaming Skin Analysis API
 *
 * Returns Server-Sent Events (SSE) with progressive analysis results:
 * - status: Progress updates
 * - partial: Early results (skin type, individual conditions)
 * - complete: Final analysis with all data
 * - error: Error messages
 */

// Analysis prompt for streaming (shorter version for responsiveness)
const STREAMING_ANALYSIS_PROMPT = `Analyze this skin image for a professional skincare assessment.

Evaluate:
1. Skin type (oily, dry, combination, normal, sensitive)
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

export async function POST(request: NextRequest) {
  // Check if streaming is enabled
  if (!FEATURES.STREAMING) {
    return new Response(
      JSON.stringify({ error: 'Streaming is not enabled' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const encoder = new TextEncoder()

  // Create readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      try {
        // Parse form data
        const formData = await request.formData()
        const image = formData.get('image') as File | null

        // Validate image
        const validation = validateImageFile(image, 'image')
        if (!validation.valid) {
          sendEvent({ type: 'error', message: validation.error })
          controller.close()
          return
        }

        sendEvent({ type: 'status', message: 'Validating your photo...' })

        // Authenticate user
        const customerId = await getCustomerIdFromCookie()
        if (!customerId) {
          sendEvent({ type: 'error', message: 'Please log in to use the skin analyzer' })
          controller.close()
          return
        }

        // Check rate limit
        const rateLimitCheck = await checkAnalysisRateLimit(customerId)
        if (!rateLimitCheck.allowed) {
          sendEvent({ type: 'error', message: rateLimitCheck.error })
          controller.close()
          return
        }

        sendEvent({ type: 'status', message: 'Starting AI analysis...' })

        // Convert image to buffer and base64
        const buffer = Buffer.from(await image!.arrayBuffer())
        const base64 = buffer.toString('base64')
        const mediaType = image!.type as 'image/jpeg' | 'image/png' | 'image/webp'

        // Create analysis record
        const sessionId = generateSessionId()
        const analysis = await prisma.skinAnalysis.create({
          data: {
            sessionId,
            customerId,
            originalImage: '',
            conditions: [],
            status: 'PROCESSING',
          },
        })

        // Build request for streaming
        const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
        if (!ANTHROPIC_API_KEY) {
          sendEvent({ type: 'error', message: 'AI service unavailable' })
          controller.close()
          return
        }

        // Build system message with caching
        const systemMessage = FEATURES.PROMPT_CACHING
          ? buildCachedSystemMessage(false)
          : undefined

        const requestBody: Record<string, unknown> = {
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          stream: true,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: mediaType,
                    data: base64,
                  },
                },
                {
                  type: 'text',
                  text: STREAMING_ANALYSIS_PROMPT,
                },
              ],
            },
          ],
        }

        if (systemMessage) {
          requestBody.system = systemMessage
        }

        sendEvent({ type: 'status', message: 'Analyzing your skin...' })

        // Make streaming request to Anthropic
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
          console.error('Anthropic streaming error:', await response.text())
          // Use fallback analysis
          const fallback = getSmartFallbackAnalysis()
          sendEvent({
            type: 'complete',
            analysis: {
              skinType: fallback.skinType,
              conditions: fallback.conditions,
            },
            analysisId: analysis.id,
          })
          controller.close()
          return
        }

        const reader = response.body?.getReader()
        if (!reader) {
          sendEvent({ type: 'error', message: 'Failed to start analysis stream' })
          controller.close()
          return
        }

        const decoder = new TextDecoder()
        let streamBuffer = ''
        let fullText = ''
        let skinTypeFound = false
        const seenConditions = new Set<string>()

        // Process streaming response
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          streamBuffer += decoder.decode(value, { stream: true })
          const lines = streamBuffer.split('\n')
          streamBuffer = lines.pop() || ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const data = line.slice(6)
            if (data === '[DONE]') continue

            try {
              const event = JSON.parse(data)

              if (event.type === 'content_block_delta' && event.delta?.text) {
                fullText += event.delta.text

                // Try to extract skin type early
                if (!skinTypeFound) {
                  const skinTypeMatch = fullText.match(/"skinType"\s*:\s*"(\w+)"/)
                  if (skinTypeMatch) {
                    skinTypeFound = true
                    sendEvent({
                      type: 'partial',
                      field: 'skinType',
                      value: skinTypeMatch[1],
                    })
                    sendEvent({
                      type: 'status',
                      message: `Detected ${skinTypeMatch[1]} skin...`,
                    })
                  }
                }

                // Try to extract conditions as they appear
                const conditionRegex = /\{\s*"id"\s*:\s*"([^"]+)"\s*,\s*"name"\s*:\s*"([^"]+)"\s*,\s*"confidence"\s*:\s*([\d.]+)/g
                let match
                while ((match = conditionRegex.exec(fullText)) !== null) {
                  if (!seenConditions.has(match[1])) {
                    seenConditions.add(match[1])
                    sendEvent({
                      type: 'condition',
                      id: match[1],
                      name: match[2],
                      confidence: parseFloat(match[3]),
                    })
                    sendEvent({
                      type: 'status',
                      message: `Found: ${match[2]}`,
                    })
                  }
                }
              }

              if (event.type === 'message_stop') {
                // Parse complete response
                const parsed = parseAIJsonResponse<{
                  skinType: SkinType
                  conditions: DetectedCondition[]
                }>(fullText)

                if (parsed) {
                  // Process and upload image (PNG lossless)
                  const compressedBuffer = await compressImage(buffer)
                  const imageUrl = await uploadImage(
                    compressedBuffer,
                    `skin-analysis/${customerId}-${sessionId}.png`
                  )

                  // Build recommendations
                  const { recommendations, advice } = await buildAnalysisResults(
                    parsed.skinType,
                    parsed.conditions
                  )

                  // Update analysis record
                  await prisma.skinAnalysis.update({
                    where: { id: analysis.id },
                    data: {
                      originalImage: imageUrl,
                      skinType: parsed.skinType,
                      conditions: JSON.parse(JSON.stringify(parsed.conditions)),
                      recommendations: JSON.parse(JSON.stringify(recommendations)),
                      advice: JSON.parse(JSON.stringify(advice)),
                      status: 'COMPLETED',
                    },
                  })

                  sendEvent({
                    type: 'complete',
                    analysis: {
                      skinType: parsed.skinType,
                      conditions: parsed.conditions,
                    },
                    analysisId: analysis.id,
                    recommendations: recommendations.slice(0, 3), // Top 3 for preview
                  })
                } else {
                  // Fallback if parsing fails
                  const fallback = getSmartFallbackAnalysis()
                  sendEvent({
                    type: 'complete',
                    analysis: fallback,
                    analysisId: analysis.id,
                  })
                }
              }
            } catch {
              // Continue on parse errors during streaming
            }
          }
        }

        controller.close()
      } catch (error) {
        console.error('Streaming analysis error:', error)
        sendEvent({ type: 'error', message: 'Analysis failed. Please try again.' })
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
