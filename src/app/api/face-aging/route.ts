import { NextRequest, NextResponse } from 'next/server'

// Hugging Face Inference API for age transformation
// Using the Gradio Space endpoint with authentication
const HF_SPACE_URL = 'https://penpen-age-transformation.hf.space'
const HF_INFERENCE_URL = 'https://api-inference.huggingface.co/models'

interface AgeTransformRequest {
  imageUrl: string
  currentAge: number
  targetAge: number
}

export async function POST(request: NextRequest) {
  try {
    const body: AgeTransformRequest = await request.json()
    const { imageUrl, currentAge, targetAge } = body

    if (!imageUrl || currentAge === undefined || targetAge === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: imageUrl, currentAge, targetAge' },
        { status: 400 }
      )
    }

    // Check if HF token is configured
    const hfToken = process.env.HUGGINGFACE_API_TOKEN
    if (!hfToken) {
      console.warn('HUGGINGFACE_API_TOKEN not configured, using CSS fallback')
      return NextResponse.json(
        { error: 'AI service not configured', fallback: true },
        { status: 503 }
      )
    }

    // Fetch the image and convert to base64
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch source image' },
        { status: 400 }
      )
    }

    const imageBuffer = await imageResponse.arrayBuffer()
    const base64Image = Buffer.from(imageBuffer).toString('base64')
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg'
    const dataUrl = `data:${mimeType};base64,${base64Image}`

    // Try Gradio Space API first (with authentication)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${hfToken}`,
    }

    // Gradio 4.x uses /call endpoint
    const callResponse = await fetch(`${HF_SPACE_URL}/call/predict`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        data: [
          dataUrl,      // Input image as data URL
          currentAge,   // Current age
          targetAge,    // Target age
        ],
      }),
    })

    if (callResponse.ok) {
      const callResult = await callResponse.json()
      const eventId = callResult.event_id

      if (eventId) {
        // Poll for result using SSE or direct fetch
        const resultResponse = await fetch(`${HF_SPACE_URL}/call/predict/${eventId}`, {
          headers: { 'Authorization': `Bearer ${hfToken}` },
        })

        if (resultResponse.ok) {
          const resultText = await resultResponse.text()
          // Parse SSE format: data: {...}
          const lines = resultText.split('\n')
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                if (data && Array.isArray(data) && data[0]) {
                  return NextResponse.json({
                    success: true,
                    transformedImage: data[0],
                  })
                }
              } catch {
                // Continue parsing
              }
            }
          }
        }
      }
    }

    // Fallback to legacy /api/predict endpoint
    const legacyResponse = await fetch(`${HF_SPACE_URL}/api/predict`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        data: [dataUrl, currentAge, targetAge],
      }),
    })

    if (legacyResponse.ok) {
      const result = await legacyResponse.json()
      const transformedImage = result.data?.[0]

      if (transformedImage) {
        return NextResponse.json({
          success: true,
          transformedImage,
        })
      }
    }

    // Try /run/predict as last resort
    const runResponse = await fetch(`${HF_SPACE_URL}/run/predict`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        data: [dataUrl, currentAge, targetAge],
      }),
    })

    if (runResponse.ok) {
      const result = await runResponse.json()
      const transformedImage = result.data?.[0]

      if (transformedImage) {
        return NextResponse.json({
          success: true,
          transformedImage,
        })
      }
    }

    // All attempts failed
    console.error('All HF Space endpoints failed')
    return NextResponse.json(
      { error: 'Age transformation service unavailable', fallback: true },
      { status: 503 }
    )

  } catch (error) {
    console.error('Face aging error:', error)
    return NextResponse.json(
      { error: 'Failed to process age transformation', fallback: true },
      { status: 500 }
    )
  }
}
