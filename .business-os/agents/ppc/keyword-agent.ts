/**
 * Keyword & Intent Agent
 *
 * Ensures spend maps to buying intent, not noise.
 *
 * Responsibilities:
 * - Keyword discovery (commercial vs informational)
 * - Intent classification
 * - Negative keyword strategy
 * - Search term mining
 *
 * Outputs:
 * - Keyword clusters by intent
 * - Exclusion lists
 * - Expansion opportunities
 */

import {
  AgentType,
  AgentState,
  AgentMessage,
  Keyword,
  KeywordGroup,
  KeywordMetrics,
  NegativeKeyword,
  IntentType,
  MatchType,
  PPCConfig,
} from './types'

// ============================================================================
// KEYWORD AGENT TYPES
// ============================================================================

export interface KeywordResearch {
  id: string
  createdAt: Date
  seedKeywords: string[]
  clusters: KeywordCluster[]
  negatives: NegativeKeyword[]
  opportunities: KeywordOpportunity[]
  summary: KeywordSummary
}

export interface KeywordCluster {
  id: string
  name: string
  theme: string
  intent: IntentType
  keywords: ScoredKeyword[]
  recommendedMatchType: MatchType
  estimatedVolume: number
  competitionLevel: 'low' | 'medium' | 'high'
  suggestedBid: number
}

export interface ScoredKeyword extends Keyword {
  intentScore: number
  commercialScore: number
  relevanceScore: number
  priorityRank: number
  searchVolume?: number
  competition?: number
  suggestedBid?: number
}

export interface KeywordOpportunity {
  keyword: string
  type: 'expansion' | 'long_tail' | 'competitor' | 'trending'
  intent: IntentType
  estimatedVolume: number
  estimatedCpc: number
  rationale: string
  priority: 'high' | 'medium' | 'low'
}

export interface KeywordSummary {
  totalKeywords: number
  byIntent: Record<IntentType, number>
  byMatchType: Record<MatchType, number>
  estimatedMonthlyVolume: number
  averageCpc: number
  negativeCount: number
}

export interface SearchTermAnalysis {
  term: string
  impressions: number
  clicks: number
  conversions: number
  cost: number
  matchedKeyword: string
  matchType: MatchType
  recommendation: 'add_exact' | 'add_phrase' | 'add_negative' | 'monitor' | 'no_action'
  reasoning: string
}

// ============================================================================
// INTENT CLASSIFICATION
// ============================================================================

const INTENT_SIGNALS: Record<IntentType, { positive: string[]; negative: string[] }> = {
  transactional: {
    positive: ['buy', 'purchase', 'order', 'shop', 'price', 'cost', 'deal', 'discount', 'coupon', 'sale', 'cheap', 'best price', 'where to buy', 'for sale', 'online', 'delivery', 'shipping'],
    negative: ['free', 'diy', 'homemade', 'how to make'],
  },
  commercial: {
    positive: ['best', 'top', 'review', 'compare', 'vs', 'versus', 'alternative', 'recommendation', 'which', 'rating', '2024', '2025'],
    negative: [],
  },
  informational: {
    positive: ['what is', 'how to', 'why', 'when', 'guide', 'tutorial', 'tips', 'learn', 'meaning', 'definition', 'example'],
    negative: ['buy', 'price', 'cost'],
  },
  navigational: {
    positive: ['login', 'sign in', 'official', 'website', '.com', 'app', 'download'],
    negative: [],
  },
}

// Skincare-specific negative keywords
const SKINCARE_NEGATIVES = [
  // DIY/Free
  'homemade', 'diy', 'recipe', 'natural remedy', 'home remedy', 'free sample',
  // Jobs/Careers
  'job', 'career', 'salary', 'hiring', 'employment', 'internship',
  // Medical (avoid claims)
  'prescription', 'doctor', 'dermatologist', 'medical', 'treatment', 'cure', 'disease',
  // Irrelevant
  'wallpaper', 'drawing', 'clipart', 'png', 'vector', 'tattoo',
  // Competitors (optional - can be targeted instead)
  // 'cerave', 'the ordinary', 'drunk elephant',
]

// ============================================================================
// KEYWORD AGENT CLASS
// ============================================================================

