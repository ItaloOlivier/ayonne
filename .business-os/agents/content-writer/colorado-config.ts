/**
 * Colorado Content Configuration
 *
 * Regional SEO strategy focused on Colorado's dry climate, high altitude,
 * and unique skincare challenges.
 */

import type {
  ContentStrategy,
  ColoradoContentConfig,
  ColoradoCityConfig,
  SeasonalContent,
  KeywordTarget,
  BrandVoice,
  ContentGuidelines,
} from './types'

// ============================================================================
// COLORADO CITIES CONFIGURATION
// ============================================================================

export const COLORADO_CITIES: ColoradoCityConfig[] = [
  {
    name: 'Denver',
    slug: 'denver',
    population: 2900000, // Metro area
    altitude: 5280, // Mile High City
    metropolitanArea: 'Denver-Aurora-Lakewood',
    neighboringCities: ['Aurora', 'Lakewood', 'Arvada', 'Westminster', 'Thornton'],
    primaryKeywords: [
      'Denver skincare',
      'Denver dry skin',
      'Mile High skincare',
      'Denver winter skincare',
      'Denver altitude skincare',
    ],
    uniqueFactors: [
      'Mile High altitude (5,280 ft) - 20% less humidity than sea level',
      '300+ days of sunshine - high UV exposure year-round',
      'Extreme temperature swings - 40°F+ daily variations',
      'Very low humidity (especially winter)',
      'Indoor heating in winter worsens dehydration',
    ],
  },
  {
    name: 'Boulder',
    slug: 'boulder',
    population: 330000, // Boulder County
    altitude: 5430,
    metropolitanArea: 'Boulder',
    neighboringCities: ['Longmont', 'Louisville', 'Lafayette', 'Broomfield'],
    primaryKeywords: [
      'Boulder skincare',
      'Boulder dry skin solutions',
      'Boulder altitude skincare',
      'Boulder outdoor skincare',
    ],
    uniqueFactors: [
      'Higher altitude than Denver (5,430 ft)',
      'Active outdoor lifestyle population',
      'Intense sun exposure from hiking/skiing',
      'Wind exposure from mountain proximity',
      'Health-conscious demographic',
    ],
  },
  {
    name: 'Colorado Springs',
    slug: 'colorado-springs',
    population: 750000, // Metro area
    altitude: 6035,
    metropolitanArea: 'Colorado Springs',
    neighboringCities: ['Pueblo', 'Fountain', 'Manitou Springs'],
    primaryKeywords: [
      'Colorado Springs skincare',
      'Colorado Springs dry skin',
      'Pikes Peak skincare',
      'Colorado Springs altitude skin',
    ],
    uniqueFactors: [
      'Higher altitude than Denver (6,035 ft)',
      'Proximity to Pikes Peak - extreme altitude activities',
      'Military community with outdoor training exposure',
      'Semi-arid climate',
      'Strong winds from Front Range',
    ],
  },
  {
    name: 'Fort Collins',
    slug: 'fort-collins',
    population: 350000, // Metro area
    altitude: 5003,
    metropolitanArea: 'Fort Collins-Loveland',
    neighboringCities: ['Loveland', 'Windsor', 'Greeley'],
    primaryKeywords: [
      'Fort Collins skincare',
      'Fort Collins dry skin',
      'Northern Colorado skincare',
    ],
    uniqueFactors: [
      'Northern Colorado climate - colder winters',
      'University town - young demographic',
      'Close to Rocky Mountain National Park',
      'Agricultural area - wind exposure',
    ],
  },
]

// ============================================================================
// SEASONAL CONTENT CALENDAR
// ============================================================================

