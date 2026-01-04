/**
 * Content Performance Feedback Loop
 *
 * Tracks published content performance and feeds metrics back
 * to the SEO agents for improved recommendations.
 *
 * Data sources:
 * - Shopify Blog Analytics (via Admin API)
 * - SEO Agent crawl data
 * - Content history tracking
 *
 * Outputs:
 * - Performance reports for each published article
 * - Recommendations for content updates
 * - Alerts for underperforming content
 */

import * as fs from 'fs/promises'
import * as path from 'path'

// ============================================================================
// TYPES
// ============================================================================

export interface ContentPerformanceRecord {
  slug: string
  title: string
  publishedAt: string
  url: string

  // Traffic metrics (from Shopify/analytics)
  pageViews?: number
  uniqueVisitors?: number
  avgTimeOnPage?: number // seconds
  bounceRate?: number // percentage

  // Engagement metrics
  commentsCount?: number
  sharesCount?: number

  // SEO metrics (from SEO agent crawls)
  lastCrawled?: string
  indexStatus?: 'indexed' | 'not_indexed' | 'blocked' | 'unknown'
  internalLinksTo?: number
  internalLinksFrom?: number
  externalBacklinks?: number

  // Quality scores
  contentScore?: number // from content agent
  seoScore?: number // from SEO audit

  // Derived metrics
  performanceScore?: number // composite score
  performanceLevel?: 'excellent' | 'good' | 'average' | 'underperforming'
  needsUpdate?: boolean
  updateRecommendations?: string[]

  // Tracking
  lastUpdated: string
}

export interface PerformanceReport {
  generatedAt: string
  totalArticles: number
  averagePerformanceScore: number
  performanceDistribution: {
    excellent: number
    good: number
    average: number
    underperforming: number
  }
  topPerformers: ContentPerformanceRecord[]
  needsAttention: ContentPerformanceRecord[]
  recommendations: string[]
}

// ============================================================================
// PERFORMANCE TRACKER
// ============================================================================

const PERFORMANCE_DATA_PATH = path.join(
  process.cwd(),
  '.business-os',
  'data',
  'content-performance.json'
)

