# Anthropic API Enhancements - Systems Engineering Implementation Plan

## Executive Summary

This document outlines the implementation plan for enhancing the Ayonne skin analysis platform with advanced Anthropic Claude API capabilities. These enhancements will improve analysis quality, reduce costs, and provide better user experience.

**Scope**: Extended Thinking, Tool Use, Prompt Caching, Streaming
**Excluded**: Chatbot feature (planned for future phase)

---

## 1. Extended Thinking for Complex Analysis

### Purpose
Enable Claude to perform deeper reasoning when analyzing complex skin conditions, particularly when multiple conditions interact or when analysis results seem contradictory.

### Implementation

#### 1.1 Create Extended Thinking Analyzer

**File**: `src/lib/skin-analysis/extended-analyzer.ts`

```typescript
import { env } from '@/lib/env'

interface ExtendedThinkingResponse {
  thinking: string
  analysis: SkinAnalysisResult
}

interface SkinAnalysisResult {
  skinType: string
  conditions: DetectedCondition[]
  reasoning: string
  confidence: number
}

export async function analyzeWithExtendedThinking(
  imageBase64: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp',
  userContext?: {
    age?: number
    concerns?: string[]
    previousAnalyses?: Array<{ date: string; skinType: string; conditions: string[] }>
  }
): Promise<ExtendedThinkingResponse> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
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
              text: buildExtendedAnalysisPrompt(userContext),
            },
          ],
        },
      ],
    }),
  })

  const data = await response.json()

  // Extract thinking and response blocks
  let thinking = ''
  let analysisText = ''

  for (const block of data.content) {
    if (block.type === 'thinking') {
      thinking = block.thinking
    } else if (block.type === 'text') {
      analysisText = block.text
    }
  }

  return {
    thinking,
    analysis: parseAnalysisResponse(analysisText),
  }
}

function buildExtendedAnalysisPrompt(context?: {
  age?: number
  concerns?: string[]
  previousAnalyses?: Array<{ date: string; skinType: string; conditions: string[] }>
}): string {
  let prompt = `Analyze this skin image for a professional skincare assessment.

IMPORTANT: Take your time to reason through the analysis carefully. Consider:
1. Overall skin type classification
2. Specific conditions visible in different facial zones
3. Severity and confidence levels for each finding
4. How conditions might interact or compound each other
5. Any contradictions or unusual patterns that need explanation`

  if (context?.age) {
    prompt += `\n\nUser's age: ${context.age} years old`
  }

  if (context?.concerns?.length) {
    prompt += `\n\nUser's reported concerns: ${context.concerns.join(', ')}`
  }

  if (context?.previousAnalyses?.length) {
    prompt += `\n\nPrevious analyses for trend comparison:`
    for (const prev of context.previousAnalyses.slice(-3)) {
      prompt += `\n- ${prev.date}: ${prev.skinType}, conditions: ${prev.conditions.join(', ')}`
    }
  }

  prompt += `

Return your analysis as JSON:
{
  "skinType": "oily|dry|combination|normal|sensitive",
  "conditions": [
    {
      "id": "condition_id",
      "name": "Condition Name",
      "confidence": 0.85,
      "description": "What you observed",
      "zone": "t-zone|cheeks|forehead|chin|full-face"
    }
  ],
  "reasoning": "Brief explanation of your overall assessment",
  "confidence": 0.9
}`

  return prompt
}
```

#### 1.2 Integration Points

- **Multi-angle analysis**: Use extended thinking when cross-referencing front/left/right images
- **Trend analysis**: Enable when comparing current analysis to historical data
- **Complex conditions**: Trigger when initial analysis detects 3+ conditions with varying confidence

---

## 2. Tool Use for Dynamic Features

### Purpose
Allow Claude to dynamically query the product database, check ingredient compatibility, and build personalized routines during analysis.

### Implementation

#### 2.1 Define Tool Schemas

**File**: `src/lib/skin-analysis/tools.ts`

```typescript
export const skinAnalysisTools = [
  {
    name: 'lookup_products',
    description: 'Search for skincare products that address specific skin conditions or concerns',
    input_schema: {
      type: 'object',
      properties: {
        conditions: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of skin conditions to find products for (e.g., "acne", "dryness", "fine_lines")',
        },
        skinType: {
          type: 'string',
          enum: ['oily', 'dry', 'combination', 'normal', 'sensitive'],
          description: 'The user\'s skin type',
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of products to return',
          default: 5,
        },
      },
      required: ['conditions', 'skinType'],
    },
  },
  {
    name: 'check_ingredient_compatibility',
    description: 'Check if specific skincare ingredients are safe to use together',
    input_schema: {
      type: 'object',
      properties: {
        ingredients: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of active ingredients to check compatibility for',
        },
      },
      required: ['ingredients'],
    },
  },
  {
    name: 'build_routine',
    description: 'Build a personalized AM/PM skincare routine based on conditions and product availability',
    input_schema: {
      type: 'object',
      properties: {
        skinType: { type: 'string' },
        conditions: { type: 'array', items: { type: 'string' } },
        budget: {
          type: 'string',
          enum: ['budget', 'mid-range', 'premium'],
          description: 'Price range preference',
        },
        existingProducts: {
          type: 'array',
          items: { type: 'string' },
          description: 'Products the user already owns',
        },
      },
      required: ['skinType', 'conditions'],
    },
  },
  {
    name: 'get_ingredient_benefits',
    description: 'Get detailed information about a skincare ingredient and its benefits',
    input_schema: {
      type: 'object',
      properties: {
        ingredient: {
          type: 'string',
          description: 'Name of the ingredient (e.g., "niacinamide", "retinol", "hyaluronic acid")',
        },
      },
      required: ['ingredient'],
    },
  },
]
```

#### 2.2 Tool Handler Implementation

**File**: `src/lib/skin-analysis/tool-handlers.ts`

```typescript
import { prisma } from '@/lib/prisma'
import { SKIN_CONDITIONS } from './conditions'