export const SEASONAL_CONTENT: SeasonalContent[] = [
  {
    season: 'winter',
    months: [12, 1, 2],
    contentThemes: [
      'Combating winter dryness in Colorado',
      'Indoor heating damage repair',
      'Barrier repair for mountain winters',
      'Ski season skincare protection',
      'Cold wind protection skincare',
      'Holiday party-ready skin in dry climates',
    ],
    urgencyLevel: 'high',
    publishWindow: { start: 45, end: 14 }, // Publish Oct 15 - Nov 15
  },
  {
    season: 'spring',
    months: [3, 4, 5],
    contentThemes: [
      'Transitioning skincare from winter to spring',
      'Allergies and skin sensitivity in Colorado',
      'Spring hiking skincare prep',
      'Gradual sun exposure after winter',
      'Hydration recovery after dry winter',
    ],
    urgencyLevel: 'medium',
    publishWindow: { start: 30, end: 7 }, // Publish Feb
  },
  {
    season: 'summer',
    months: [6, 7, 8],
    contentThemes: [
      'High altitude sun protection',
      'Summer hydration at altitude',
      'Outdoor adventure skincare',
      'Mountain hiking skin protection',
      'Pool and lake skincare for Colorado',
      'Camping skincare essentials',
    ],
    urgencyLevel: 'high',
    publishWindow: { start: 45, end: 14 }, // Publish April-May
  },
  {
    season: 'fall',
    months: [9, 10, 11],
    contentThemes: [
      'Fall skincare transition in Colorado',
      'Prepping skin for winter dryness',
      'Football season tailgate skincare',
      'Fall foliage hiking protection',
      'Early snow skincare adjustment',
    ],
    urgencyLevel: 'medium',
    publishWindow: { start: 30, end: 7 }, // Publish Aug
  },
]

// ============================================================================
// KEYWORD TARGETS
// ============================================================================

export const COLORADO_KEYWORDS: KeywordTarget[] = [
  // High priority - easy wins
  {
    keyword: 'Denver skincare routine',
    difficulty: 'easy',
    searchVolume: 'medium',
    intent: 'informational',
    priority: 95,
  },
  {
    keyword: 'Denver dry skin solutions',
    difficulty: 'easy',
    searchVolume: 'medium',
    intent: 'transactional',
    priority: 90,
  },
  {
    keyword: 'high altitude skincare tips',
    difficulty: 'easy',
    searchVolume: 'medium',
    intent: 'informational',
    priority: 90,
  },
  {
    keyword: 'Colorado winter skincare',
    difficulty: 'easy',
    searchVolume: 'medium',
    intent: 'informational',
    priority: 88,
  },
  {
    keyword: 'Boulder skincare',
    difficulty: 'easy',
    searchVolume: 'low',
    intent: 'navigational',
    priority: 85,
  },

  // Medium priority - moderate difficulty
  {
    keyword: 'skincare for dry climate',
    difficulty: 'moderate',
    searchVolume: 'high',
    intent: 'informational',
    priority: 80,
  },
  {
    keyword: 'mountain living skincare',
    difficulty: 'moderate',
    searchVolume: 'medium',
    intent: 'informational',
    priority: 78,
  },
  {
    keyword: 'best moisturizer for Colorado',
    difficulty: 'moderate',
    searchVolume: 'medium',
    intent: 'transactional',
    priority: 75,
  },
  {
    keyword: 'altitude skin dehydration',
    difficulty: 'moderate',
    searchVolume: 'low',
    intent: 'informational',
    priority: 72,
  },

  // Long-tail opportunities
  {
    keyword: 'why is my skin so dry in Denver',
    difficulty: 'easy',
    searchVolume: 'low',
    intent: 'informational',
    priority: 70,
  },
  {
    keyword: 'Denver esthetician recommendations',
    difficulty: 'easy',
    searchVolume: 'low',
    intent: 'navigational',
    priority: 65,
  },
  {
    keyword: 'skiing skincare routine',
    difficulty: 'easy',
    searchVolume: 'low',
    intent: 'informational',
    priority: 68,
  },
  {
    keyword: 'indoor heating dry skin Colorado',
    difficulty: 'easy',
    searchVolume: 'low',
    intent: 'informational',
    priority: 65,
  },

  // Higher difficulty - valuable
  {
    keyword: 'hyaluronic acid high altitude',
    difficulty: 'hard',
    searchVolume: 'medium',
    intent: 'informational',
    priority: 60,
  },
  {
    keyword: 'best moisturizer for dry climate',
    difficulty: 'hard',
    searchVolume: 'high',
    intent: 'transactional',
    priority: 55,
  },
]

// ============================================================================
// CONTENT STRATEGY
// ============================================================================

export const COLORADO_CONTENT_STRATEGY: ContentStrategy = {
  primaryRegion: 'colorado',
  targetCities: ['Denver', 'Boulder', 'Colorado Springs', 'Fort Collins'],
  focusTopics: [
    'high_altitude_skincare',
    'winter_skincare',
    'dry_climate',
    'hydration',
    'sun_protection',
    'mountain_lifestyle',
    'indoor_heating_damage',
    'wind_exposure',
    'seasonal_transition',
  ],
  seasonalFocus: {
    season: 'winter', // Current focus based on Jan timing
    startMonth: 11,
    endMonth: 3,
    topics: [
      'Winter barrier repair',
      'Indoor heating dehydration',
      'Ski slope protection',
      'Cold wind defense',
    ],
  },
  competitorGaps: [
    'No major Colorado-focused skincare e-commerce brands',
    'Local competitors are med-spas without online stores',
    'Skincare5280 Denver is service-only, no products',
    'No AI-powered skin analysis in Colorado market',
    'Limited high-altitude specific content from national brands',
  ],
  targetKeywords: COLORADO_KEYWORDS,
}

