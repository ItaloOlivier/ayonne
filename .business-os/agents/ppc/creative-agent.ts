/**
 * Creative & Copy Agent
 *
 * Maximizes Quality Score and CTR without misleading users.
 *
 * Responsibilities:
 * - Ad copy generation (Search, Display, Meta)
 * - USP extraction from product
 * - Compliance checks
 * - Creative testing matrices
 *
 * Outputs:
 * - Ad copy variants
 * - Messaging frameworks
 * - Creative test plans
 */

import {
  AgentType,
  AgentState,
  AgentMessage,
  Ad,
  AdContent,
  AdType,
  PPCConfig,
} from './types'

// ============================================================================
// CREATIVE AGENT TYPES
// ============================================================================

export interface AdCopySet {
  id: string
  createdAt: Date
  campaign: string
  adGroup: string
  headlines: HeadlineVariant[]
  descriptions: DescriptionVariant[]
  callToActions: string[]
  compliance: ComplianceCheck
  testMatrix: AdTestMatrix
}

export interface HeadlineVariant {
  text: string
  characterCount: number
  type: HeadlineType
  emotionalTone: EmotionalTone
  includes: {
    keyword: boolean
    benefit: boolean
    cta: boolean
    number: boolean
    question: boolean
  }
}

export type HeadlineType =
  | 'benefit'
  | 'feature'
  | 'social_proof'
  | 'urgency'
  | 'question'
  | 'how_to'
  | 'brand'

export type EmotionalTone =
  | 'aspirational'
  | 'problem_solution'
  | 'trust'
  | 'curiosity'
  | 'fear_of_missing_out'
  | 'confidence'

export interface DescriptionVariant {
  text: string
  characterCount: number
  type: DescriptionType
  includes: {
    cta: boolean
    benefit: boolean
    proof: boolean
    differentiator: boolean
  }
}

export type DescriptionType =
  | 'value_proposition'
  | 'feature_list'
  | 'testimonial'
  | 'offer'
  | 'brand_story'

export interface ComplianceCheck {
  passed: boolean
  issues: ComplianceIssue[]
  checkedAt: Date
}

export interface ComplianceIssue {
  element: 'headline' | 'description' | 'image'
  index: number
  type: ComplianceViolationType
  text: string
  suggestion: string
  severity: 'error' | 'warning'
}

export type ComplianceViolationType =
  | 'medical_claim'
  | 'guarantee'
  | 'misleading'
  | 'trademark'
  | 'superlative'
  | 'before_after'
  | 'age_claim'

export interface AdTestMatrix {
  dimensions: TestDimension[]
  combinations: AdCombination[]
  recommendedTests: RecommendedTest[]
}

export interface TestDimension {
  name: string
  variants: string[]
  hypothesis: string
}

export interface AdCombination {
  id: string
  headlines: number[]
  description: number
  priority: number
  hypothesis: string
}

export interface RecommendedTest {
  name: string
  control: AdCombination
  treatment: AdCombination
  metric: string
  minSampleSize: number
  expectedLift: number
}

export interface MessagingFramework {
  brand: {
    voice: string[]
    values: string[]
    differentiators: string[]
  }
  audience: {
    painPoints: string[]
    desires: string[]
    objections: string[]
  }
  messaging: {
    headlines: Record<HeadlineType, string[]>
    benefits: string[]
    features: string[]
    proofPoints: string[]
    callToActions: string[]
  }
}

// ============================================================================
// SKINCARE-SPECIFIC COMPLIANCE RULES
// ============================================================================

const COMPLIANCE_RULES = {
  // Words that trigger medical claim violations
  medicalClaims: [
    'cure', 'treat', 'heal', 'therapy', 'therapeutic', 'prescription',
    'dermatologist', 'clinical', 'medical', 'diagnose', 'disease',
    'eczema', 'psoriasis', 'rosacea', 'dermatitis', // Specific conditions
  ],

  // Guarantee language to avoid
  guarantees: [
    'guaranteed', '100%', 'always', 'never', 'permanent', 'forever',
    'miracle', 'instant', 'immediate', 'overnight',
  ],

  // Superlatives that need qualification
  superlatives: [
    'best', 'most', 'only', 'first', '#1', 'number one', 'leading',
    'top', 'fastest', 'strongest', 'most effective',
  ],

  // Age-related claims that need care
  ageClaims: [
    'anti-aging', 'anti aging', 'reverse aging', 'turn back time',
    'look younger', 'years younger', 'erase wrinkles',
  ],

  // Before/after implications
  beforeAfter: [
    'before and after', 'transformation', 'dramatic results',
    'see the difference', 'incredible results',
  ],
}