export async function handleToolCall(
  toolName: string,
  toolInput: Record<string, unknown>
): Promise<string> {
  switch (toolName) {
    case 'lookup_products':
      return await handleProductLookup(toolInput)
    case 'check_ingredient_compatibility':
      return await handleIngredientCompatibility(toolInput)
    case 'build_routine':
      return await handleBuildRoutine(toolInput)
    case 'get_ingredient_benefits':
      return await handleIngredientBenefits(toolInput)
    default:
      return JSON.stringify({ error: `Unknown tool: ${toolName}` })
  }
}

async function handleProductLookup(input: {
  conditions: string[]
  skinType: string
  maxResults?: number
}): Promise<string> {
  const { conditions, skinType, maxResults = 5 } = input

  // Map conditions to product tags/categories
  const conditionTags = conditions.flatMap(c => {
    const condition = SKIN_CONDITIONS[c]
    return condition?.productTags || [c]
  })

  const products = await prisma.product.findMany({
    where: {
      OR: [
        { tags: { hasSome: conditionTags } },
        { skinTypes: { has: skinType } },
        { targetConcerns: { hasSome: conditions } },
      ],
      inStock: true,
    },
    orderBy: { rating: 'desc' },
    take: maxResults,
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      salePrice: true,
      description: true,
      keyIngredients: true,
      skinTypes: true,
      targetConcerns: true,
    },
  })

  return JSON.stringify({
    products,
    count: products.length,
    searchCriteria: { conditions, skinType },
  })
}

async function handleIngredientCompatibility(input: {
  ingredients: string[]
}): Promise<string> {
  const { ingredients } = input

  // Ingredient interaction database
  const interactions: Record<string, { conflicts: string[]; enhances: string[] }> = {
    'retinol': {
      conflicts: ['benzoyl peroxide', 'vitamin c', 'aha', 'bha'],
      enhances: ['hyaluronic acid', 'niacinamide', 'peptides'],
    },
    'vitamin c': {
      conflicts: ['retinol', 'benzoyl peroxide', 'niacinamide'],
      enhances: ['vitamin e', 'ferulic acid', 'hyaluronic acid'],
    },
    'niacinamide': {
      conflicts: ['vitamin c'],
      enhances: ['hyaluronic acid', 'retinol', 'salicylic acid'],
    },
    'aha': {
      conflicts: ['retinol', 'benzoyl peroxide'],
      enhances: ['hyaluronic acid', 'niacinamide'],
    },
    'bha': {
      conflicts: ['retinol'],
      enhances: ['niacinamide', 'hyaluronic acid'],
    },
    'benzoyl peroxide': {
      conflicts: ['retinol', 'vitamin c', 'aha'],
      enhances: ['niacinamide'],
    },
  }

  const results: Array<{
    pair: [string, string]
    compatible: boolean
    note: string
  }> = []

  for (let i = 0; i < ingredients.length; i++) {
    for (let j = i + 1; j < ingredients.length; j++) {
      const ing1 = ingredients[i].toLowerCase()
      const ing2 = ingredients[j].toLowerCase()

      const ing1Data = interactions[ing1]
      const ing2Data = interactions[ing2]

      let compatible = true
      let note = 'Safe to use together'

      if (ing1Data?.conflicts.includes(ing2) || ing2Data?.conflicts.includes(ing1)) {
        compatible = false
        note = 'Not recommended together - may cause irritation or reduce effectiveness'
      } else if (ing1Data?.enhances.includes(ing2) || ing2Data?.enhances.includes(ing1)) {
        note = 'Great combination - these ingredients enhance each other'
      }

      results.push({ pair: [ing1, ing2], compatible, note })
    }
  }

  return JSON.stringify({
    ingredients,
    interactions: results,
    allCompatible: results.every(r => r.compatible),
  })
}

