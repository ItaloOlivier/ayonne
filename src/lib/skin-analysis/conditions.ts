// Skin condition definitions and mappings

export interface SkinCondition {
  id: string
  name: string
  description: string
  severity: 'mild' | 'moderate' | 'severe'
  icon: string
}

export interface DetectedCondition {
  id: string
  name: string
  confidence: number
  description: string
}

export const SKIN_TYPES = {
  oily: {
    name: 'Oily',
    description: 'Your skin produces excess sebum, giving it a shiny appearance. You may be prone to enlarged pores and acne.',
    characteristics: ['Shiny appearance', 'Enlarged pores', 'Prone to breakouts'],
  },
  dry: {
    name: 'Dry',
    description: 'Your skin lacks moisture and natural oils, which can lead to tightness, flaking, and sensitivity.',
    characteristics: ['Tight feeling', 'Flaky patches', 'Fine lines more visible'],
  },
  combination: {
    name: 'Combination',
    description: 'You have both oily and dry areas - typically an oily T-zone (forehead, nose, chin) with drier cheeks.',
    characteristics: ['Oily T-zone', 'Dry cheeks', 'Mixed concerns'],
  },
  normal: {
    name: 'Normal',
    description: 'Your skin is well-balanced with adequate moisture and minimal issues. Lucky you!',
    characteristics: ['Balanced moisture', 'Small pores', 'Even texture'],
  },
  sensitive: {
    name: 'Sensitive',
    description: 'Your skin reacts easily to products and environmental factors, often becoming red or irritated.',
    characteristics: ['Easily irritated', 'Prone to redness', 'Reacts to products'],
  },
} as const

export type SkinType = keyof typeof SKIN_TYPES

export const SKIN_CONDITIONS = {
  acne: {
    name: 'Acne',
    description: 'Active breakouts or blemishes detected. This is often caused by excess oil, bacteria, or hormonal changes.',
    icon: '🔴',
    relatedProducts: ['cleansers', 'treatments', 'serums'],
    relatedCategories: ['acne', 'blemish', 'clarifying'],
  },
  wrinkles: {
    name: 'Wrinkles',
    description: 'Fine lines and wrinkles are visible. These are natural signs of aging that can be minimized with proper skincare.',
    icon: '〰️',
    relatedProducts: ['anti-aging-serums', 'moisturizers'],
    relatedCategories: ['anti-aging', 'retinol', 'firming'],
  },
  fine_lines: {
    name: 'Fine Lines',
    description: 'Early signs of aging with subtle lines appearing, particularly around eyes and mouth.',
    icon: '📏',
    relatedProducts: ['anti-aging-serums', 'eye-creams'],
    relatedCategories: ['anti-aging', 'prevention'],
  },
  dark_spots: {
    name: 'Dark Spots',
    description: 'Hyperpigmentation or uneven skin tone detected. This can be caused by sun damage, acne scars, or hormonal changes.',
    icon: '🔵',
    relatedProducts: ['serums', 'treatments'],
    relatedCategories: ['brightening', 'vitamin-c', 'niacinamide'],
  },
  redness: {
    name: 'Redness',
    description: 'Areas of redness or inflammation visible. This could indicate sensitivity, rosacea, or irritation.',
    icon: '🩹',
    relatedProducts: ['soothing', 'moisturizers'],
    relatedCategories: ['calming', 'sensitive', 'anti-inflammatory'],
  },
  dryness: {
    name: 'Dryness',
    description: 'Dry patches or dehydration detected. Your skin needs more moisture and hydration.',
    icon: '💧',
    relatedProducts: ['moisturizers', 'hydrating-serums'],
    relatedCategories: ['hydrating', 'moisturizing', 'barrier-repair'],
  },
  oiliness: {
    name: 'Excess Oil',
    description: 'Excess shine and oil production detected. This can lead to clogged pores and breakouts.',
    icon: '✨',
    relatedProducts: ['cleansers', 'toners'],
    relatedCategories: ['oil-control', 'mattifying', 'pore-minimizing'],
  },
  dark_circles: {
    name: 'Dark Circles',
    description: 'Dark circles under the eyes detected. These can be caused by fatigue, genetics, or aging.',
    icon: '👁️',
    relatedProducts: ['eye-creams', 'serums'],
    relatedCategories: ['eye-care', 'brightening', 'caffeine'],
  },
  enlarged_pores: {
    name: 'Enlarged Pores',
    description: 'Visible enlarged pores detected. These can be minimized with proper cleansing and exfoliation.',
    icon: '⚫',
    relatedProducts: ['toners', 'serums'],
    relatedCategories: ['pore-minimizing', 'exfoliating', 'niacinamide'],
  },
  sun_damage: {
    name: 'Sun Damage',
    description: 'Signs of sun damage visible. This includes uneven pigmentation and premature aging signs.',
    icon: '☀️',
    relatedProducts: ['serums', 'treatments'],
    relatedCategories: ['brightening', 'antioxidant', 'vitamin-c'],
  },
  dullness: {
    name: 'Dull Skin',
    description: 'Your skin appears dull and lacks radiance. This can be improved with exfoliation and brightening products.',
    icon: '🌫️',
    relatedProducts: ['serums', 'exfoliants'],
    relatedCategories: ['brightening', 'exfoliating', 'radiance'],
  },
  uneven_texture: {
    name: 'Uneven Texture',
    description: 'Skin texture appears rough or uneven. Regular exfoliation and hydration can help smooth the skin.',
    icon: '🏔️',
    relatedProducts: ['exfoliants', 'serums'],
    relatedCategories: ['smoothing', 'resurfacing', 'aha-bha'],
  },
} as const

