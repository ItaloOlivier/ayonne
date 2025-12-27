// Skincare advice content based on detected conditions

import { SkinType, SkinConditionType, SKIN_TYPES, SKIN_CONDITIONS } from './conditions'

interface AdviceItem {
  title: string
  tip: string
  priority: 'high' | 'medium' | 'low'
}

interface RoutineStep {
  step: number
  name: string
  description: string
  timing: 'morning' | 'evening' | 'both'
}

// General advice by skin type
const SKIN_TYPE_ADVICE: Record<SkinType, AdviceItem[]> = {
  oily: [
    {
      title: 'Use a Gentle Cleanser',
      tip: 'Cleanse twice daily with a gentle, foaming cleanser. Avoid harsh products that strip oils - this can trigger more oil production.',
      priority: 'high',
    },
    {
      title: 'Don\'t Skip Moisturizer',
      tip: 'Even oily skin needs hydration. Use a lightweight, oil-free moisturizer to maintain balance.',
      priority: 'high',
    },
    {
      title: 'Use Non-Comedogenic Products',
      tip: 'Look for "non-comedogenic" or "won\'t clog pores" on product labels to prevent breakouts.',
      priority: 'medium',
    },
    {
      title: 'Blot, Don\'t Powder Excessively',
      tip: 'Use blotting papers during the day instead of layering powder, which can clog pores.',
      priority: 'low',
    },
  ],
  dry: [
    {
      title: 'Layer Your Hydration',
      tip: 'Apply products from thinnest to thickest - toner, serum, then rich moisturizer to lock in moisture.',
      priority: 'high',
    },
    {
      title: 'Use a Creamy Cleanser',
      tip: 'Switch to a cream or milk cleanser that won\'t strip your skin\'s natural oils.',
      priority: 'high',
    },
    {
      title: 'Add Facial Oil',
      tip: 'Consider adding a facial oil as the last step of your routine to seal in moisture overnight.',
      priority: 'medium',
    },
    {
      title: 'Humidify Your Space',
      tip: 'Use a humidifier, especially in winter, to add moisture back into the air.',
      priority: 'low',
    },
  ],
  combination: [
    {
      title: 'Multi-Mask for Balance',
      tip: 'Apply different masks to different areas - clay on oily T-zone, hydrating on dry cheeks.',
      priority: 'medium',
    },
    {
      title: 'Zone-Specific Products',
      tip: 'You may need to use different products on different areas of your face for best results.',
      priority: 'high',
    },
    {
      title: 'Balanced Hydration',
      tip: 'Use a gel-cream moisturizer that hydrates without being too heavy for oily areas.',
      priority: 'high',
    },
  ],
  normal: [
    {
      title: 'Maintain Your Routine',
      tip: 'Stick to a consistent routine with gentle products to maintain your skin\'s healthy balance.',
      priority: 'medium',
    },
    {
      title: 'Focus on Prevention',
      tip: 'Use antioxidants and SPF daily to prevent future damage and maintain your skin\'s health.',
      priority: 'high',
    },
    {
      title: 'Regular Exfoliation',
      tip: 'Exfoliate 1-2 times per week to maintain smooth, glowing skin.',
      priority: 'medium',
    },
  ],
  sensitive: [
    {
      title: 'Patch Test Everything',
      tip: 'Always patch test new products on your inner arm for 24-48 hours before applying to face.',
      priority: 'high',
    },
    {
      title: 'Minimal Ingredients',
      tip: 'Choose products with shorter ingredient lists and avoid known irritants like fragrance and alcohol.',
      priority: 'high',
    },
    {
      title: 'Gentle Introduction',
      tip: 'When adding new products, introduce one at a time and wait 2 weeks before adding another.',
      priority: 'medium',
    },
    {
      title: 'Soothe and Protect',
      tip: 'Look for calming ingredients like centella asiatica, aloe vera, and ceramides.',
      priority: 'medium',
    },
  ],
}

