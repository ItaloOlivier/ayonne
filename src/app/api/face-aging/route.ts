import { NextRequest, NextResponse } from 'next/server'

// Replicate API for SAM (Style-based Age Manipulation) model
// https://replicate.com/yuval-alaluf/sam
const REPLICATE_API_URL = 'https://api.replicate.com/v1/predictions'
const SAM_MODEL_VERSION = '9222a21c181b707209ef12b5e0d7e94c994b58f01c7b2fec075d2e892362f13c'

interface AgeTransformRequest {
  imageUrl: string
  targetAge: number
}

export async function POST(request: NextRequest) {
  try {
    const body: AgeTransformRequest = await request.json()
    const { imageUrl, targetAge } = body

    if (!imageUrl || targetAge === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: imageUrl, targetAge' },
        { status: 400 }
      )
    }

    // Check if Replicate token is configured
    const replicateToken = process.env.REPLICATE_API_TOKEN
    if (!replicateToken) {
      console.warn('REPLICATE_API_TOKEN not configured, using CSS fallback')
      return NextResponse.json(
        { error: 'AI service not configured', fallback: true },
        { status: 503 }
      )
    }

    // SAM model accepts target ages as strings: "0", "10", "20", "30", "40", "50", "60", "70", "80", "90", "100"
    // Round to nearest decade for the model
    const roundedAge = Math.round(targetAge / 10) * 10
    const clampedAge = Math.max(0, Math.min(100, roundedAge))
    const targetAgeString = clampedAge.toString()

    // Create prediction request to Replicate
    const createResponse = await fetch(REPLICATE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${replicateToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait', // Wait for result (up to 60 seconds)
      },
      body: JSON.stringify({
        version: SAM_MODEL_VERSION,
        input: {
          image: imageUrl,
          target_age: targetAgeString,
        },
      }),
    })

    if (!createResponse.ok) {
      const error = await createResponse.text()
      console.error('Replicate API error:', error)
      return NextResponse.json(
        { error: 'Age transformation service error', fallback: true },
        { status: 503 }
      )
    }

    const prediction = await createResponse.json()

    // If using "Prefer: wait", the response may already have the output
    if (prediction.status === 'succeeded' && prediction.output) {
      return NextResponse.json({
        success: true,
        transformedImage: prediction.output,
        targetAge: clampedAge,
      })
    }

    // If not complete, poll for result
    if (prediction.status === 'starting' || prediction.status === 'processing') {
      const resultUrl = prediction.urls?.get || `${REPLICATE_API_URL}/${prediction.id}`

      // Poll for up to 60 seconds
      const maxAttempts = 30
      for (let i = 0; i < maxAttempts; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds

        const pollResponse = await fetch(resultUrl, {
          headers: {
            'Authorization': `Bearer ${replicateToken}`,
          },
        })

        if (!pollResponse.ok) continue

        const result = await pollResponse.json()

        if (result.status === 'succeeded' && result.output) {
          return NextResponse.json({
            success: true,
            transformedImage: result.output,
            targetAge: clampedAge,
          })
        }

        if (result.status === 'failed' || result.status === 'canceled') {
          console.error('Replicate prediction failed:', result.error)
          return NextResponse.json(
            { error: 'Age transformation failed', fallback: true },
            { status: 503 }
          )
        }
      }

      // Timeout
      return NextResponse.json(
        { error: 'Age transformation timed out', fallback: true },
        { status: 503 }
      )
    }

    // Unknown status
    console.error('Unexpected prediction status:', prediction.status)
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