export class ContentPerformanceTracker {
  private records: Map<string, ContentPerformanceRecord> = new Map()
  private initialized = false

  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      const data = await fs.readFile(PERFORMANCE_DATA_PATH, 'utf-8')
      const parsed = JSON.parse(data) as ContentPerformanceRecord[]
      parsed.forEach((record) => this.records.set(record.slug, record))
    } catch {
      // No existing data
    }

    this.initialized = true
  }

  async save(): Promise<void> {
    const dir = path.dirname(PERFORMANCE_DATA_PATH)
    await fs.mkdir(dir, { recursive: true })
    const data = Array.from(this.records.values())
    await fs.writeFile(PERFORMANCE_DATA_PATH, JSON.stringify(data, null, 2))
  }

  /**
   * Track a new or updated article
   */
  async trackArticle(
    slug: string,
    data: Partial<ContentPerformanceRecord>
  ): Promise<ContentPerformanceRecord> {
    await this.initialize()

    const existing = this.records.get(slug) || {
      slug,
      title: data.title || slug,
      publishedAt: data.publishedAt || new Date().toISOString(),
      url: data.url || `https://ayonne.skin/blogs/news/${slug}`,
      lastUpdated: new Date().toISOString(),
    }

    const updated: ContentPerformanceRecord = {
      ...existing,
      ...data,
      lastUpdated: new Date().toISOString(),
    }

    // Calculate performance score
    updated.performanceScore = this.calculatePerformanceScore(updated)
    updated.performanceLevel = this.getPerformanceLevel(updated.performanceScore)
    updated.needsUpdate = this.shouldUpdate(updated)
    updated.updateRecommendations = this.getUpdateRecommendations(updated)

    this.records.set(slug, updated)
    await this.save()

    return updated
  }

  /**
   * Update metrics from SEO agent crawl data
   */
  async updateFromSEOCrawl(crawlData: Record<string, CrawlResult>): Promise<number> {
    await this.initialize()

    let updated = 0

    for (const [url, result] of Object.entries(crawlData)) {
      // Check if this is a blog article
      if (!url.includes('/blogs/') && !url.includes('/blog/')) continue

      // Extract slug from URL
      const slug = url.split('/').pop()?.replace('.html', '') || ''
      if (!slug) continue

      const existing = this.records.get(slug)
      if (!existing) continue

      // Update SEO metrics
      existing.lastCrawled = new Date().toISOString()
      existing.internalLinksFrom = result.internal_links || 0
      existing.indexStatus = result.robots_meta?.includes('noindex') ? 'blocked' : 'indexed'

      // Recalculate scores
      existing.performanceScore = this.calculatePerformanceScore(existing)
      existing.performanceLevel = this.getPerformanceLevel(existing.performanceScore)
      existing.needsUpdate = this.shouldUpdate(existing)
      existing.lastUpdated = new Date().toISOString()

      this.records.set(slug, existing)
      updated++
    }

    if (updated > 0) {
      await this.save()
    }

    return updated
  }

  /**
   * Get articles that need attention (updates, optimization)
   */
  async getUnderperformingContent(limit: number = 10): Promise<ContentPerformanceRecord[]> {
    await this.initialize()

    return Array.from(this.records.values())
      .filter((r) => r.needsUpdate || r.performanceLevel === 'underperforming')
      .sort((a, b) => (a.performanceScore || 0) - (b.performanceScore || 0))
      .slice(0, limit)
  }

  /**
   * Get top performing content
   */
  async getTopPerformers(limit: number = 5): Promise<ContentPerformanceRecord[]> {
    await this.initialize()

    return Array.from(this.records.values())
      .filter((r) => r.performanceScore !== undefined)
      .sort((a, b) => (b.performanceScore || 0) - (a.performanceScore || 0))
      .slice(0, limit)
  }

  /**
   * Generate comprehensive performance report
   */
  async generateReport(): Promise<PerformanceReport> {
    await this.initialize()

    const allRecords = Array.from(this.records.values())
    const withScores = allRecords.filter((r) => r.performanceScore !== undefined)

    const distribution = {
      excellent: 0,
      good: 0,
      average: 0,
      underperforming: 0,
    }

    withScores.forEach((r) => {
      if (r.performanceLevel) {
        distribution[r.performanceLevel]++
      }
    })

    const avgScore =
      withScores.length > 0
        ? withScores.reduce((sum, r) => sum + (r.performanceScore || 0), 0) / withScores.length
        : 0

    const topPerformers = await this.getTopPerformers(5)
    const needsAttention = await this.getUnderperformingContent(5)

    // Generate recommendations
    const recommendations: string[] = []

    if (distribution.underperforming > distribution.excellent) {
      recommendations.push(
        `${distribution.underperforming} articles underperforming - consider content refresh`
      )
    }

    if (needsAttention.some((r) => r.internalLinksTo === 0)) {
      recommendations.push('Add internal links to orphan articles')
    }

    const staleContent = allRecords.filter((r) => {
      const published = new Date(r.publishedAt)
      const daysSince = (Date.now() - published.getTime()) / (1000 * 60 * 60 * 24)
      return daysSince > 180 && !r.lastCrawled
    })

    if (staleContent.length > 0) {
      recommendations.push(`${staleContent.length} articles over 180 days old need review`)
    }

    return {
      generatedAt: new Date().toISOString(),
      totalArticles: allRecords.length,
      averagePerformanceScore: Math.round(avgScore),
      performanceDistribution: distribution,
      topPerformers,
      needsAttention,
      recommendations,
    }
  }

  /**
   * Get feedback for SEO agents
   */
  async getFeedbackForSEO(): Promise<SEOFeedback> {
    await this.initialize()

    const allRecords = Array.from(this.records.values())

    // Find content patterns that perform well
    const topPerformers = await this.getTopPerformers(10)
    const performingKeywords: string[] = []
    const performingTopics: string[] = []

    topPerformers.forEach((r) => {
      // Extract keywords from title
      const words = r.title.toLowerCase().split(/\s+/)
      words
        .filter((w) => w.length > 4 && !STOP_WORDS.includes(w))
        .forEach((w) => performingKeywords.push(w))
    })

    // Find what's NOT working
    const underperforming = await this.getUnderperformingContent(10)
    const strugglingTopics: string[] = underperforming.map((r) => r.title)

    return {
      generatedAt: new Date().toISOString(),
      performingKeywords: Array.from(new Set(performingKeywords)).slice(0, 20),
      performingTopics,
      strugglingTopics,
      contentGapsIdentified: underperforming
        .filter((r) => r.internalLinksTo === 0 || (r.internalLinksTo || 0) < 3)
        .map((r) => r.slug),
      recommendedActions: [
        'Create more content around performing keywords',
        'Add internal links to struggling articles',
        'Refresh stale content with new information',
      ],
    }
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private calculatePerformanceScore(record: ContentPerformanceRecord): number {
    let score = 50 // Base score

    // Traffic factors (0-30 points)
    if (record.pageViews) {
      if (record.pageViews > 1000) score += 30
      else if (record.pageViews > 500) score += 20
      else if (record.pageViews > 100) score += 10
      else if (record.pageViews > 50) score += 5
    }

    // Engagement factors (0-20 points)
    if (record.avgTimeOnPage) {
      if (record.avgTimeOnPage > 180) score += 15 // 3+ minutes
      else if (record.avgTimeOnPage > 60) score += 10
      else if (record.avgTimeOnPage > 30) score += 5
    }

    if (record.bounceRate !== undefined) {
      if (record.bounceRate < 30) score += 5
      else if (record.bounceRate > 80) score -= 10
    }

    // SEO factors (0-20 points)
    if (record.indexStatus === 'indexed') score += 5
    if (record.internalLinksTo && record.internalLinksTo >= 3) score += 5
    if (record.externalBacklinks && record.externalBacklinks > 0) score += 10

    // Content quality (0-15 points)
    if (record.contentScore) {
      score += Math.round(record.contentScore / 100 * 15)
    }

    // Age penalty (old content without updates)
    const publishedDate = new Date(record.publishedAt)
    const daysSincePublished = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSincePublished > 365) score -= 10
    else if (daysSincePublished > 180) score -= 5

    return Math.max(0, Math.min(100, score))
  }

  private getPerformanceLevel(
    score: number
  ): 'excellent' | 'good' | 'average' | 'underperforming' {
    if (score >= 80) return 'excellent'
    if (score >= 60) return 'good'
    if (score >= 40) return 'average'
    return 'underperforming'
  }

  private shouldUpdate(record: ContentPerformanceRecord): boolean {
    // Underperforming content needs update
    if (record.performanceLevel === 'underperforming') return true

    // Old content needs refresh
    const daysSince = (Date.now() - new Date(record.publishedAt).getTime()) / (1000 * 60 * 60 * 24)
    if (daysSince > 180 && (record.performanceScore || 0) < 70) return true

    // Low internal links
    if ((record.internalLinksTo || 0) < 2) return true

    return false
  }

  private getUpdateRecommendations(record: ContentPerformanceRecord): string[] {
    const recommendations: string[] = []

    if ((record.internalLinksTo || 0) < 3) {
      recommendations.push('Add more internal links to this article')
    }

    if (record.bounceRate && record.bounceRate > 70) {
      recommendations.push('Improve content engagement to reduce bounce rate')
    }

    if (record.avgTimeOnPage && record.avgTimeOnPage < 30) {
      recommendations.push('Add more valuable content to increase time on page')
    }

    const daysSince = (Date.now() - new Date(record.publishedAt).getTime()) / (1000 * 60 * 60 * 24)
    if (daysSince > 180) {
      recommendations.push('Update content with fresh information')
    }

    if (!record.externalBacklinks) {
      recommendations.push('Promote article for backlink opportunities')
    }

    return recommendations
  }
}

// ============================================================================
// TYPES FOR CRAWL DATA
// ============================================================================

interface CrawlResult {
  url: string
  status_code?: number
  title?: string
  description?: string
  h1?: string
  canonical?: string
  robots_meta?: string
  word_count?: number
  internal_links?: number
  external_links?: number
  images?: number
  schema_types?: string[]
  error?: string
}

interface SEOFeedback {
  generatedAt: string
  performingKeywords: string[]
  performingTopics: string[]
  strugglingTopics: string[]
  contentGapsIdentified: string[]
  recommendedActions: string[]
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STOP_WORDS = [
  'the',
  'and',
  'for',
  'are',
  'but',
  'not',
  'you',
  'all',
  'can',
  'had',
  'her',
  'was',
  'one',
  'our',
  'out',
  'has',
  'have',
  'been',
  'were',
  'with',
  'they',
  'this',
  'that',
  'from',
  'what',
  'your',
  'about',
  'which',
  'their',
  'there',
  'would',
  'could',
  'should',
  'skincare',
  'skin',
  'colorado',
]

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const contentPerformanceTracker = new ContentPerformanceTracker()
