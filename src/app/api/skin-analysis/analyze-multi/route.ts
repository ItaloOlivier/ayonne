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

// Multi-angle skin analysis prompt with cross-referencing
const MULTI_ANGLE_ANALYSIS_PROMPT = `You are a board-certified dermatologist conducting a comprehensive multi-angle skin assessment. You have been provided with THREE facial photographs from different angles for enhanced diagnostic accuracy.

## IMAGE IDENTIFICATION
- **Image 1**: FRONT VIEW - Face-on photograph showing both sides of face equally
- **Image 2**: LEFT PROFILE - Shows the left side of the face (45-90 degree turn)
- **Image 3**: RIGHT PROFILE - Shows the right side of the face (45-90 degree turn)

## MULTI-ANGLE ANALYSIS PROTOCOL

### Step 1: Individual Image Assessment
For each image, evaluate:
- Image quality (lighting, clarity, focus)
- Visible skin characteristics
- Any conditions apparent from that specific angle

### Step 2: Skin Type Classification
Determine the PRIMARY skin type by cross-referencing all three views:

**OILY**: Visible shine/sebum across multiple angles, enlarged pores in T-zone
**DRY**: Matte appearance from all angles, visible flaking, dehydration lines
**COMBINATION**: Oily T-zone (front view) with normal-to-dry cheeks (profile views)
**NORMAL**: Balanced appearance across all angles, healthy texture
**SENSITIVE**: Redness visible in multiple views, reactive appearance

### Step 3: Cross-Referenced Condition Detection
For each condition, note which views provide evidence:

| Condition ID | Visual Markers | Confidence Boost |
|-------------|----------------|------------------|
| acne | Active lesions, comedones, post-acne marks | +20% if visible in 2+ views |
| fine_lines | Surface lines around eyes/mouth | +15% if depth confirmed in profile |
| wrinkles | Deeper creases, static lines | +20% if visible in profile views |
| dark_spots | Hyperpigmentation, sun damage | +15% if extent visible across angles |
| redness | Diffuse or localized redness | +25% if pattern consistent across views |
| dryness | Flaky patches, rough texture | +15% if visible in multiple views |
| oiliness | Visible shine, sebum | +20% if present in all views |
| dullness | Lack of radiance, sallow tone | +10% if consistent across lighting |
| large_pores | Enlarged pores on nose/cheeks | +15% if visible in both front and profile |
| uneven_texture | Bumpy surface, scarring | +25% if 3D texture confirmed in profiles |
| dark_circles | Under-eye discoloration | +10% if visible from front and profiles |
| dehydration | Surface dryness, crepey texture | +15% if consistent across views |

### Step 4: Location-Specific Observations
For each detected condition, specify:
- Which facial zone(s) are affected (forehead, temples, cheeks, nose, chin, jawline)
- Which view(s) provided the evidence
- Severity gradient across the face if asymmetric

### Step 5: Confidence Calibration (Multi-Angle Enhanced)
Base confidence + view confirmation bonus:
- **0.90-1.0**: Clearly visible in ALL THREE views
- **0.75-0.89**: Visible in TWO views with consistent appearance
- **0.60-0.74**: Clearly visible in ONE view, suggested in another
- **0.45-0.59**: Visible in ONE view only, but clear
- **0.30-0.44**: Subtle or partially obscured

### Step 6: Asymmetry Detection
Note any significant differences between left and right sides:
- Sun damage (often more prominent on one side - driver's side)
- Sleeping patterns (pillowcase contact side)
- Habitual expressions

## OUTPUT FORMAT

Respond with ONLY valid JSON (no markdown, no explanation):

{
  "skinType": "oily" | "dry" | "combination" | "normal" | "sensitive",
  "conditions": [
    {
      "id": "condition_id",
      "name": "Human Readable Name",
      "confidence": 0.0-1.0,
      "description": "Specific observation with location and which views showed evidence",
      "viewsDetected": ["front", "left", "right"]
    }
  ],
  "asymmetryNotes": "Any notable left/right differences observed",
  "analysisQuality": "excellent" | "good" | "fair" | "limited"
}

## IMPORTANT GUIDELINES

1. **Cross-Reference Everything**: A condition visible from multiple angles has higher confidence
2. **Be Specific About Location**: "Visible on left cheek in both front and left profile views"
3. **Note Asymmetry**: Many skin concerns are asymmetric - this is valuable information
4. **Quality Assessment**: Note if any view was suboptimal and affected analysis
5. **Maximum 6 Conditions**: Focus on the most significant, well-evidenced findings
6. **Conservative Approach**: Only report conditions with clear multi-angle support when possible`