// ============================================================================
// FULL COLORADO CONFIG
// ============================================================================

export const COLORADO_CONFIG: ColoradoContentConfig = {
  cities: COLORADO_CITIES,
  statewideTpoics: [
    'High altitude skincare fundamentals',
    'Colorado climate and your skin',
    'Mountain lifestyle skincare guide',
    '300 days of sunshine skin protection',
    'Denver vs coastal skincare differences',
    'Why your skin is drier in Colorado',
    'Colorado water quality and skin health',
  ],
  seasonalCalendar: SEASONAL_CONTENT,
  competitorUrls: [
    'skincare5280.com', // Denver med-spa
    'boulderplasticsurgery.com', // Boulder - services only
    'cherrycreekcenter.com', // Denver - med-spa
  ],
  targetDemographics: [
    'Active outdoor enthusiasts (hikers, skiers, climbers)',
    'Remote workers who moved to Colorado during pandemic',
    'Young professionals in Denver/Boulder tech scene',
    'Health-conscious consumers',
    'People experiencing new dry skin after moving to Colorado',
    'Transplants from coastal/humid climates',
  ],
}

// ============================================================================
// BRAND VOICE FOR CONTENT
// ============================================================================

export const AYONNE_BRAND_VOICE: BrandVoice = {
  tone: ['warm', 'knowledgeable', 'approachable', 'empowering'],
  personality: ['expert friend', 'science-backed', 'non-judgmental', 'solution-oriented'],
  avoidWords: [
    'miracle',
    'cure',
    'guaranteed',
    'instant results',
    'anti-aging', // use 'age-defying' or 'skin vitality' instead
    'perfect skin',
    'flawless',
    'fix',
    'problem skin',
  ],
  preferredTerms: {
    'anti-aging': 'age-supportive',
    'problem skin': 'skin concerns',
    'fix': 'address',
    'cheap': 'affordable',
    'miracle': 'effective',
    'wrinkles': 'fine lines and expression lines',
  },
  writingStyle: 'educational',
}

export const CONTENT_GUIDELINES: ContentGuidelines = {
  mustInclude: [
    'At least one mention of AI skin analysis',
    'Internal link to relevant product or guide',
    'Regional/local context (Denver, altitude, etc.)',
    'Actionable tips readers can implement',
    'Product recommendations where appropriate',
  ],
  neverInclude: [
    'Medical advice or diagnosis',
    'Claims to cure conditions',
    'Competitor brand names',
    'Unsubstantiated claims',
    'Prescription medication recommendations',
  ],
  disclaimerRequired: true,
  disclaimerText:
    'This content is for informational purposes only and is not intended as medical advice. Always consult a dermatologist for specific skin concerns.',
  medicalClaimsPolicy: 'strict',
  citationRequirements: 'recommended',
}

// ============================================================================
// ARTICLE TEMPLATES
// ============================================================================

export const ARTICLE_TEMPLATES = {
  cityLanding: {
    wordCount: 1500,
    sections: [
      'Introduction to [City] skincare challenges',
      'Understanding [City]\'s unique climate',
      'Top skincare concerns for [City] residents',
      'Essential products for [City] living',
      'Your personalized [City] skincare routine',
      'Try our AI Skin Analysis',
    ],
  },
  seasonalGuide: {
    wordCount: 1200,
    sections: [
      'How [Season] affects your skin in Colorado',
      '[Season] skincare challenges',
      'Essential [Season] skincare adjustments',
      'Product recommendations for [Season]',
      'Quick tips for [Season] skin protection',
    ],
  },
  pillarPage: {
    wordCount: 2500,
    sections: [
      'Comprehensive introduction',
      'Science behind the topic',
      'Step-by-step guide',
      'Product recommendations',
      'Common mistakes to avoid',
      'FAQ section',
      'Related resources',
    ],
  },
  howTo: {
    wordCount: 1000,
    sections: [
      'What you\'ll learn',
      'What you\'ll need',
      'Step-by-step instructions',
      'Pro tips',
      'Common questions',
    ],
  },
}