// Approved skincare messaging patterns
const APPROVED_PATTERNS = {
  // Safe benefit language
  benefits: [
    'helps reduce the appearance of',
    'may help minimize',
    'supports skin health',
    'formulated to address',
    'designed for',
    'helps with',
  ],

  // Safe result language
  results: [
    'visible improvement',
    'noticeable difference',
    'smoother-looking skin',
    'more radiant appearance',
    'healthier-looking skin',
  ],

  // Social proof patterns
  socialProof: [
    'loved by thousands',
    'top-rated',
    'customer favorite',
    'award-winning',
    '5-star reviews',
  ],
}

// ============================================================================
// CREATIVE AGENT CLASS
// ============================================================================

export class CreativeAgent {
  readonly type: AgentType = 'creative'
  private state: AgentState
  private config: PPCConfig | null = null
  private messagingFramework: MessagingFramework | null = null

  constructor() {
    this.state = {
      agent: this.type,
      status: 'idle',
      pendingTasks: 0,
      errors: [],
    }
  }

  // --------------------------------------------------------------------------
  // INITIALIZATION
  // --------------------------------------------------------------------------

  async initialize(config: PPCConfig): Promise<void> {
    this.config = config
    this.messagingFramework = this.buildMessagingFramework()
    this.state.status = 'idle'
  }

  /**
   * Build the messaging framework for the brand
   */
  private buildMessagingFramework(): MessagingFramework {
    return {
      brand: {
        voice: ['confident', 'approachable', 'scientific', 'empowering'],
        values: ['efficacy', 'transparency', 'sustainability', 'inclusivity'],
        differentiators: [
          'AI-powered personalization',
          'Clean, effective formulas',
          'Dermatologist-backed',
          'Results-focused',
        ],
      },
      audience: {
        painPoints: [
          'Overwhelmed by product choices',
          'Wasted money on wrong products',
          'Skin concerns not improving',
          'Don\'t know their skin type',
          'Inconsistent skincare routine',
        ],
        desires: [
          'Clear, glowing skin',
          'Personalized recommendations',
          'Simple but effective routine',
          'Confidence in appearance',
          'Products that actually work',
        ],
        objections: [
          'Too expensive',
          'Already have products',
          'Skeptical of new brands',
          'Takes too long to see results',
          'Worried about reactions',
        ],
      },
      messaging: {
        headlines: {
          benefit: [
            'Discover Your Perfect Skincare',
            'Personalized For Your Skin',
            'Get Glowing, Confident Skin',
            'Your Skin, Perfected',
          ],
          feature: [
            'AI-Powered Skin Analysis',
            'Free Skin Assessment',
            'Smart Skincare Solutions',
            'Science-Backed Formulas',
          ],
          social_proof: [
            'Join 10,000+ Happy Customers',
            'Top-Rated Skincare Brand',
            '5-Star Customer Reviews',
            'Loved By Skin Experts',
          ],
          urgency: [
            'Limited Time: 20% Off',
            'Sale Ends Tonight',
            'Exclusive Offer Inside',
            'Don\'t Miss This Deal',
          ],
          question: [
            'Know Your Skin Type?',
            'Struggling With Breakouts?',
            'Ready For Better Skin?',
            'What\'s Your Skin Telling You?',
          ],
          how_to: [
            'Build Your Perfect Routine',
            'Start Your Skin Journey',
            'Get Your Free Analysis',
            'Transform Your Skincare',
          ],
          brand: [
            'Ayonne Skincare',
            'Ayonne | Smart Skincare',
            'Official Ayonne Store',
            'Shop Ayonne Today',
          ],
        },
        benefits: [
          'Personalized to your unique skin',
          'See visible results in weeks',
          'Clean, effective ingredients',
          'Free shipping on orders $50+',
          'Easy 30-day returns',
        ],
        features: [
          'AI skin analysis technology',
          'Cruelty-free formulas',
          'Dermatologist-approved',
          'Fragrance-free options',
          'Suitable for sensitive skin',
        ],
        proofPoints: [
          '92% saw improvement in 4 weeks',
          'Over 10,000 5-star reviews',
          'Featured in Vogue, Allure',
          'Recommended by dermatologists',
        ],
        callToActions: [
          'Shop Now',
          'Get Started',
          'Try Free Analysis',
          'Discover Your Routine',
          'Learn More',
          'See Products',
        ],
      },
    }
  }