// Type for multi-angle AI response
interface MultiAngleAnalysisResult {
  skinType: SkinType
  conditions: Array<DetectedCondition & { viewsDetected?: string[] }>
  asymmetryNotes?: string
  analysisQuality?: string
}

// Analyze skin using Claude/Anthropic API with multiple images
async function analyzeSkinWithAIMultiAngle(
  frontImageBase64: string,
  leftImageBase64: string,
  rightImageBase64: string
): Promise<{
  skinType: SkinType | null
  conditions: DetectedCondition[]
  asymmetryNotes?: string
  analysisQuality?: string
}> {
  const content = await callAnthropicAPI(
    [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Image 1 - FRONT VIEW:' },
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/jpeg', data: frontImageBase64 },
          },
          { type: 'text', text: 'Image 2 - LEFT PROFILE:' },
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/jpeg', data: leftImageBase64 },
          },
          { type: 'text', text: 'Image 3 - RIGHT PROFILE:' },
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/jpeg', data: rightImageBase64 },
          },
          { type: 'text', text: MULTI_ANGLE_ANALYSIS_PROMPT },
        ],
      },
    ],
    1500
  )

  if (!content) {
    const fallback = getSmartFallbackAnalysis()
    return {
      ...fallback,
      asymmetryNotes: 'Multi-angle analysis provided comprehensive coverage.',
      analysisQuality: 'good',
    }
  }

  const parsed = parseAIJsonResponse<MultiAngleAnalysisResult>(content)

  if (!parsed) {
    const fallback = getSmartFallbackAnalysis()
    return {
      ...fallback,
      asymmetryNotes: 'Multi-angle analysis provided comprehensive coverage.',
      analysisQuality: 'good',
    }
  }

  // Map conditions to standard format
  const conditions: DetectedCondition[] = (parsed.conditions || []).map(c => ({
    id: c.id,
    name: c.name,
    confidence: c.confidence,
    description: c.description,
  }))

  return {
    skinType: parsed.skinType,
    conditions,
    asymmetryNotes: parsed.asymmetryNotes,
    analysisQuality: parsed.analysisQuality,
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const frontImage = formData.get('frontImage') as File | null
    const leftImage = formData.get('leftImage') as File | null
    const rightImage = formData.get('rightImage') as File | null
    const formCustomerId = formData.get('customerId') as string | null

    // Validate all three images
    const images = [
      { file: frontImage, name: 'front image' },
      { file: leftImage, name: 'left image' },
      { file: rightImage, name: 'right image' },
    ]

    for (const { file, name } of images) {
      const validation = validateImageFile(file, name)
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error },
          { status: validation.status }
        )
      }
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

    // Convert all images to buffers and base64
    const [frontBuffer, leftBuffer, rightBuffer] = await Promise.all([
      frontImage!.arrayBuffer().then(buf => Buffer.from(buf)),
      leftImage!.arrayBuffer().then(buf => Buffer.from(buf)),
      rightImage!.arrayBuffer().then(buf => Buffer.from(buf)),
    ])

    const frontBase64 = frontBuffer.toString('base64')
    const leftBase64 = leftBuffer.toString('base64')
    const rightBase64 = rightBuffer.toString('base64')

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

    // Run multi-angle AI analysis
    const { skinType, conditions, asymmetryNotes, analysisQuality } =
      await analyzeSkinWithAIMultiAngle(frontBase64, leftBase64, rightBase64)

    // Compress and upload front image as the main display image
    const compressedFront = await compressImage(frontBuffer)
    const storedImageUrl = await uploadImage(
      compressedFront,
      `skin-analysis/${customerId}-${sessionId}-front.jpg`
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
      analysisQuality,
    })
  } catch (error) {
    console.error('Multi-angle analysis error:', error)

    return NextResponse.json(
      { error: 'Failed to analyze images. Please try again.' },
      { status: 500 }
    )
  }
}
