/**
 * Content Writer Agent Types
 *
 * Types for the autonomous content generation and publishing system
 * focused on Colorado and dry climate regional SEO
 */

// ============================================================================
// CONTENT STRATEGY TYPES
// ============================================================================

export interface ContentStrategy {
  primaryRegion: 'colorado' | 'arizona' | 'nevada' | 'new_mexico'
  targetCities: string[]
  focusTopics: ContentTopic[]
  seasonalFocus: SeasonalFocus | null
  competitorGaps: string[]
  targetKeywords: KeywordTarget[]
}

export interface KeywordTarget {
  keyword: string
  difficulty: 'easy' | 'moderate' | 'hard'
  searchVolume: 'low' | 'medium' | 'high'
  intent: 'informational' | 'transactional' | 'navigational'
  priority: number // 1-100
}

export type ContentTopic =
  | 'high_altitude_skincare'
  | 'winter_skincare'
  | 'dry_climate'
  | 'anti_aging'
  | 'hydration'
  | 'sun_protection'
  | 'mountain_lifestyle'
  | 'indoor_heating_damage'
  | 'wind_exposure'
  | 'seasonal_transition'

export interface SeasonalFocus {
  season: 'winter' | 'spring' | 'summer' | 'fall'
  startMonth: number // 1-12
  endMonth: number
  topics: string[]
}

// ============================================================================
// ARTICLE TYPES
// ============================================================================

export interface ArticleBrief {
  id: string
  title: string
  slug: string
  targetKeyword: string
  secondaryKeywords: string[]
  contentType: ArticleType
  targetWordCount: number
  outline: ArticleOutline
  seoMeta: SEOMeta
  regionalFocus: RegionalFocus
  productMentions: ProductMention[]
  internalLinks: InternalLink[]
  ctaStrategy: CTAStrategy
  createdAt: Date
}

export type ArticleType =
  | 'pillar_page'      // 2500+ words comprehensive guide
  | 'cluster_article'  // 1000-1500 words supporting content
  | 'local_landing'    // Location-specific landing page
  | 'seasonal_guide'   // Time-sensitive seasonal content
  | 'product_guide'    // Product-focused educational content
  | 'how_to'           // Step-by-step tutorial
  | 'listicle'         // List-based article

export interface ArticleOutline {
  introduction: OutlineSection
  sections: OutlineSection[]
  conclusion: OutlineSection
  faq?: FAQItem[]
}

export interface OutlineSection {
  heading: string
  headingLevel: 1 | 2 | 3
  keyPoints: string[]
  targetWordCount: number
  includeImage?: boolean
  imageAlt?: string
}

export interface FAQItem {
  question: string
  answerBrief: string
}

export interface SEOMeta {
  title: string // 50-60 chars
  description: string // 130-155 chars
  ogTitle?: string
  ogDescription?: string
  canonicalUrl?: string
}

export interface RegionalFocus {
  primaryCity: string
  state: string
  metropolitanArea?: string
  population?: number
  climateFactors: ClimateFactors
  localKeywords: string[]
}

export interface ClimateFactors {
  altitude: 'low' | 'moderate' | 'high' | 'very_high'
  humidity: 'very_low' | 'low' | 'moderate'
  averageTemperature: { winter: number; summer: number }
  sunExposure: 'moderate' | 'high' | 'intense'
  primaryConcerns: string[]
}

export interface ProductMention {
  productSlug: string
  productName: string
  mentionContext: string
  linkType: 'direct' | 'contextual' | 'cta'
}

export interface InternalLink {
  targetUrl: string
  anchorText: string
  context: string
}

export interface CTAStrategy {
  primaryCTA: CTA
  secondaryCTAs: CTA[]
  frequency: 'light' | 'moderate' | 'aggressive'
}

export interface CTA {
  type: 'skin_analysis' | 'product' | 'guide' | 'newsletter'
  text: string
  url: string
  placement: 'inline' | 'end_of_section' | 'floating'
}

// ============================================================================
// GENERATED CONTENT TYPES
// ============================================================================

export interface GeneratedArticle {
  id: string
  briefId: string
  title: string
  slug: string
  content: string // Full HTML/Markdown content
  wordCount: number
  readingTime: number
  seoMeta: SEOMeta
  structuredData: ArticleStructuredData
  status: ArticleStatus
  qualityScore: QualityAssessment
  publishedAt?: Date
  shopifyArticleId?: string
  createdAt: Date
  updatedAt: Date
}

export type ArticleStatus =
  | 'draft'
  | 'review'
  | 'approved'
  | 'published'
  | 'scheduled'
  | 'archived'