  // --------------------------------------------------------------------------
  // AD COPY GENERATION
  // --------------------------------------------------------------------------

  /**
   * Generate a complete ad copy set for a campaign/ad group
   */
  async generateAdCopySet(
    campaign: string,
    adGroup: string,
    targetKeywords: string[]
  ): Promise<AdCopySet> {
    this.state.status = 'processing'

    const headlines = this.generateHeadlines(targetKeywords)
    const descriptions = this.generateDescriptions(targetKeywords)
    const callToActions = this.messagingFramework?.messaging.callToActions || []

    const adCopySet: AdCopySet = {
      id: this.generateId(),
      createdAt: new Date(),
      campaign,
      adGroup,
      headlines,
      descriptions,
      callToActions,
      compliance: this.runComplianceCheck(headlines, descriptions),
      testMatrix: this.buildTestMatrix(headlines, descriptions),
    }

    this.state.status = 'idle'
    this.state.lastAction = 'Generated ad copy set'
    this.state.lastActionTime = new Date()

    return adCopySet
  }

  /**
   * Generate headline variants (15 for RSA)
   */
  private generateHeadlines(keywords: string[]): HeadlineVariant[] {
    const headlines: HeadlineVariant[] = []
    const framework = this.messagingFramework!

    // Brand headlines (pinnable to position 1)
    for (const h of framework.messaging.headlines.brand.slice(0, 2)) {
      headlines.push(this.createHeadline(h, 'brand', 'trust'))
    }

    // Benefit headlines
    for (const h of framework.messaging.headlines.benefit.slice(0, 3)) {
      headlines.push(this.createHeadline(h, 'benefit', 'aspirational'))
    }

    // Feature headlines
    for (const h of framework.messaging.headlines.feature.slice(0, 2)) {
      headlines.push(this.createHeadline(h, 'feature', 'curiosity'))
    }

    // Social proof headlines
    for (const h of framework.messaging.headlines.social_proof.slice(0, 2)) {
      headlines.push(this.createHeadline(h, 'social_proof', 'trust'))
    }

    // Question headlines
    for (const h of framework.messaging.headlines.question.slice(0, 2)) {
      headlines.push(this.createHeadline(h, 'question', 'curiosity'))
    }

    // Keyword-integrated headlines
    for (const kw of keywords.slice(0, 3)) {
      const headline = this.integrateKeyword(kw)
      headlines.push(this.createHeadline(headline, 'benefit', 'problem_solution'))
    }

    // Urgency headlines (if applicable)
    headlines.push(this.createHeadline('Free Shipping Available', 'urgency', 'fear_of_missing_out'))

    return headlines.slice(0, 15) // RSA limit
  }

  /**
   * Create a headline variant with metadata
   */
  private createHeadline(text: string, type: HeadlineType, tone: EmotionalTone): HeadlineVariant {
    const lower = text.toLowerCase()

    return {
      text: this.truncateToLimit(text, 30),
      characterCount: text.length,
      type,
      emotionalTone: tone,
      includes: {
        keyword: false, // Would be set based on keyword list
        benefit: lower.includes('perfect') || lower.includes('glow') || lower.includes('better'),
        cta: lower.includes('shop') || lower.includes('get') || lower.includes('try'),
        number: /\d/.test(text),
        question: text.includes('?'),
      },
    }
  }

  /**
   * Integrate a keyword into a headline
   */
  private integrateKeyword(keyword: string): string {
    const templates = [
      `Best ${keyword} Products`,
      `Shop ${keyword} Now`,
      `${keyword} That Works`,
      `Premium ${keyword}`,
    ]

    // Pick a random template and ensure it fits
    const template = templates[Math.floor(Math.random() * templates.length)]
    return this.truncateToLimit(this.toTitleCase(template), 30)
  }

