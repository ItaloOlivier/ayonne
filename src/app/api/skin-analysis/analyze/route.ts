import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCustomerIdFromCookie } from '@/lib/auth'
import { SkinType, DetectedCondition } from '@/lib/skin-analysis/conditions'
import {
  generateSessionId,
  compressImage,
  callAnthropicAPI,
  parseAIJsonResponse,
  uploadImage,
  validateImageFile,
  checkAnalysisRateLimit,
  buildAnalysisResults,
  getSmartFallbackAnalysis,
} from '@/lib/skin-analysis/analyzer'

// Comprehensive skin analysis prompt
const SKIN_ANALYSIS_PROMPT = `You are a board-certified dermatologist conducting a professional skin assessment for personalized skincare recommendations. Analyze this facial photograph with clinical precision.

## ANALYSIS PROTOCOL

### Step 1: Image Quality Assessment
First, evaluate the image quality. Consider:
- Lighting conditions (natural vs artificial, even vs harsh shadows)
- Image clarity and focus
- Face visibility and angle
- Presence of makeup or filters

If image quality significantly impacts accuracy, adjust confidence scores accordingly.

### Step 2: Skin Type Classification
Determine the PRIMARY skin type based on these clinical indicators:

**OILY**: Visible shine/sebum especially on T-zone, enlarged pores, thick skin texture
**DRY**: Matte appearance, tight feeling look, visible flaking, fine dehydration lines, dull complexion
**COMBINATION**: Oily T-zone (forehead, nose, chin) with normal-to-dry cheeks
**NORMAL**: Balanced sebum, minimal visible pores, even texture, healthy glow
**SENSITIVE**: Visible redness, reactive appearance, thin/translucent skin, visible capillaries

### Step 3: Condition Detection
Analyze for each condition. Only report conditions with clear visual evidence:

| Condition ID | What to Look For |
|-------------|------------------|
| acne | Active pimples, pustules, papules, comedones (blackheads/whiteheads), post-acne marks |
| fine_lines | Shallow surface lines, typically around eyes and mouth, more visible with movement |
| wrinkles | Deeper creases, static lines visible at rest, commonly on forehead and around eyes |
| dark_spots | Hyperpigmentation, sun spots, melasma patches, post-inflammatory marks |
| redness | Diffuse or localized redness, flushing, rosacea patterns, visible blood vessels |
| dryness | Flaky patches, rough texture, ashy appearance, tight-looking skin |
| oiliness | Visible shine, greasy appearance, especially in T-zone |
| dullness | Lack of radiance, grayish/sallow undertone, tired appearance |
| large_pores | Visibly enlarged pores, especially on nose, cheeks, and chin |
| uneven_texture | Bumpy surface, rough patches, orange-peel texture, scarring |
| dark_circles | Discoloration under eyes, hollowness, purple/brown undertones |
| dehydration | Surface dryness despite potential oiliness, crepey texture, plumping needed |

### Step 4: Confidence Calibration
Assign confidence scores using this scale:
- **0.9-1.0**: Unmistakably present, clearly visible, primary concern
- **0.7-0.89**: Clearly visible, moderate severity
- **0.5-0.69**: Present but mild, or partially obscured by image quality
- **0.3-0.49**: Subtle signs, early stage, or uncertain due to image

### Step 5: Description Quality
Write descriptions that:
- Are specific to what YOU observe in THIS image
- Use professional but accessible language
- Note location on face when relevant (e.g., "around the eye area", "on cheeks")
- Are 1-2 sentences maximum

## IMPORTANT GUIDELINES

1. **Be Conservative**: Only report what you can clearly see. Healthy skin is a valid result.
2. **No Medical Diagnoses**: This is for cosmetic skincare recommendations, not medical diagnosis.
3. **Consider Context**: Lighting can create false shadows or shine. Factor this in.
4. **Prioritize**: List conditions by severity/visibility, most significant first.
5. **Limit Results**: Maximum 5 conditions. Quality over quantity.

## OUTPUT FORMAT

Respond with ONLY valid JSON (no markdown, no explanation):

{
  "skinType": "oily" | "dry" | "combination" | "normal" | "sensitive",
  "conditions": [
    {
      "id": "condition_id",
      "name": "Human Readable Name",
      "confidence": 0.0-1.0,
      "description": "Specific observation about this condition in the image"
    }
  ]
}

If no conditions are detected above threshold, return empty conditions array - this indicates healthy skin.`

// Analyze skin using Claude/Anthropic API
async function analyzeSkinWithAI(imageBase64: string): Promise<{
  skinType: SkinType | null
  conditions: DetectedCondition[]
}> {
  const content = await callAnthropicAPI([
    {
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/jpeg',
            data: imageBase64,
          },
        },
        {
          type: 'text',
          text: SKIN_ANALYSIS_PROMPT,
        },
      ],
    },
  ])

  if (!content) {
    return getSmartFallbackAnalysis()
  }

  const parsed = parseAIJsonResponse<{
    skinType: SkinType
    conditions: DetectedCondition[]
  }>(content)

  if (!parsed) {
    return getSmartFallbackAnalysis()
  }

  return {
    skinType: parsed.skinType,
    conditions: parsed.conditions || [],
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const imageFile = formData.get('image') as File | null
    const formCustomerId = formData.get('customerId') as string | null

    // Validate image
    const validation = validateImageFile(imageFile)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status }
      )
    }

    // Security: Verify customer from session cookie
    const authenticatedCustomerId = await getCustomerIdFromCookie()

    if (!authenticatedCustomerId) {
      return NextResponse.json(
        { error: 'Please log in to use the skin analyzer' },
        { status: 401 }
      )
    }

    if (formCustomerId && formCustomerId !== authenticatedCustomerId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const customerId = authenticatedCustomerId

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Invalid account. Please sign up again.' },
        { status: 401 }
      )
    }

    // Check rate limit
    const rateLimitCheck = await checkAnalysisRateLimit(customerId)
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { error: rateLimitCheck.error },
        { status: 429 }
      )
    }

    const sessionId = generateSessionId()

    // Convert to buffer and base64
    const arrayBuffer = await imageFile!.arrayBuffer()
    const imageBuffer = Buffer.from(arrayBuffer)
    const imageBase64 = imageBuffer.toString('base64')

    // Create initial analysis record
    const analysis = await prisma.skinAnalysis.create({
      data: {
        sessionId,
        customerId,
        originalImage: '',
        conditions: [],
        status: 'PROCESSING',
      },
    })

    // Run AI analysis (uses original quality for best results)
    const { skinType, conditions } = await analyzeSkinWithAI(imageBase64)

    // Compress and upload image
    const compressedBuffer = await compressImage(imageBuffer)
    const storedImageUrl = await uploadImage(
      compressedBuffer,
      `skin-analysis/${customerId}-${sessionId}.jpg`
    )

    // Build recommendations and advice
    const { recommendations, advice } = await buildAnalysisResults(skinType, conditions)

    // Update analysis record with results
    const updatedAnalysis = await prisma.skinAnalysis.update({
      where: { id: analysis.id },
      data: {
        originalImage: storedImageUrl,
        skinType,
        conditions: JSON.parse(JSON.stringify(conditions)),
        agedImage: null,
        recommendations: JSON.parse(JSON.stringify(recommendations)),
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