async function handleBuildRoutine(input: {
  skinType: string
  conditions: string[]
  budget?: string
  existingProducts?: string[]
}): Promise<string> {
  const { skinType, conditions, budget = 'mid-range', existingProducts = [] } = input

  // Build routine structure
  const routine = {
    morning: {
      steps: [
        { step: 1, category: 'cleanser', purpose: 'Remove overnight buildup' },
        { step: 2, category: 'toner', purpose: 'Balance pH and prep skin', optional: true },
        { step: 3, category: 'serum', purpose: 'Target specific concerns' },
        { step: 4, category: 'moisturizer', purpose: 'Hydrate and protect' },
        { step: 5, category: 'sunscreen', purpose: 'UV protection (essential)' },
      ],
      products: [] as Array<{ step: number; product: unknown }>,
    },
    evening: {
      steps: [
        { step: 1, category: 'cleanser', purpose: 'Remove makeup and sunscreen' },
        { step: 2, category: 'treatment', purpose: 'Active ingredients (retinol, acids)' },
        { step: 3, category: 'serum', purpose: 'Target specific concerns' },
        { step: 4, category: 'moisturizer', purpose: 'Repair and hydrate overnight' },
        { step: 5, category: 'eye cream', purpose: 'Delicate eye area care', optional: true },
      ],
      products: [] as Array<{ step: number; product: unknown }>,
    },
    weeklyTreatments: [] as string[],
  }

  // Add condition-specific recommendations
  if (conditions.includes('acne')) {
    routine.weeklyTreatments.push('Clay mask (1-2x weekly)')
  }
  if (conditions.includes('dryness') || conditions.includes('dehydration')) {
    routine.weeklyTreatments.push('Hydrating sheet mask (2-3x weekly)')
  }
  if (conditions.includes('dullness')) {
    routine.weeklyTreatments.push('Exfoliating treatment (1-2x weekly)')
  }

  return JSON.stringify({
    routine,
    skinType,
    targetedConditions: conditions,
    budgetTier: budget,
    note: 'Introduce new products one at a time, waiting 1-2 weeks between additions',
  })
}

async function handleIngredientBenefits(input: {
  ingredient: string
}): Promise<string> {
  const ingredientDb: Record<string, {
    benefits: string[]
    bestFor: string[]
    usage: string
    cautions: string[]
  }> = {
    'niacinamide': {
      benefits: ['Reduces pore appearance', 'Controls oil', 'Brightens skin', 'Strengthens barrier'],
      bestFor: ['oily', 'combination', 'acne-prone'],
      usage: 'AM and PM, 2-5% concentration',
      cautions: ['May cause flushing in high concentrations'],
    },
    'retinol': {
      benefits: ['Reduces fine lines', 'Improves texture', 'Boosts collagen', 'Fades dark spots'],
      bestFor: ['aging', 'acne', 'uneven texture'],
      usage: 'PM only, start 2x weekly then increase',
      cautions: ['Causes sensitivity', 'Avoid during pregnancy', 'Use sunscreen'],
    },
    'hyaluronic acid': {
      benefits: ['Deep hydration', 'Plumps skin', 'Reduces fine lines', 'Suitable for all types'],
      bestFor: ['all skin types', 'dehydrated', 'aging'],
      usage: 'AM and PM, apply to damp skin',
      cautions: ['Apply to damp skin for best results'],
    },
    'salicylic acid': {
      benefits: ['Unclogs pores', 'Reduces acne', 'Exfoliates', 'Controls oil'],
      bestFor: ['oily', 'acne-prone', 'blackheads'],
      usage: 'PM or as spot treatment, 0.5-2%',
      cautions: ['Can be drying', 'Don\'t combine with other acids initially'],
    },
    'vitamin c': {
      benefits: ['Brightens', 'Antioxidant protection', 'Fades dark spots', 'Boosts collagen'],
      bestFor: ['dull skin', 'hyperpigmentation', 'aging'],
      usage: 'AM under sunscreen, 10-20%',
      cautions: ['Can oxidize quickly', 'May irritate sensitive skin'],
    },
  }

  const ingredient = input.ingredient.toLowerCase()
  const data = ingredientDb[ingredient]

  if (!data) {
    return JSON.stringify({
      ingredient,
      found: false,
      message: 'Ingredient not in database. Consult a dermatologist for specific advice.',
    })
  }

  return JSON.stringify({
    ingredient,
    found: true,
    ...data,
  })
}
```

#### 2.3 Analysis with Tool Use

**File**: `src/lib/skin-analysis/tool-use-analyzer.ts`

```typescript
import { skinAnalysisTools } from './tools'
import { handleToolCall } from './tool-handlers'
import { env } from '@/lib/env'