  /**
   * Generate description variants (4 for RSA)
   */
  private generateDescriptions(keywords: string[]): DescriptionVariant[] {
    const descriptions: DescriptionVariant[] = []
    const framework = this.messagingFramework!

    // Value proposition description
    descriptions.push(this.createDescription(
      `Discover skincare personalized for you. AI-powered analysis matches you with products that work. Free shipping on orders $50+.`,
      'value_proposition'
    ))

    // Feature list description
    descriptions.push(this.createDescription(
      `Clean, effective formulas. Dermatologist-approved. Cruelty-free. See visible results in weeks. Start your skin journey today.`,
      'feature_list'
    ))

    // Social proof description
    descriptions.push(this.createDescription(
      `Join thousands who've transformed their skin. 92% saw improvement in 4 weeks. Top-rated by customers. Try risk-free today.`,
      'testimonial'
    ))

    // Offer description
    descriptions.push(this.createDescription(
      `Get your free AI skin analysis and personalized routine. Save 20% on your first order. Easy returns. Shop the difference.`,
      'offer'
    ))

    return descriptions
  }

  /**
   * Create a description variant with metadata
   */
  private createDescription(text: string, type: DescriptionType): DescriptionVariant {
    const lower = text.toLowerCase()

    return {
      text: this.truncateToLimit(text, 90),
      characterCount: text.length,
      type,
      includes: {
        cta: lower.includes('shop') || lower.includes('try') || lower.includes('get') || lower.includes('start'),
        benefit: lower.includes('personalized') || lower.includes('results') || lower.includes('transform'),
        proof: lower.includes('%') || lower.includes('thousands') || lower.includes('rated'),
        differentiator: lower.includes('ai') || lower.includes('free') || lower.includes('clean'),
      },
    }
  }

  // --------------------------------------------------------------------------
  // COMPLIANCE CHECKING
  // --------------------------------------------------------------------------

  /**
   * Run compliance check on ad copy
   */
  runComplianceCheck(headlines: HeadlineVariant[], descriptions: DescriptionVariant[]): ComplianceCheck {
    const issues: ComplianceIssue[] = []

    // Check headlines
    headlines.forEach((h, i) => {
      issues.push(...this.checkTextCompliance(h.text, 'headline', i))
    })

    // Check descriptions
    descriptions.forEach((d, i) => {
      issues.push(...this.checkTextCompliance(d.text, 'description', i))
    })

    return {
      passed: issues.filter(i => i.severity === 'error').length === 0,
      issues,
      checkedAt: new Date(),
    }
  }

  /**
   * Check text for compliance issues
   */
  private checkTextCompliance(
    text: string,
    element: 'headline' | 'description' | 'image',
    index: number
  ): ComplianceIssue[] {
    const issues: ComplianceIssue[] = []
    const lower = text.toLowerCase()

    // Check medical claims
    for (const term of COMPLIANCE_RULES.medicalClaims) {
      if (lower.includes(term)) {
        issues.push({
          element,
          index,
          type: 'medical_claim',
          text: term,
          suggestion: `Remove "${term}" - medical claims not allowed for cosmetics`,
          severity: 'error',
        })
      }
    }

    // Check guarantees
    for (const term of COMPLIANCE_RULES.guarantees) {
      if (lower.includes(term)) {
        issues.push({
          element,
          index,
          type: 'guarantee',
          text: term,
          suggestion: `Soften "${term}" - use phrases like "helps" or "may improve"`,
          severity: 'error',
        })
      }
    }

    // Check superlatives
    for (const term of COMPLIANCE_RULES.superlatives) {
      if (lower.includes(term)) {
        issues.push({
          element,
          index,
          type: 'superlative',
          text: term,
          suggestion: `"${term}" needs substantiation or should be removed`,
          severity: 'warning',
        })
      }
    }

    // Check age claims
    for (const term of COMPLIANCE_RULES.ageClaims) {
      if (lower.includes(term)) {
        issues.push({
          element,
          index,
          type: 'age_claim',
          text: term,
          suggestion: `Rephrase "${term}" - use "helps reduce the appearance of fine lines"`,
          severity: 'warning',
        })
      }
    }

    return issues
  }

