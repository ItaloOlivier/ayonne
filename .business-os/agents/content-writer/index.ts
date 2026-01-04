/**
 * Content Writer Agent
 *
 * Autonomous content generation and publishing agent focused on
 * Colorado regional SEO and dry climate skincare content.
 *
 * Features:
 * - Colorado-first content strategy (Denver, Boulder, Colorado Springs, Fort Collins)
 * - Seasonal content calendar (winter focus on dryness, summer on UV protection)
 * - Competitor analysis (The Skin Company, Colorado Skin Surgery & Dermatology)
 * - Shopify blog publishing integration
 * - SEO-optimized article generation
 * - Quality scoring and content gap analysis
 *
 * Usage:
 * ```typescript
 * import { contentWriterAgent, COLORADO_CONTENT_STRATEGY } from './.business-os/agents/content-writer'
 *
 * // Initialize the agent
 * await contentWriterAgent.initialize({
 *   shopifyBlogId: 'gid://shopify/Blog/108098158940',
 *   publishingApproval: 'manual',
 * })
 *
 * // Generate a Denver landing page brief
 * const brief = contentWriterAgent.generateCityLandingBrief('denver')
 *
 * // Generate the article content
 * const article = await contentWriterAgent.generateArticle(brief)
 *
 * // Check content gaps
 * const gaps = contentWriterAgent.identifyContentGaps()
 *
 * // Get recommendations
 * const recommendations = contentWriterAgent.generateRecommendations()
 * ```
 */

// Core Types
export * from './types'

// Colorado Configuration
export {
  COLORADO_CITIES,
  COLORADO_CONFIG,
  COLORADO_CONTENT_STRATEGY,
  COLORADO_KEYWORDS,
  SEASONAL_CONTENT,
  AYONNE_BRAND_VOICE,
  CONTENT_GUIDELINES,
  ARTICLE_TEMPLATES,
} from './colorado-config'

// Content Writer Agent
export { ContentWriterAgent, contentWriterAgent } from './content-writer-agent'

// Shopify Publisher
export { ShopifyPublisher, shopifyPublisher } from './shopify-publisher'

// Re-export key types for convenience
export type {
  ContentWriterConfig,
  ArticleBrief,
  GeneratedArticle,
  ContentWriterReport,
  QualityAssessment,
  ContentGap,
  ContentRecommendation,
  ColoradoCityConfig,
  SeasonalContent,
  KeywordTarget,
} from './types'