export async function analyzeWithTools(
  imageBase64: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp'
): Promise<{
  analysis: SkinAnalysisResult
  recommendations: ProductRecommendation[]
  routine: RoutineRecommendation
}> {
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
          text: `Analyze this skin image and provide personalized recommendations.

After analyzing the skin:
1. Use lookup_products to find suitable products for the detected conditions
2. Use check_ingredient_compatibility to ensure recommended products work together
3. Use build_routine to create a personalized AM/PM routine

Provide a comprehensive analysis with actionable recommendations.`,
        },
      ],
    },
  ]

  let response = await callClaudeWithTools(messages)

  // Handle tool use loop
  while (response.stop_reason === 'tool_use') {
    const toolResults = []

    for (const block of response.content) {
      if (block.type === 'tool_use') {
        const result = await handleToolCall(block.name, block.input)
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: result,
        })
      }
    }

    messages.push({ role: 'assistant', content: response.content })
    messages.push({ role: 'user', content: toolResults })

    response = await callClaudeWithTools(messages)
  }

  // Parse final response
  return parseToolUseResponse(response)
}

async function callClaudeWithTools(messages: Array<{ role: string; content: unknown }>) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      tools: skinAnalysisTools,
      messages,
    }),
  })

  return response.json()
}
```

---

## 3. Prompt Caching for Cost Optimization

### Purpose
Cache static system prompts and analysis instructions to reduce token costs by up to 90%.

### Implementation

#### 3.1 Cached System Prompts

**File**: `src/lib/skin-analysis/cached-prompts.ts`

```typescript
// Mark large, static content for caching with cache_control
export const SKIN_ANALYSIS_SYSTEM_PROMPT = {
  type: 'text',
  text: `You are an expert dermatological AI assistant specializing in skin analysis for the Ayonne skincare platform.

## Your Expertise
- Board-certified dermatologist level knowledge
- Extensive training on skin conditions, types, and treatments
- Deep understanding of skincare ingredients and their interactions
- Familiarity with the Ayonne product line and formulations

## Analysis Protocol

### Skin Type Classification
Classify into one of five types:
1. **Oily**: Excess sebum production, shiny appearance, enlarged pores
2. **Dry**: Tight feeling, flakiness, rough texture, fine lines
3. **Combination**: Oily T-zone with dry/normal cheeks
4. **Normal**: Balanced, minimal issues, even texture
5. **Sensitive**: Reactive, prone to redness, easily irritated

### Condition Detection
Identify and rate confidence (0-1) for:
- **Acne**: Active breakouts, comedones, papules, pustules
- **Large Pores**: Visibly enlarged pores, typically in T-zone
- **Oiliness**: Excess shine, sebum visible
- **Dryness**: Flaking, rough patches, tight appearance
- **Dehydration**: Fine lines from water loss (different from dryness)
- **Fine Lines**: Early wrinkles, expression lines
- **Wrinkles**: Deeper set lines, loss of elasticity
- **Hyperpigmentation**: Dark spots, uneven tone, melasma
- **Redness**: Inflammation, rosacea indicators, irritation
- **Dullness**: Lack of radiance, tired appearance
- **Uneven Texture**: Rough areas, bumpy skin
- **Dark Circles**: Under-eye discoloration

### Severity Levels
- **Mild** (0.3-0.5 confidence): Barely noticeable, early stage
- **Moderate** (0.5-0.7 confidence): Clearly visible, needs attention
- **Significant** (0.7-0.85 confidence): Prominent, priority concern
- **Severe** (0.85-1.0 confidence): Very noticeable, requires focused treatment

## Response Format
Always respond with valid JSON matching the requested schema. Be specific about observations and locations on the face.

## Ethical Guidelines
- Never diagnose medical conditions - recommend dermatologist for concerns
- Be encouraging but honest about skin state
- Focus on improvement potential, not criticism
- Respect privacy and sensitivity around appearance`,
  cache_control: { type: 'ephemeral' },
}