  /**
   * Fix compliance issues automatically where possible
   */
  autoFixCompliance(text: string): string {
    let fixed = text

    // Replace medical claims with approved alternatives
    const replacements: Record<string, string> = {
      'treats acne': 'helps with breakouts',
      'cures': 'helps address',
      'heals': 'supports',
      'anti-aging': 'age-defying',
      'instant results': 'visible improvement',
      'guaranteed': 'designed to',
      '100% effective': 'clinically tested',
    }

    for (const [bad, good] of Object.entries(replacements)) {
      fixed = fixed.replace(new RegExp(bad, 'gi'), good)
    }

    return fixed
  }

  // --------------------------------------------------------------------------
  // TEST MATRIX
  // --------------------------------------------------------------------------

  /**
   * Build a test matrix for creative experimentation
   */
  private buildTestMatrix(headlines: HeadlineVariant[], descriptions: DescriptionVariant[]): AdTestMatrix {
    const dimensions: TestDimension[] = [
      {
        name: 'Headline Approach',
        variants: ['Benefit-led', 'Feature-led', 'Social Proof'],
        hypothesis: 'Benefit-led headlines will drive higher CTR',
      },
      {
        name: 'Emotional Tone',
        variants: ['Aspirational', 'Problem-Solution', 'Trust'],
        hypothesis: 'Problem-solution tone will drive higher conversion rate',
      },
      {
        name: 'Description Focus',
        variants: ['Value Proposition', 'Offer-led', 'Testimonial'],
        hypothesis: 'Offer-led descriptions will drive higher CTR during promotions',
      },
    ]

    // Build combinations
    const combinations: AdCombination[] = [
      {
        id: 'control',
        headlines: [0, 2, 4], // Brand, Benefit, Feature
        description: 0,
        priority: 1,
        hypothesis: 'Baseline performance',
      },
      {
        id: 'benefit_heavy',
        headlines: [0, 2, 3], // Brand, Benefit x2
        description: 0,
        priority: 2,
        hypothesis: 'Benefit focus increases engagement',
      },
      {
        id: 'social_proof',
        headlines: [0, 6, 7], // Brand, Social proof x2
        description: 2,
        priority: 3,
        hypothesis: 'Social proof builds trust',
      },
      {
        id: 'offer_led',
        headlines: [0, 14, 2], // Brand, Urgency, Benefit
        description: 3,
        priority: 4,
        hypothesis: 'Offers drive action',
      },
    ]

    // Recommended tests
    const recommendedTests: RecommendedTest[] = [
      {
        name: 'Benefit vs Feature Headlines',
        control: combinations[0],
        treatment: combinations[1],
        metric: 'CTR',
        minSampleSize: 1000,
        expectedLift: 0.15,
      },
      {
        name: 'Social Proof Impact',
        control: combinations[0],
        treatment: combinations[2],
        metric: 'Conversion Rate',
        minSampleSize: 500,
        expectedLift: 0.1,
      },
    ]

    return {
      dimensions,
      combinations,
      recommendedTests,
    }
  }

  // --------------------------------------------------------------------------
  // UTILITIES
  // --------------------------------------------------------------------------

  private truncateToLimit(text: string, limit: number): string {
    if (text.length <= limit) return text
    return text.substring(0, limit - 3) + '...'
  }

  private toTitleCase(text: string): string {
    return text.replace(/\w\S*/g, (txt) =>
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    )
  }

  private generateId(): string {
    return `creative_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // --------------------------------------------------------------------------
  // AGENT COMMUNICATION
  // --------------------------------------------------------------------------

  async handleMessage(message: AgentMessage): Promise<AgentMessage | null> {
    this.state.status = 'processing'

    let response: AgentMessage | null = null

    switch (message.type) {
      case 'request':
        const payload = message.payload as { action?: string; campaign?: string; adGroup?: string; keywords?: string[] }
        if (payload.action === 'generate_ad_copy') {
          const adCopySet = await this.generateAdCopySet(
            payload.campaign || 'default',
            payload.adGroup || 'default',
            payload.keywords || []
          )
          response = {
            from: this.type,
            to: message.from,
            type: 'response',
            payload: adCopySet,
            timestamp: new Date(),
            priority: 'medium',
            correlationId: message.correlationId,
          }
        }
        break
    }

    this.state.status = 'idle'
    return response
  }

  getState(): AgentState {
    return { ...this.state }
  }

  getMessagingFramework(): MessagingFramework | null {
    return this.messagingFramework
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const creativeAgent = new CreativeAgent()