export type SkinConditionType = keyof typeof SKIN_CONDITIONS

// Map Hugging Face model labels to our conditions
export const HUGGINGFACE_LABEL_MAPPING: Record<string, SkinConditionType | SkinType> = {
  // Skin types
  'oily': 'oily',
  'Oily': 'oily',
  'dry': 'dry',
  'Dry': 'dry',
  'normal': 'normal',
  'Normal': 'normal',
  'combination': 'combination',
  'sensitive': 'sensitive',

  // Conditions
  'acne': 'acne',
  'Acne': 'acne',
  'wrinkles': 'wrinkles',
  'Wrinkles': 'wrinkles',
  'pigmentation': 'dark_spots',
  'hyperpigmentation': 'dark_spots',
  'dark spots': 'dark_spots',
  'redness': 'redness',
  'rosacea': 'redness',
  'dryness': 'dryness',
  'dehydration': 'dryness',
  'dark circles': 'dark_circles',
  'eye bags': 'dark_circles',
  'pores': 'enlarged_pores',
  'large pores': 'enlarged_pores',
  'sun damage': 'sun_damage',
  'age spots': 'sun_damage',
  'dull': 'dullness',
  'dullness': 'dullness',
}

// Parse AI model response into our condition format
export function parseConditions(
  modelResponse: Array<{ label: string; score: number }>
): { skinType: SkinType | null; conditions: DetectedCondition[] } {
  let skinType: SkinType | null = null
  const conditions: DetectedCondition[] = []

  for (const item of modelResponse) {
    const mapped = HUGGINGFACE_LABEL_MAPPING[item.label.toLowerCase()]

    if (!mapped) continue

    // Check if it's a skin type
    if (mapped in SKIN_TYPES) {
      if (!skinType || item.score > 0.5) {
        skinType = mapped as SkinType
      }
    } else if (mapped in SKIN_CONDITIONS) {
      const condition = SKIN_CONDITIONS[mapped as SkinConditionType]
      if (item.score > 0.3) { // Only include if confidence > 30%
        conditions.push({
          id: mapped,
          name: condition.name,
          confidence: item.score,
          description: condition.description,
        })
      }
    }
  }

  // Sort conditions by confidence
  conditions.sort((a, b) => b.confidence - a.confidence)

  return { skinType, conditions }
}

// Get all related product categories for detected conditions
export function getRelatedCategories(conditions: DetectedCondition[]): string[] {
  const categories = new Set<string>()

  for (const condition of conditions) {
    const conditionData = SKIN_CONDITIONS[condition.id as SkinConditionType]
    if (conditionData) {
      conditionData.relatedCategories.forEach(cat => categories.add(cat))
    }
  }

  return Array.from(categories)
}