export const MULTI_ANGLE_ANALYSIS_PROMPT = {
  type: 'text',
  text: `## Multi-Angle Analysis Protocol

When analyzing multiple angles (front, left profile, right profile):

### Cross-Reference Process
1. **Front View**: Overall assessment, T-zone, symmetry
2. **Left Profile**: Left cheek, jawline, temple area
3. **Right Profile**: Right cheek, jawline, temple area

### Consistency Checks
- Skin type should be consistent across all angles
- Note asymmetric conditions (e.g., more acne on one side)
- Adjust confidence based on visibility across angles

### Zone Mapping
- **T-Zone**: Best visible in front view
- **Cheeks**: Best visible in profile views
- **Jawline**: Compare profiles for consistency
- **Under-eye**: Front view primary, profiles for depth

### Aggregation Rules
- If condition visible in 3/3 angles: High confidence (+0.1)
- If condition visible in 2/3 angles: Standard confidence
- If condition visible in 1/3 angles: Lower confidence (-0.1)
- Note which angle revealed each condition`,
  cache_control: { type: 'ephemeral' },
}
```

#### 3.2 Cached Analysis Implementation

**File**: `src/lib/skin-analysis/cached-analyzer.ts`

```typescript
import { env } from '@/lib/env'
import { SKIN_ANALYSIS_SYSTEM_PROMPT, MULTI_ANGLE_ANALYSIS_PROMPT } from './cached-prompts'

export async function analyzeWithCaching(
  images: Array<{
    base64: string
    mediaType: 'image/jpeg' | 'image/png' | 'image/webp'
    angle: 'front' | 'left' | 'right'
  }>
): Promise<SkinAnalysisResult> {
  const isMultiAngle = images.length > 1

  // Build message with cached system content
  const systemContent = [
    SKIN_ANALYSIS_SYSTEM_PROMPT,
    ...(isMultiAngle ? [MULTI_ANGLE_ANALYSIS_PROMPT] : []),
  ]

  // User message with images
  const userContent = [
    ...images.map(img => ({
      type: 'image',
      source: {
        type: 'base64',
        media_type: img.mediaType,
        data: img.base64,
      },
    })),
    {
      type: 'text',
      text: isMultiAngle
        ? 'Analyze these three angles of the same face and provide a comprehensive skin assessment.'
        : 'Analyze this skin image and provide a comprehensive assessment.',
    },
  ]

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: systemContent,
      messages: [
        {
          role: 'user',
          content: userContent,
        },
      ],
    }),
  })

  const data = await response.json()

  // Log cache performance
  if (data.usage) {
    console.log('Cache performance:', {
      inputTokens: data.usage.input_tokens,
      cacheCreationTokens: data.usage.cache_creation_input_tokens || 0,
      cacheReadTokens: data.usage.cache_read_input_tokens || 0,
      outputTokens: data.usage.output_tokens,
      cacheSavings: data.usage.cache_read_input_tokens
        ? `${Math.round((data.usage.cache_read_input_tokens / data.usage.input_tokens) * 100)}%`
        : '0%',
    })
  }

  return parseAnalysisResponse(data.content[0].text)
}
```

### Cost Savings Projection

| Scenario | Without Cache | With Cache | Savings |
|----------|--------------|------------|---------|
| System prompt (~2000 tokens) | $0.006/call | $0.0006/call | 90% |
| 1000 analyses/month | $6.00 | $0.60 | $5.40 |
| 10000 analyses/month | $60.00 | $6.00 | $54.00 |

---

## 4. Streaming for Real-time Feedback

### Purpose
Provide users with real-time analysis progress and partial results while the full analysis completes.

### Implementation

#### 4.1 Streaming Analysis API

**File**: `src/app/api/skin-analysis/analyze-stream/route.ts`

```typescript
import { env } from '@/lib/env'
import { SKIN_ANALYSIS_SYSTEM_PROMPT } from '@/lib/skin-analysis/cached-prompts'