export interface ArticleStructuredData {
  '@type': 'Article' | 'BlogPosting' | 'HowTo'
  headline: string
  description: string
  datePublished?: string
  dateModified?: string
  author: {
    '@type': 'Organization'
    name: string
    url: string
  }
  publisher: {
    '@type': 'Organization'
    name: string
    logo: { '@type': 'ImageObject'; url: string }
  }
  image?: string[]
  mainEntityOfPage?: string
}

export interface QualityAssessment {
  overall: number // 0-100
  readability: number
  seoOptimization: number
  keywordDensity: number
  internalLinking: number
  regionalRelevance: number
  productIntegration: number
  issues: QualityIssue[]
  suggestions: string[]
}

export interface QualityIssue {
  type: 'error' | 'warning' | 'suggestion'
  category: 'seo' | 'readability' | 'content' | 'technical'
  message: string
  location?: string
}

// ============================================================================
// COLORADO-SPECIFIC CONTENT CONFIGURATION
// ============================================================================

export interface ColoradoContentConfig {
  cities: ColoradoCityConfig[]
  statewideTpoics: string[]
  seasonalCalendar: SeasonalContent[]
  competitorUrls: string[]
  targetDemographics: string[]
}

export interface ColoradoCityConfig {
  name: string
  slug: string
  population: number
  altitude: number // feet
  metropolitanArea?: string
  neighboringCities: string[]
  primaryKeywords: string[]
  uniqueFactors: string[] // What makes this city's skincare needs unique
}

export interface SeasonalContent {
  season: 'winter' | 'spring' | 'summer' | 'fall'
  months: number[]
  contentThemes: string[]
  urgencyLevel: 'low' | 'medium' | 'high'
  publishWindow: { start: number; end: number } // Days before season
}

// ============================================================================
// CONTENT CALENDAR & SCHEDULING
// ============================================================================

export interface ContentCalendar {
  month: number
  year: number
  scheduledContent: ScheduledContent[]
  publishingGoals: PublishingGoals
}

export interface ScheduledContent {
  articleBrief: ArticleBrief
  scheduledDate: Date
  priority: 'critical' | 'high' | 'medium' | 'low'
  assignedTo?: string
  status: 'planned' | 'in_progress' | 'ready' | 'published'
}

export interface PublishingGoals {
  articlesPerWeek: number
  pillarPagesPerMonth: number
  localLandingPages: number
  minimumWordCount: number
}

// ============================================================================
// AGENT CONFIGURATION
// ============================================================================

export interface ContentWriterConfig {
  // Regional focus
  primaryRegion: ContentStrategy

  // Content guidelines
  brandVoice: BrandVoice
  contentGuidelines: ContentGuidelines

  // Publishing settings
  shopifyBlogId: string
  defaultAuthor: string
  publishingApproval: 'auto' | 'manual' | 'review_threshold'
  reviewThreshold: number // Quality score threshold for auto-publish

  // SEO settings
  targetKeywordDensity: { min: number; max: number }
  minInternalLinks: number
  includeSchema: boolean

  // Integration
  anthropicApiKey: string
  shopifyAdminToken?: string
}

export interface BrandVoice {
  tone: string[]
  personality: string[]
  avoidWords: string[]
  preferredTerms: Record<string, string>
  writingStyle: 'conversational' | 'professional' | 'educational' | 'friendly'
}

export interface ContentGuidelines {
  mustInclude: string[]
  neverInclude: string[]
  disclaimerRequired: boolean
  disclaimerText: string
  medicalClaimsPolicy: 'strict' | 'moderate'
  citationRequirements: 'none' | 'recommended' | 'required'
}

// ============================================================================
// AGENT OUTPUTS
// ============================================================================

export interface ContentWriterReport {
  agentName: string
  success: boolean
  articlesGenerated: GeneratedArticle[]
  articlesPublished: PublishedArticle[]
  qualityMetrics: AggregateQualityMetrics
  contentGaps: ContentGap[]
  recommendations: ContentRecommendation[]
  errors: string[]
  warnings: string[]
  executionTime: number
  timestamp: Date
}

export interface PublishedArticle {
  articleId: string
  shopifyArticleId: string
  title: string
  slug: string
  url: string
  publishedAt: Date
}

export interface AggregateQualityMetrics {
  averageQualityScore: number
  averageWordCount: number
  totalArticles: number
  publishedCount: number
  draftCount: number
  keywordCoverage: number
  regionalCoverage: Record<string, number>
}

export interface ContentGap {
  topic: string
  missingKeywords: string[]
  competitorsCovering: string[]
  priority: 'high' | 'medium' | 'low'
  suggestedArticleType: ArticleType
}

export interface ContentRecommendation {
  type: 'new_article' | 'update_existing' | 'optimize_seo' | 'add_internal_links'
  priority: number
  description: string
  expectedImpact: string
  effort: 'low' | 'medium' | 'high'
}