export class KeywordAgent {
  readonly type: AgentType = 'keyword'
  private state: AgentState
  private config: PPCConfig | null = null

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
    this.state.status = 'idle'
  }

  // --------------------------------------------------------------------------
  // KEYWORD DISCOVERY
  // --------------------------------------------------------------------------

  /**
   * Perform keyword research from seed keywords
   */
  async performKeywordResearch(seedKeywords: string[]): Promise<KeywordResearch> {
    this.state.status = 'processing'

    const clusters = await this.clusterKeywords(seedKeywords)
    const negatives = this.generateNegativeList()
    const opportunities = this.identifyOpportunities(clusters)

    const research: KeywordResearch = {
      id: this.generateId(),
      createdAt: new Date(),
      seedKeywords,
      clusters,
      negatives,
      opportunities,
      summary: this.summarizeResearch(clusters, negatives),
    }

    this.state.status = 'idle'
    this.state.lastAction = 'Completed keyword research'
    this.state.lastActionTime = new Date()

    return research
  }

  /**
   * Cluster keywords by theme and intent
   */
  private async clusterKeywords(seeds: string[]): Promise<KeywordCluster[]> {
    const clusters: KeywordCluster[] = []

    // For skincare (Ayonne), create typical clusters
    clusters.push(this.createCluster(
      'Brand Terms',
      'brand',
      ['ayonne', 'ayonne skincare', 'ayonne skin', 'ayonne products'],
      'transactional',
      'exact'
    ))

    clusters.push(this.createCluster(
      'Product Categories',
      'category',
      [
        'vitamin c serum', 'retinol cream', 'hyaluronic acid',
        'face moisturizer', 'anti aging serum', 'dark spot corrector',
        'niacinamide serum', 'face oil', 'eye cream',
      ],
      'commercial',
      'phrase'
    ))

    clusters.push(this.createCluster(
      'Skin Concerns',
      'concern',
      [
        'acne treatment', 'dry skin products', 'oily skin care',
        'wrinkle cream', 'dark circles treatment', 'hyperpigmentation',
        'sensitive skin moisturizer', 'redness relief', 'pore minimizer',
      ],
      'commercial',
      'phrase'
    ))

    clusters.push(this.createCluster(
      'Buying Intent',
      'buying',
      [
        'buy skincare online', 'best skincare products', 'skincare routine',
        'skincare set', 'skincare bundle', 'skincare gift set',
        'organic skincare', 'natural skincare', 'clean beauty products',
      ],
      'transactional',
      'broad'
    ))

    clusters.push(this.createCluster(
      'Competitor Alternatives',
      'competitor',
      [
        'cerave alternative', 'the ordinary alternative', 'drunk elephant dupe',
        'better than cerave', 'affordable skincare', 'luxury skincare',
      ],
      'commercial',
      'phrase'
    ))

    // Expand with seed keywords
    for (const seed of seeds) {
      const intent = this.classifyIntent(seed)
      const matchingCluster = clusters.find(c => c.intent === intent)
      if (matchingCluster) {
        const scoredKw = this.scoreKeyword(seed, intent)
        matchingCluster.keywords.push(scoredKw)
      }
    }

    return clusters
  }

  /**
   * Create a keyword cluster
   */
  private createCluster(
    name: string,
    theme: string,
    keywords: string[],
    intent: IntentType,
    matchType: MatchType
  ): KeywordCluster {
    return {
      id: this.generateId(),
      name,
      theme,
      intent,
      keywords: keywords.map(kw => this.scoreKeyword(kw, intent)),
      recommendedMatchType: matchType,
      estimatedVolume: keywords.length * 1000, // Placeholder
      competitionLevel: intent === 'transactional' ? 'high' : 'medium',
      suggestedBid: intent === 'transactional' ? 2.5 : 1.5,
    }
  }

  /**
   * Score a keyword for prioritization
   */
  private scoreKeyword(text: string, intent: IntentType): ScoredKeyword {
    const intentScore = this.calculateIntentScore(text, intent)
    const commercialScore = this.calculateCommercialScore(text)
    const relevanceScore = this.calculateRelevanceScore(text)

    return {
      text,
      matchType: 'phrase',
      status: 'active',
      intentScore,
      commercialScore,
      relevanceScore,
      priorityRank: Math.round((intentScore + commercialScore + relevanceScore) / 3 * 100),
    }
  }

  // --------------------------------------------------------------------------
  // INTENT CLASSIFICATION
  // --------------------------------------------------------------------------

  /**
   * Classify the search intent of a keyword
   */
  classifyIntent(keyword: string): IntentType {
    const lower = keyword.toLowerCase()

    // Check each intent type
    for (const [intent, signals] of Object.entries(INTENT_SIGNALS)) {
      const hasPositive = signals.positive.some(s => lower.includes(s))
      const hasNegative = signals.negative.some(s => lower.includes(s))

      if (hasPositive && !hasNegative) {
        return intent as IntentType
      }
    }

    // Default to commercial for product-related terms
    if (this.isProductRelated(lower)) {
      return 'commercial'
    }

    return 'informational'
  }

  /**
   * Check if keyword is product-related
   */
  private isProductRelated(keyword: string): boolean {
    const productTerms = [
      'serum', 'cream', 'lotion', 'moisturizer', 'cleanser', 'toner',
      'mask', 'treatment', 'oil', 'balm', 'gel', 'spray', 'essence',
      'skincare', 'skin care', 'face', 'facial', 'anti-aging', 'anti aging',
    ]
    return productTerms.some(term => keyword.includes(term))
  }

  /**
   * Calculate intent alignment score
   */
  private calculateIntentScore(keyword: string, targetIntent: IntentType): number {
    const signals = INTENT_SIGNALS[targetIntent]
    const lower = keyword.toLowerCase()

    let score = 0.5 // Base score

    for (const signal of signals.positive) {
      if (lower.includes(signal)) {
        score += 0.15
      }
    }

    for (const signal of signals.negative) {
      if (lower.includes(signal)) {
        score -= 0.2
      }
    }

    return Math.max(0, Math.min(1, score))
  }

  /**
   * Calculate commercial value score
   */
  private calculateCommercialScore(keyword: string): number {
    const lower = keyword.toLowerCase()
    let score = 0.5

    // High commercial intent signals
    const highCommercial = ['buy', 'purchase', 'shop', 'order', 'price', 'deal', 'discount']
    for (const signal of highCommercial) {
      if (lower.includes(signal)) {
        score += 0.2
      }
    }

    // Medium commercial intent
    const mediumCommercial = ['best', 'review', 'top', 'vs', 'compare']
    for (const signal of mediumCommercial) {
      if (lower.includes(signal)) {
        score += 0.1
      }
    }

    // Low commercial intent
    const lowCommercial = ['how to', 'what is', 'why', 'diy', 'homemade']
    for (const signal of lowCommercial) {
      if (lower.includes(signal)) {
        score -= 0.15
      }
    }

    return Math.max(0, Math.min(1, score))
  }

  /**
   * Calculate relevance to business score
   */
  private calculateRelevanceScore(keyword: string): number {
    const lower = keyword.toLowerCase()
    let score = 0.3 // Base score for any keyword

    // Core product relevance
    const coreTerms = ['skincare', 'skin', 'face', 'facial', 'serum', 'cream', 'moisturizer']
    for (const term of coreTerms) {
      if (lower.includes(term)) {
        score += 0.15
      }
    }

    // Concern relevance
    const concerns = ['acne', 'wrinkle', 'aging', 'dark spot', 'dry', 'oily', 'redness']
    for (const concern of concerns) {
      if (lower.includes(concern)) {
        score += 0.1
      }
    }

    return Math.max(0, Math.min(1, score))
  }

  // --------------------------------------------------------------------------
  // NEGATIVE KEYWORDS
  // --------------------------------------------------------------------------

  /**
   * Generate comprehensive negative keyword list
   */
  generateNegativeList(): NegativeKeyword[] {
    const negatives: NegativeKeyword[] = []

    for (const term of SKINCARE_NEGATIVES) {
      negatives.push({
        text: term,
        level: 'account',
        reason: this.getNegativeReason(term),
      })
    }

    return negatives
  }

  /**
   * Get reason for negative keyword
   */
  private getNegativeReason(term: string): string {
    if (['homemade', 'diy', 'recipe', 'natural remedy'].includes(term)) {
      return 'DIY/free seekers - low purchase intent'
    }
    if (['job', 'career', 'salary', 'hiring'].includes(term)) {
      return 'Job seekers - irrelevant traffic'
    }
    if (['prescription', 'doctor', 'dermatologist'].includes(term)) {
      return 'Medical queries - compliance risk'
    }
    return 'Irrelevant traffic'
  }

  /**
   * Analyze search terms and recommend negatives
   */
  analyzeSearchTerms(
    terms: Array<{ term: string; impressions: number; clicks: number; conversions: number; cost: number }>
  ): SearchTermAnalysis[] {
    return terms.map(t => {
      const intent = this.classifyIntent(t.term)
      const ctr = t.impressions > 0 ? t.clicks / t.impressions : 0
      const convRate = t.clicks > 0 ? t.conversions / t.clicks : 0
      const cpa = t.conversions > 0 ? t.cost / t.conversions : Infinity

      let recommendation: SearchTermAnalysis['recommendation'] = 'no_action'
      let reasoning = ''

      // High performer - add as exact match
      if (t.conversions >= 2 && cpa < (this.config?.maxCpa || 50)) {
        recommendation = 'add_exact'
        reasoning = `Strong performer: ${t.conversions} conversions at $${cpa.toFixed(2)} CPA`
      }
      // Good CTR but no conversions - monitor
      else if (ctr > 0.03 && t.conversions === 0 && t.clicks >= 10) {
        recommendation = 'monitor'
        reasoning = `Good CTR (${(ctr * 100).toFixed(1)}%) but no conversions yet`
      }
      // Wasted spend - add negative
      else if (t.cost > 50 && t.conversions === 0) {
        recommendation = 'add_negative'
        reasoning = `$${t.cost.toFixed(2)} spend with no conversions`
      }
      // Low intent - add negative
      else if (intent === 'informational' && t.clicks >= 5 && t.conversions === 0) {
        recommendation = 'add_negative'
        reasoning = 'Informational intent with no conversion potential'
      }
      // Moderate performer - add as phrase
      else if (t.conversions >= 1 && cpa < (this.config?.maxCpa || 50) * 1.5) {
        recommendation = 'add_phrase'
        reasoning = `Moderate performer: ${t.conversions} conversion(s)`
      }

      return {
        term: t.term,
        impressions: t.impressions,
        clicks: t.clicks,
        conversions: t.conversions,
        cost: t.cost,
        matchedKeyword: '', // Would come from API
        matchType: 'broad' as MatchType,
        recommendation,
        reasoning,
      }
    })
  }

  // --------------------------------------------------------------------------
  // OPPORTUNITIES
  // --------------------------------------------------------------------------

  /**
   * Identify keyword expansion opportunities
   */
  private identifyOpportunities(clusters: KeywordCluster[]): KeywordOpportunity[] {
    const opportunities: KeywordOpportunity[] = []

    // Long-tail opportunities
    opportunities.push({
      keyword: 'best vitamin c serum for dark spots',
      type: 'long_tail',
      intent: 'commercial',
      estimatedVolume: 2900,
      estimatedCpc: 1.85,
      rationale: 'Specific concern + product type = high intent',
      priority: 'high',
    })

    opportunities.push({
      keyword: 'skincare routine for oily acne prone skin',
      type: 'long_tail',
      intent: 'commercial',
      estimatedVolume: 1200,
      estimatedCpc: 1.45,
      rationale: 'Routine seekers often buy multiple products',
      priority: 'high',
    })

    // Competitor opportunities
    opportunities.push({
      keyword: 'cerave vitamin c serum alternative',
      type: 'competitor',
      intent: 'commercial',
      estimatedVolume: 880,
      estimatedCpc: 2.10,
      rationale: 'Users actively seeking alternatives',
      priority: 'medium',
    })

    // Trending opportunities
    opportunities.push({
      keyword: 'skin barrier repair products',
      type: 'trending',
      intent: 'commercial',
      estimatedVolume: 6600,
      estimatedCpc: 1.75,
      rationale: 'Growing trend in skincare community',
      priority: 'high',
    })

    return opportunities
  }

  // --------------------------------------------------------------------------
  // REPORTING
  // --------------------------------------------------------------------------

  /**
   * Summarize keyword research
   */
  private summarizeResearch(clusters: KeywordCluster[], negatives: NegativeKeyword[]): KeywordSummary {
    const allKeywords = clusters.flatMap(c => c.keywords)

    const byIntent: Record<IntentType, number> = {
      transactional: 0,
      commercial: 0,
      informational: 0,
      navigational: 0,
    }

    const byMatchType: Record<MatchType, number> = {
      broad: 0,
      phrase: 0,
      exact: 0,
    }

    for (const cluster of clusters) {
      byIntent[cluster.intent] += cluster.keywords.length
      byMatchType[cluster.recommendedMatchType] += cluster.keywords.length
    }

    return {
      totalKeywords: allKeywords.length,
      byIntent,
      byMatchType,
      estimatedMonthlyVolume: clusters.reduce((sum, c) => sum + c.estimatedVolume, 0),
      averageCpc: clusters.reduce((sum, c) => sum + c.suggestedBid, 0) / clusters.length,
      negativeCount: negatives.length,
    }
  }

  // --------------------------------------------------------------------------
  // AGENT COMMUNICATION
  // --------------------------------------------------------------------------

  async handleMessage(message: AgentMessage): Promise<AgentMessage | null> {
    this.state.status = 'processing'

    let response: AgentMessage | null = null

    switch (message.type) {
      case 'request':
        if ((message.payload as { action?: string })?.action === 'keyword_research') {
          const seeds = (message.payload as { seeds?: string[] })?.seeds || []
          const research = await this.performKeywordResearch(seeds)
          response = {
            from: this.type,
            to: message.from,
            type: 'response',
            payload: research,
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

  private generateId(): string {
    return `kw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const keywordAgent = new KeywordAgent()