export async function POST(request: Request) {
  const formData = await request.formData()
  const image = formData.get('image') as File

  if (!image) {
    return Response.json({ error: 'No image provided' }, { status: 400 })
  }

  const buffer = await image.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')
  const mediaType = image.type as 'image/jpeg' | 'image/png' | 'image/webp'

  // Create streaming response
  const encoder = new TextEncoder()
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  // Start streaming analysis
  startStreamingAnalysis(base64, mediaType, writer, encoder)

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

async function startStreamingAnalysis(
  imageBase64: string,
  mediaType: string,
  writer: WritableStreamDefaultWriter,
  encoder: TextEncoder
) {
  try {
    // Send initial status
    await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'status', message: 'Starting analysis...' })}\n\n`))

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        stream: true,
        system: [SKIN_ANALYSIS_SYSTEM_PROMPT],
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
                text: 'Analyze this skin image. Return JSON with skinType and conditions array.',
              },
            ],
          },
        ],
      }),
    })

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()
    let buffer = ''
    let fullText = ''
    let skinTypeFound = false
    let conditionsStarted = false

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6)
        if (data === '[DONE]') continue

        try {
          const event = JSON.parse(data)

          if (event.type === 'content_block_delta' && event.delta?.text) {
            fullText += event.delta.text

            // Parse progressive updates
            if (!skinTypeFound && fullText.includes('"skinType"')) {
              const match = fullText.match(/"skinType"\s*:\s*"(\w+)"/)
              if (match) {
                skinTypeFound = true
                await writer.write(encoder.encode(
                  `data: ${JSON.stringify({
                    type: 'partial',
                    field: 'skinType',
                    value: match[1]
                  })}\n\n`
                ))
              }
            }

            if (!conditionsStarted && fullText.includes('"conditions"')) {
              conditionsStarted = true
              await writer.write(encoder.encode(
                `data: ${JSON.stringify({
                  type: 'status',
                  message: 'Analyzing skin conditions...'
                })}\n\n`
              ))
            }

            // Try to extract individual conditions as they stream
            const conditionMatches = fullText.matchAll(
              /\{\s*"id"\s*:\s*"([^"]+)"\s*,\s*"name"\s*:\s*"([^"]+)"\s*,\s*"confidence"\s*:\s*([\d.]+)/g
            )
            for (const match of conditionMatches) {
              await writer.write(encoder.encode(
                `data: ${JSON.stringify({
                  type: 'condition',
                  id: match[1],
                  name: match[2],
                  confidence: parseFloat(match[3])
                })}\n\n`
              ))
            }
          }

          if (event.type === 'message_stop') {
            // Parse complete response
            const jsonMatch = fullText.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
              const analysis = JSON.parse(jsonMatch[0])
              await writer.write(encoder.encode(
                `data: ${JSON.stringify({ type: 'complete', analysis })}\n\n`
              ))
            }
          }
        } catch (e) {
          // Continue on parse errors during streaming
        }
      }
    }
  } catch (error) {
    await writer.write(encoder.encode(
      `data: ${JSON.stringify({ type: 'error', message: 'Analysis failed' })}\n\n`
    ))
  } finally {
    await writer.close()
  }
}
```

#### 4.2 Client-side Streaming Hook

**File**: `src/hooks/useStreamingAnalysis.ts`