// Condition-specific advice
const CONDITION_ADVICE: Record<SkinConditionType, AdviceItem[]> = {
  acne: [
    {
      title: 'Don\'t Pick or Pop',
      tip: 'Avoid touching or picking at blemishes - this can lead to scarring and spread bacteria.',
      priority: 'high',
    },
    {
      title: 'Salicylic Acid is Your Friend',
      tip: 'Use products with salicylic acid (BHA) to unclog pores and reduce breakouts.',
      priority: 'high',
    },
    {
      title: 'Clean Your Phone',
      tip: 'Regularly clean items that touch your face, including phones, pillowcases, and glasses.',
      priority: 'medium',
    },
  ],
  wrinkles: [
    {
      title: 'Retinol is Key',
      tip: 'Incorporate retinol into your evening routine - start slow (2x/week) and build up.',
      priority: 'high',
    },
    {
      title: 'SPF Every Day',
      tip: 'Sun exposure is the #1 cause of premature aging. Wear SPF 30+ daily, rain or shine.',
      priority: 'high',
    },
    {
      title: 'Hydration Plumps',
      tip: 'Well-hydrated skin shows fewer wrinkles. Use hyaluronic acid to attract and hold moisture.',
      priority: 'medium',
    },
  ],
  fine_lines: [
    {
      title: 'Prevention First',
      tip: 'Start using preventive anti-aging products now before lines become deeper wrinkles.',
      priority: 'high',
    },
    {
      title: 'Gentle Retinoid',
      tip: 'Consider a gentle retinoid like retinol or bakuchiol to boost collagen production.',
      priority: 'medium',
    },
    {
      title: 'Eye Area Care',
      tip: 'Use a dedicated eye cream to address fine lines around the delicate eye area.',
      priority: 'medium',
    },
  ],
  dark_spots: [
    {
      title: 'Vitamin C Daily',
      tip: 'Use a vitamin C serum in the morning to brighten and prevent new dark spots.',
      priority: 'high',
    },
    {
      title: 'Sun Protection Critical',
      tip: 'Dark spots worsen with sun exposure. Apply and reapply SPF religiously.',
      priority: 'high',
    },
    {
      title: 'Patience Required',
      tip: 'Fading dark spots takes time - expect 3-6 months of consistent treatment.',
      priority: 'medium',
    },
  ],
  redness: [
    {
      title: 'Avoid Triggers',
      tip: 'Common triggers include hot beverages, spicy food, alcohol, and extreme temperatures.',
      priority: 'high',
    },
    {
      title: 'Gentle Products Only',
      tip: 'Avoid products with alcohol, fragrance, and harsh exfoliants that can worsen redness.',
      priority: 'high',
    },
    {
      title: 'Green-Tinted Primer',
      tip: 'A green-tinted primer can help neutralize redness if you wear makeup.',
      priority: 'low',
    },
  ],
  dryness: [
    {
      title: 'Hydrate Inside Out',
      tip: 'Drink plenty of water and eat omega-3 rich foods to hydrate from within.',
      priority: 'medium',
    },
    {
      title: 'Apply to Damp Skin',
      tip: 'Apply moisturizer to slightly damp skin to lock in extra hydration.',
      priority: 'high',
    },
    {
      title: 'Avoid Hot Water',
      tip: 'Use lukewarm water when cleansing - hot water strips natural oils.',
      priority: 'medium',
    },
  ],
  oiliness: [
    {
      title: 'Don\'t Over-Cleanse',
      tip: 'Cleansing more than twice daily can trigger more oil production as skin overcompensates.',
      priority: 'high',
    },
    {
      title: 'Niacinamide Benefits',
      tip: 'Use products with niacinamide to help regulate oil production over time.',
      priority: 'medium',
    },
  ],
  dark_circles: [
    {
      title: 'Prioritize Sleep',
      tip: 'Aim for 7-9 hours of quality sleep - dark circles often worsen with fatigue.',
      priority: 'high',
    },
    {
      title: 'Caffeine Eye Products',
      tip: 'Look for eye creams with caffeine to help constrict blood vessels and reduce darkness.',
      priority: 'medium',
    },
    {
      title: 'Elevate Your Head',
      tip: 'Sleep with your head slightly elevated to prevent fluid accumulation under eyes.',
      priority: 'low',
    },
  ],
  enlarged_pores: [
    {
      title: 'Niacinamide is Key',
      tip: 'Niacinamide can help minimize the appearance of pores over time.',
      priority: 'high',
    },
    {
      title: 'Regular Exfoliation',
      tip: 'BHAs (salicylic acid) penetrate pores to clean them out and make them appear smaller.',
      priority: 'medium',
    },
    {
      title: 'Keep Pores Clear',
      tip: 'Remove makeup thoroughly and double cleanse to prevent pores from stretching.',
      priority: 'medium',
    },
  ],
  sun_damage: [
    {
      title: 'Never Skip SPF',
      tip: 'Prevent further damage by wearing broad-spectrum SPF 30+ every single day.',
      priority: 'high',
    },
    {
      title: 'Antioxidant Protection',
      tip: 'Use antioxidant serums (Vitamin C, E) to help repair and protect from environmental damage.',
      priority: 'high',
    },
    {
      title: 'Consider Professional Treatment',
      tip: 'For significant sun damage, consult a dermatologist about professional treatments.',
      priority: 'medium',
    },
  ],
  dullness: [
    {
      title: 'Exfoliate Regularly',
      tip: 'Dead skin buildup causes dullness. Use AHA/BHA exfoliants 2-3 times weekly.',
      priority: 'high',
    },
    {
      title: 'Vitamin C Brightening',
      tip: 'A vitamin C serum can instantly brighten skin and improve radiance over time.',
      priority: 'high',
    },
    {
      title: 'Hydration Equals Glow',
      tip: 'Dehydrated skin looks dull. Layer hydrating products for a plump, glowing appearance.',
      priority: 'medium',
    },
  ],
  uneven_texture: [
    {
      title: 'Chemical Exfoliation',
      tip: 'Use AHA (glycolic, lactic acid) to smooth texture and even skin surface.',
      priority: 'high',
    },
    {
      title: 'Retinoids for Renewal',
      tip: 'Retinoids speed cell turnover, helping to smooth rough, uneven texture.',
      priority: 'medium',
    },
    {
      title: 'Don\'t Over-Exfoliate',
      tip: 'Start slowly and don\'t overdo it - over-exfoliation worsens texture.',
      priority: 'medium',
    },
  ],
}

