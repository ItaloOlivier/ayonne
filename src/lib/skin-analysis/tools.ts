/**
 * Anthropic Tool Use Definitions for Skin Analysis
 *
 * These tools allow Claude to dynamically query the product database,
 * check ingredient compatibility, and build personalized routines.
 */

export interface Tool {
  name: string
  description: string
  input_schema: {
    type: 'object'
    properties: Record<string, unknown>
    required: string[]
  }
}

/**
 * Tool definitions for skin analysis
 */
export const skinAnalysisTools: Tool[] = [
  {
    name: 'lookup_products',
    description: 'Search for skincare products that address specific skin conditions or concerns. Use this to find products from the Ayonne catalog that would benefit the user.',
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
          description: "The user's skin type",
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of products to return (default: 5)',
        },
      },
      required: ['conditions', 'skinType'],
    },
  },
  {
    name: 'check_ingredient_compatibility',
    description: 'Check if specific skincare ingredients are safe to use together. Helps prevent recommending conflicting products.',
    input_schema: {
      type: 'object',
      properties: {
        ingredients: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of active ingredients to check compatibility for (e.g., "retinol", "vitamin c", "niacinamide")',
        },
      },
      required: ['ingredients'],
    },
  },
  {
    name: 'build_routine',
    description: 'Build a personalized AM/PM skincare routine based on detected conditions and available products.',
    input_schema: {
      type: 'object',
      properties: {
        skinType: {
          type: 'string',
          enum: ['oily', 'dry', 'combination', 'normal', 'sensitive'],
          description: "The user's skin type",
        },
        conditions: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of detected skin conditions',
        },
        priority: {
          type: 'string',
          enum: ['hydration', 'anti-aging', 'acne', 'brightening', 'soothing'],
          description: 'Primary skincare goal to prioritize',
        },
      },
      required: ['skinType', 'conditions'],
    },
  },
  {
    name: 'get_ingredient_benefits',
    description: 'Get detailed information about a skincare ingredient and its benefits for specific conditions.',
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

/**
 * Map condition IDs to product search terms
 */
export const CONDITION_TO_PRODUCT_TAGS: Record<string, string[]> = {
  acne: ['acne', 'blemish', 'clarifying', 'salicylic'],
  large_pores: ['pore-minimizing', 'mattifying', 'toner'],
  oiliness: ['oil-control', 'mattifying', 'balancing'],
  dryness: ['hydrating', 'moisturizing', 'nourishing'],
  dehydration: ['hydrating', 'hyaluronic', 'water-based'],
  fine_lines: ['anti-aging', 'retinol', 'peptide'],
  wrinkles: ['anti-aging', 'retinol', 'firming'],
  hyperpigmentation: ['brightening', 'vitamin-c', 'dark-spot'],
  redness: ['calming', 'soothing', 'sensitive'],
  dullness: ['brightening', 'exfoliating', 'vitamin-c'],
  uneven_texture: ['exfoliating', 'resurfacing', 'aha-bha'],
  dark_circles: ['eye-cream', 'caffeine', 'brightening'],
}

/**
 * Ingredient interaction database
 */
export const INGREDIENT_INTERACTIONS: Record<
  string,
  { conflicts: string[]; enhances: string[]; notes?: string }
> = {
  retinol: {
    conflicts: ['benzoyl peroxide', 'vitamin c', 'aha', 'bha', 'glycolic acid', 'salicylic acid'],
    enhances: ['hyaluronic acid', 'niacinamide', 'peptides', 'ceramides'],
    notes: 'Use only at night. Start with low concentrations.',
  },
  'vitamin c': {
    conflicts: ['retinol', 'benzoyl peroxide'],
    enhances: ['vitamin e', 'ferulic acid', 'hyaluronic acid'],
    notes: 'Best used in the morning for antioxidant protection.',
  },
  niacinamide: {
    conflicts: [],
    enhances: ['hyaluronic acid', 'retinol', 'salicylic acid', 'ceramides'],
    notes: 'Well-tolerated by most skin types. Can be layered with most actives.',
  },
  aha: {
    conflicts: ['retinol', 'benzoyl peroxide', 'vitamin c'],
    enhances: ['hyaluronic acid', 'niacinamide'],
    notes: 'Use sunscreen when using AHAs.',
  },
  bha: {
    conflicts: ['retinol'],
    enhances: ['niacinamide', 'hyaluronic acid'],
    notes: 'Good for oily and acne-prone skin.',
  },
  'benzoyl peroxide': {
    conflicts: ['retinol', 'vitamin c', 'aha'],
    enhances: ['niacinamide'],
    notes: 'Can bleach fabrics. Start with lower concentrations.',
  },
  'hyaluronic acid': {
    conflicts: [],
    enhances: ['vitamin c', 'retinol', 'niacinamide', 'peptides'],
    notes: 'Apply to damp skin for best results.',
  },
  peptides: {
    conflicts: ['aha', 'bha', 'vitamin c'],
    enhances: ['hyaluronic acid', 'retinol', 'ceramides'],
    notes: 'Great for anti-aging. Avoid with low-pH products.',
  },
  ceramides: {
    conflicts: [],
    enhances: ['hyaluronic acid', 'niacinamide', 'retinol'],
    notes: 'Essential for barrier repair.',
  },
  'salicylic acid': {
    conflicts: ['retinol'],
    enhances: ['niacinamide', 'hyaluronic acid'],
    notes: 'Oil-soluble, penetrates pores. Good for acne.',
  },
  'glycolic acid': {
    conflicts: ['retinol', 'vitamin c', 'other acids'],
    enhances: ['hyaluronic acid', 'niacinamide'],
    notes: 'Strong AHA. Start with lower concentrations.',
  },
}

/**
 * Ingredient benefits database
 */
export const INGREDIENT_BENEFITS: Record<
  string,
  {
    benefits: string[]
    bestFor: string[]
    usage: string
    cautions: string[]
  }
> = {
  niacinamide: {
    benefits: [
      'Reduces pore appearance',
      'Controls oil production',
      'Brightens skin tone',
      'Strengthens skin barrier',
      'Reduces inflammation',
    ],
    bestFor: ['oily', 'combination', 'acne-prone', 'sensitive'],
    usage: 'AM and PM, 2-5% concentration. Can be layered with most products.',
    cautions: ['May cause flushing in high concentrations (>10%)'],
  },
  retinol: {
    benefits: [
      'Reduces fine lines and wrinkles',
      'Improves skin texture',
      'Boosts collagen production',
      'Fades dark spots',
      'Unclogs pores',
    ],
    bestFor: ['aging', 'acne', 'uneven texture', 'hyperpigmentation'],
    usage: 'PM only. Start 2x weekly, gradually increase. Always use sunscreen.',
    cautions: [
      'Causes sun sensitivity',
      'May cause initial dryness/peeling',
      'Avoid during pregnancy',
    ],
  },
  'hyaluronic acid': {
    benefits: [
      'Deep hydration',
      'Plumps skin',
      'Reduces appearance of fine lines',
      'Suitable for all skin types',
      'Lightweight, non-greasy',
    ],
    bestFor: ['all skin types', 'dehydrated', 'aging', 'dry'],
    usage: 'AM and PM. Apply to damp skin, follow with moisturizer.',
    cautions: ['Apply to damp skin for best results. May dry skin in low humidity.'],
  },
  'salicylic acid': {
    benefits: [
      'Unclogs pores',
      'Reduces acne',
      'Exfoliates inside pores',
      'Controls oil',
      'Reduces blackheads',
    ],
    bestFor: ['oily', 'acne-prone', 'blackheads', 'enlarged pores'],
    usage: 'PM or as spot treatment. 0.5-2% concentration.',
    cautions: ['Can be drying', "Don't combine with other acids initially"],
  },
  'vitamin c': {
    benefits: [
      'Brightens skin',
      'Antioxidant protection',
      'Fades dark spots',
      'Boosts collagen',
      'Evens skin tone',
    ],
    bestFor: ['dull skin', 'hyperpigmentation', 'aging', 'sun damage'],
    usage: 'AM under sunscreen. 10-20% concentration for effectiveness.',
    cautions: ['Can oxidize quickly', 'May irritate sensitive skin', 'Store properly'],
  },
  'glycolic acid': {
    benefits: [
      'Exfoliates dead skin cells',
      'Improves texture',
      'Brightens skin',
      'Reduces fine lines',
      'Treats acne scars',
    ],
    bestFor: ['dull skin', 'uneven texture', 'aging', 'acne scars'],
    usage: 'Start 1-2x weekly. Use at night. Always use sunscreen.',
    cautions: ['Increases sun sensitivity', 'Start with lower concentrations (5-10%)'],
  },
  ceramides: {
    benefits: [
      'Restores skin barrier',
      'Locks in moisture',
      'Protects against irritation',
      'Soothes sensitive skin',
      'Prevents water loss',
    ],
    bestFor: ['dry', 'sensitive', 'damaged barrier', 'eczema-prone'],
    usage: 'AM and PM. Layer with other hydrating products.',
    cautions: ['Safe for most skin types. No significant cautions.'],
  },
  peptides: {
    benefits: [
      'Stimulates collagen production',
      'Firms skin',
      'Reduces wrinkles',
      'Improves elasticity',
      'Gentle anti-aging',
    ],
    bestFor: ['aging', 'loss of firmness', 'mature skin'],
    usage: 'AM and PM. Layer under moisturizer.',
    cautions: ['Avoid using with strong acids (low pH inactivates peptides)'],
  },
}