```typescript
'use client'

import { useState, useCallback } from 'react'

interface AnalysisProgress {
  status: string
  skinType?: string
  conditions: Array<{ id: string; name: string; confidence: number }>
  complete: boolean
  error?: string
}

export function useStreamingAnalysis() {
  const [progress, setProgress] = useState<AnalysisProgress>({
    status: 'idle',
    conditions: [],
    complete: false,
  })
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const analyze = useCallback(async (imageFile: File) => {
    setIsAnalyzing(true)
    setProgress({ status: 'Preparing image...', conditions: [], complete: false })

    const formData = new FormData()
    formData.append('image', imageFile)

    try {
      const response = await fetch('/api/skin-analysis/analyze-stream', {
        method: 'POST',
        body: formData,
      })

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response')

      const decoder = new TextDecoder()
      const seenConditions = new Set<string>()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value)
        const lines = text.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue

          try {
            const event = JSON.parse(line.slice(6))

            switch (event.type) {
              case 'status':
                setProgress(p => ({ ...p, status: event.message }))
                break

              case 'partial':
                if (event.field === 'skinType') {
                  setProgress(p => ({ ...p, skinType: event.value, status: `Detected ${event.value} skin` }))
                }
                break

              case 'condition':
                if (!seenConditions.has(event.id)) {
                  seenConditions.add(event.id)
                  setProgress(p => ({
                    ...p,
                    conditions: [...p.conditions, { id: event.id, name: event.name, confidence: event.confidence }],
                    status: `Found: ${event.name}`,
                  }))
                }
                break

              case 'complete':
                setProgress(p => ({
                  ...p,
                  complete: true,
                  status: 'Analysis complete',
                  ...event.analysis,
                }))
                break

              case 'error':
                setProgress(p => ({ ...p, error: event.message }))
                break
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    } catch (error) {
      setProgress(p => ({ ...p, error: 'Analysis failed. Please try again.' }))
    } finally {
      setIsAnalyzing(false)
    }
  }, [])

  return { analyze, progress, isAnalyzing }
}
```

#### 4.3 Streaming UI Component

**File**: `src/components/skin-analysis/StreamingAnalysisView.tsx`