// Universal advice that applies to everyone
const UNIVERSAL_ADVICE: AdviceItem[] = [
  {
    title: 'Always Wear Sunscreen',
    tip: 'Apply broad-spectrum SPF 30+ every morning, even on cloudy days. Reapply every 2 hours when outdoors.',
    priority: 'high',
  },
  {
    title: 'Consistency is Key',
    tip: 'Skincare results take time. Stick with your routine for at least 4-6 weeks before expecting visible changes.',
    priority: 'high',
  },
  {
    title: 'Sleep on Clean Pillowcases',
    tip: 'Change pillowcases weekly to prevent buildup of oils, bacteria, and dead skin cells.',
    priority: 'medium',
  },
]

// Get personalized advice based on skin type and conditions
export function getPersonalizedAdvice(
  skinType: SkinType | null,
  conditionIds: string[]
): AdviceItem[] {
  const advice: AdviceItem[] = [...UNIVERSAL_ADVICE]

  // Add skin type specific advice
  if (skinType && SKIN_TYPE_ADVICE[skinType]) {
    advice.push(...SKIN_TYPE_ADVICE[skinType])
  }

  // Add condition-specific advice
  for (const conditionId of conditionIds) {
    const conditionAdvice = CONDITION_ADVICE[conditionId as SkinConditionType]
    if (conditionAdvice) {
      advice.push(...conditionAdvice)
    }
  }

  // Sort by priority (high first) and remove duplicates
  const seen = new Set<string>()
  const uniqueAdvice = advice.filter(item => {
    if (seen.has(item.title)) return false
    seen.add(item.title)
    return true
  })

  return uniqueAdvice.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })
}

// Get a suggested basic routine
export function getSuggestedRoutine(skinType: SkinType | null): RoutineStep[] {
  const baseRoutine: RoutineStep[] = [
    {
      step: 1,
      name: 'Cleanser',
      description: skinType === 'dry'
        ? 'Use a cream or milk cleanser to gently remove dirt without stripping moisture'
        : skinType === 'oily'
        ? 'Use a gentle foaming cleanser to remove excess oil without over-drying'
        : 'Use a gentle cleanser suitable for your skin type',
      timing: 'both',
    },
    {
      step: 2,
      name: 'Toner (Optional)',
      description: 'Apply a hydrating or balancing toner to prep skin for next steps',
      timing: 'both',
    },
    {
      step: 3,
      name: 'Serum',
      description: 'Apply targeted treatment serums - Vitamin C in morning, retinol at night',
      timing: 'both',
    },
    {
      step: 4,
      name: 'Eye Cream',
      description: 'Gently pat eye cream around the orbital bone using ring finger',
      timing: 'both',
    },
    {
      step: 5,
      name: 'Moisturizer',
      description: skinType === 'dry'
        ? 'Apply a rich, nourishing moisturizer to lock in hydration'
        : skinType === 'oily'
        ? 'Use a lightweight, oil-free moisturizer or gel cream'
        : 'Apply moisturizer suited to your skin type',
      timing: 'both',
    },
    {
      step: 6,
      name: 'Sunscreen',
      description: 'Finish with broad-spectrum SPF 30+ as the last step of your morning routine',
      timing: 'morning',
    },
  ]

  return baseRoutine
}
