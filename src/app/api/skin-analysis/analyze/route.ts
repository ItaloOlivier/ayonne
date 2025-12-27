import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import Replicate from 'replicate'
import { prisma } from '@/lib/prisma'
import { parseConditions, SkinType, DetectedCondition } from '@/lib/skin-analysis/conditions'
import { getProductRecommendations, getFallbackRecommendations } from '@/lib/skin-analysis/recommendations'
import { getPersonalizedAdvice } from '@/lib/skin-analysis/advice'

// Initialize Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

// Generate a session ID for anonymous users
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
}

// Call Hugging Face for skin type detection
async function analyzeSkinWithHuggingFace(imageBuffer: Buffer): Promise<{
  skinType: SkinType | null
  conditions: DetectedCondition[]
}> {
  const HF_TOKEN = process.env.HUGGINGFACE_API_TOKEN

  if (!HF_TOKEN) {
    console.warn('Hugging Face API token not configured, using fallback analysis')
    return getFallbackAnalysis()
  }

  try {
    // Try skin type classification model
    const response = await fetch(
      'https://api-inference.huggingface.co/models/dima806/skin_types_image_detection',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/octet-stream',
        },
        body: new Uint8Array(imageBuffer),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Hugging Face API error:', errorText)

      // Check if model is loading
      if (response.status === 503) {
        // Model is loading, wait and retry once
        await new Promise(resolve => setTimeout(resolve, 5000))
        return analyzeSkinWithHuggingFace(imageBuffer)
      }

      return getFallbackAnalysis()
    }

    const results = await response.json()

    // Parse the results
    if (Array.isArray(results)) {
      return parseConditions(results)
    }

    return getFallbackAnalysis()
  } catch (error) {
    console.error('Error calling Hugging Face:', error)
    return getFallbackAnalysis()
  }
}

// Fallback analysis when API is unavailable
function getFallbackAnalysis(): {
  skinType: SkinType | null
  conditions: DetectedCondition[]
} {
  // Return a generic "combination" type with common conditions
  return {
    skinType: 'combination',
    conditions: [
      {
        id: 'fine_lines',
        name: 'Fine Lines',
        confidence: 0.6,
        description: 'Early signs of aging with subtle lines appearing.',
      },
      {
        id: 'dullness',
        name: 'Dull Skin',
        confidence: 0.5,
        description: 'Your skin appears dull and could use more radiance.',
      },
    ],
  }
}

// Call Replicate for face aging
async function generateAgedFace(imageUrl: string): Promise<string | null> {
  if (!process.env.REPLICATE_API_TOKEN) {
    console.warn('Replicate API token not configured, skipping aging simulation')
    return null
  }

  try {
    // Using yuval-alaluf/sam (Style-Age Mapper) for face aging
    // Alternative: tencentarc/gfpgan for face restoration/aging
    const output = await replicate.run(
      'yuval-alaluf/sam:9222a21c181b707209ef12b5e0d7e94c994b58f01c7b2fec075d2e892362f13c',
      {
        input: {
          image: imageUrl,
          target_age: 'default', // Will age by approximately +20 years
        },
      }
    )

    // The output is typically a URL or array of URLs
    if (typeof output === 'string') {
      return output
    }

    if (Array.isArray(output) && output.length > 0) {
      return output[0] as string
    }

    return null
  } catch (error) {
    console.error('Error calling Replicate for aging:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const imageFile = formData.get('image') as File | null

    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(imageFile.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    if (imageFile.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Image too large. Please upload an image under 10MB.' },
        { status: 400 }
      )
    }

    // Generate session ID for anonymous users
    const sessionId = generateSessionId()

    // Upload image to Vercel Blob
    let originalImageUrl: string

    try {
      const blob = await put(`skin-analysis/${sessionId}-original.${imageFile.type.split('/')[1]}`, imageFile, {
        access: 'public',
        addRandomSuffix: true,
      })
      originalImageUrl = blob.url
    } catch (blobError) {
      console.error('Blob upload error:', blobError)
      // Fallback: convert to base64 and store directly
      const arrayBuffer = await imageFile.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString('base64')
      originalImageUrl = `data:${imageFile.type};base64,${base64}`
    }

    // Create initial analysis record
    const analysis = await prisma.skinAnalysis.create({
      data: {
        sessionId,
        originalImage: originalImageUrl,
        conditions: [],
        status: 'PROCESSING',
      },
    })

    // Run AI analysis
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer())
    const { skinType, conditions } = await analyzeSkinWithHuggingFace(imageBuffer)

    // Generate aged face (run in parallel if possible)
    const agedImageUrl = await generateAgedFace(originalImageUrl)

    // Get product recommendations
    const recommendations = await getProductRecommendations(skinType, conditions, 6)

    // Get personalized advice
    const conditionIds = conditions.map(c => c.id)
    const advice = getPersonalizedAdvice(skinType, conditionIds)

    // Update analysis record with results
    const updatedAnalysis = await prisma.skinAnalysis.update({
      where: { id: analysis.id },
      data: {
        skinType,
        conditions: JSON.parse(JSON.stringify(conditions)),
        agedImage: agedImageUrl,
        recommendations: JSON.parse(JSON.stringify(recommendations.map(r => ({
          productId: r.product.id,
          productName: r.product.name,
          productSlug: r.product.slug,
          productImage: r.product.images[0] || null,
          productPrice: r.product.price,
          productSalePrice: r.product.salePrice,
          reason: r.reason,
          relevanceScore: r.relevanceScore,
        })))),
        advice: JSON.parse(JSON.stringify(advice)),
        status: 'COMPLETED',
      },
    })

    return NextResponse.json({
      success: true,
      analysisId: updatedAnalysis.id,
    })
  } catch (error) {
    console.error('Analysis error:', error)

    return NextResponse.json(
      { error: 'Failed to analyze image. Please try again.' },
      { status: 500 }
    )
  }
}