```typescript
'use client'

import { useStreamingAnalysis } from '@/hooks/useStreamingAnalysis'

interface Props {
  imageFile: File | null
  onComplete: (analysis: AnalysisResult) => void
}

export default function StreamingAnalysisView({ imageFile, onComplete }: Props) {
  const { analyze, progress, isAnalyzing } = useStreamingAnalysis()

  useEffect(() => {
    if (imageFile && !isAnalyzing) {
      analyze(imageFile)
    }
  }, [imageFile])

  useEffect(() => {
    if (progress.complete && !progress.error) {
      onComplete(progress as AnalysisResult)
    }
  }, [progress.complete])

  return (
    <div className="bg-white rounded-2xl p-8 shadow-luxury">
      {/* Status Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-[#1C4444]/10 flex items-center justify-center">
            {progress.complete ? (
              <CheckIcon className="w-6 h-6 text-[#1C4444]" />
            ) : (
              <div className="w-6 h-6 border-2 border-[#1C4444] border-t-transparent rounded-full animate-spin" />
            )}
          </div>
          {!progress.complete && (
            <div className="absolute inset-0 rounded-full animate-pulse-ring bg-[#1C4444]/20" />
          )}
        </div>
        <div>
          <h3 className="text-lg font-medium text-[#1C4444]">
            {progress.complete ? 'Analysis Complete' : 'Analyzing Your Skin'}
          </h3>
          <p className="text-sm text-[#1C4444]/60">{progress.status}</p>
        </div>
      </div>

      {/* Skin Type - Appears when detected */}
      {progress.skinType && (
        <div className="mb-6 animate-elegant-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#1C4444]/5 rounded-full">
            <span className="text-sm text-[#1C4444]/60">Skin Type:</span>
            <span className="text-sm font-medium text-[#1C4444] capitalize">
              {progress.skinType}
            </span>
          </div>
        </div>
      )}

      {/* Conditions - Appear as detected */}
      {progress.conditions.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-[#1C4444]/60 uppercase tracking-wider">
            Detected Conditions
          </h4>
          <div className="space-y-2">
            {progress.conditions.map((condition, index) => (
              <div
                key={condition.id}
                className="flex items-center justify-between p-3 bg-[#F4EBE7] rounded-lg animate-slide-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <span className="text-sm font-medium text-[#1C4444]">
                  {condition.name}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-[#1C4444]/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#1C4444] rounded-full transition-all duration-500"
                      style={{ width: `${condition.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-[#1C4444]/60 w-10">
                    {Math.round(condition.confidence * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {progress.error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-lg">
          <p className="text-sm text-red-700">{progress.error}</p>
        </div>
      )}
    </div>
  )
}
```

---

## 5. Integration Architecture

### 5.1 Feature Flag System

```typescript
// src/lib/features.ts
export const FEATURES = {
  EXTENDED_THINKING: process.env.FEATURE_EXTENDED_THINKING === 'true',
  TOOL_USE: process.env.FEATURE_TOOL_USE === 'true',
  PROMPT_CACHING: process.env.FEATURE_PROMPT_CACHING === 'true',
  STREAMING: process.env.FEATURE_STREAMING === 'true',
}
```

### 5.2 Unified Analyzer Interface

```typescript
// src/lib/skin-analysis/unified-analyzer.ts
import { FEATURES } from '@/lib/features'
import { analyzeWithExtendedThinking } from './extended-analyzer'
import { analyzeWithTools } from './tool-use-analyzer'
import { analyzeWithCaching } from './cached-analyzer'
import { callAnthropicAPI } from './analyzer'

export async function analyzeSkin(
  images: ImageInput[],
  options: AnalysisOptions = {}
): Promise<AnalysisResult> {
  // Choose analyzer based on features and context
  const isComplex = options.previousAnalyses?.length > 2 || options.concerns?.length > 3
  const isMultiAngle = images.length > 1

  if (FEATURES.EXTENDED_THINKING && isComplex) {
    return analyzeWithExtendedThinking(images[0], options)
  }

  if (FEATURES.TOOL_USE && options.includeRecommendations) {
    return analyzeWithTools(images[0])
  }

  if (FEATURES.PROMPT_CACHING) {
    return analyzeWithCaching(images)
  }

  // Fallback to basic analysis
  return basicAnalysis(images[0])
}
```

---

## 6. Implementation Order

### Phase 1: Prompt Caching (Week 1)
1. Create cached prompt files
2. Update existing analyzer to use cached system prompts
3. Add cache performance logging
4. Monitor cost reduction

### Phase 2: Streaming (Week 2)
1. Create streaming API endpoint
2. Implement client-side hook
3. Build streaming UI component
4. Integrate with existing analysis flow

### Phase 3: Tool Use (Week 3-4)
1. Define tool schemas
2. Implement tool handlers
3. Build tool use analyzer
4. Test product recommendations via tools

### Phase 4: Extended Thinking (Week 4-5)
1. Implement extended thinking analyzer
2. Add complexity detection logic
3. Store thinking output for debugging
4. Test on complex multi-condition cases

---

## 7. Monitoring & Metrics

### Key Metrics to Track
- Cache hit rate (target: >80%)
- Time to first byte (streaming)
- Tool call frequency and latency
- Extended thinking trigger rate
- Cost per analysis (before/after)

### Logging Implementation

```typescript
// src/lib/skin-analysis/metrics.ts
export async function logAnalysisMetrics(metrics: {
  analysisId: string
  duration: number
  tokenUsage: TokenUsage
  features: string[]
  cacheHit: boolean
  toolCalls?: string[]
  thinkingUsed?: boolean
}) {
  // Log to your analytics/monitoring service
  console.log('[ANALYSIS_METRICS]', JSON.stringify(metrics))

  // Store in database for dashboards
  await prisma.analysisMetric.create({
    data: {
      analysisId: metrics.analysisId,
      durationMs: metrics.duration,
      inputTokens: metrics.tokenUsage.input_tokens,
      outputTokens: metrics.tokenUsage.output_tokens,
      cacheReadTokens: metrics.tokenUsage.cache_read_input_tokens || 0,
      features: metrics.features,
      toolCalls: metrics.toolCalls || [],
      extendedThinking: metrics.thinkingUsed || false,
    },
  })
}
```

---

## 8. Environment Variables

Add to `.env`:

```bash
# Feature Flags
FEATURE_EXTENDED_THINKING=true
FEATURE_TOOL_USE=true
FEATURE_PROMPT_CACHING=true
FEATURE_STREAMING=true

# Existing
ANTHROPIC_API_KEY=sk-ant-...
```

---

## 9. Testing Strategy

### Unit Tests
- Tool handlers return expected formats
- JSON parsing handles edge cases
- Cache control headers are set correctly

### Integration Tests
- Streaming produces valid SSE events
- Tool use loop terminates correctly
- Extended thinking returns both blocks

### Load Tests
- Cache performance under concurrent requests
- Streaming memory usage
- Tool call latency at scale

---

## Summary

This implementation plan adds four major Anthropic API capabilities:

1. **Extended Thinking**: Deep reasoning for complex skin conditions
2. **Tool Use**: Dynamic product lookup and routine building
3. **Prompt Caching**: 90% cost reduction on system prompts
4. **Streaming**: Real-time analysis feedback for better UX

Each feature is designed to be independently toggleable and backwards compatible with the existing analysis system.
