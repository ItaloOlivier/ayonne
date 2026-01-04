/**
 * Shared Keyword Manager
 *
 * Centralized keyword management for both Python SEO agents and TypeScript Content Writer.
 * Provides a single source of truth for keyword priorities, tracking, and performance.
 *
 * The shared-keywords.json file is read/written by both systems:
 * - Python SEO agents update keyword priorities based on rankings
 * - TypeScript Content Writer uses keywords for article generation
 * - Performance data feeds back for continuous optimization
 */

import * as fs from 'fs/promises'
import * as path from 'path'

// ============================================================================
// TYPES
// ============================================================================

export interface Keyword {
  keyword: string
  priority: number
  volume: 'high' | 'medium' | 'low'
  difficulty: 'high' | 'medium' | 'low'
  intent: 'commercial' | 'informational' | 'navigational' | 'transactional'
  status: 'active' | 'paused' | 'completed'
  lastTargeted?: string | null
  performance?: KeywordPerformance | null
}

export interface KeywordPerformance {
  articlesCount: number
  avgPosition?: number
  clicks?: number
  impressions?: number
  ctr?: number
  lastUpdated: string
}

export interface TopicCluster {
  pillar: string
  clusters: string[]
}

export interface KeywordData {
  version: string
  lastUpdated: string
  keywords: {
    primary: Keyword[]
    secondary: Keyword[]
    longtail: Keyword[]
  }
  topicClusters: Record<string, TopicCluster>
  tracking: {
    articlesPerKeyword: Record<string, string[]>
    keywordPerformance: Record<string, KeywordPerformance>
    lastSyncedFromSEO: string | null
  }
}

export interface KeywordRecommendation {
  keyword: string
  priority: number
  reason: string
  suggestedContentType: 'pillar' | 'cluster' | 'landing'
}

// ============================================================================
// KEYWORD MANAGER
// ============================================================================

const KEYWORDS_PATH = path.join(process.cwd(), '.business-os', 'data', 'shared-keywords.json')

export class KeywordManager {
  private data: KeywordData | null = null
  private initialized = false

  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      const content = await fs.readFile(KEYWORDS_PATH, 'utf-8')
      this.data = JSON.parse(content)
      this.initialized = true
    } catch (error) {
      console.error('[KeywordManager] Failed to load keywords:', error)
      this.data = this.getDefaultData()
      this.initialized = true
    }
  }

  async save(): Promise<void> {
    if (!this.data) return

    this.data.lastUpdated = new Date().toISOString()
    const dir = path.dirname(KEYWORDS_PATH)
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(KEYWORDS_PATH, JSON.stringify(this.data, null, 2))
  }

  /**
   * Get all keywords by tier
   */
  async getAllKeywords(): Promise<KeywordData['keywords']> {
    await this.initialize()
    return this.data!.keywords
  }

  /**
   * Get priority-sorted keywords for content targeting
   */
  async getPriorityKeywords(limit: number = 20): Promise<Keyword[]> {
    await this.initialize()

    const allKeywords = [
      ...this.data!.keywords.primary,
      ...this.data!.keywords.secondary,
      ...this.data!.keywords.longtail,
    ]

    return allKeywords
      .filter((k) => k.status === 'active')
      .sort((a, b) => b.priority - a.priority)
      .slice(0, limit)
  }

  /**
   * Get keywords that haven't been targeted recently
   */
  async getUntargetedKeywords(daysSinceTargeted: number = 30): Promise<Keyword[]> {
    await this.initialize()

    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - daysSinceTargeted)

    const allKeywords = [
      ...this.data!.keywords.primary,
      ...this.data!.keywords.secondary,
      ...this.data!.keywords.longtail,
    ]

    return allKeywords.filter((k) => {
      if (k.status !== 'active') return false
      if (!k.lastTargeted) return true

      const targetedDate = new Date(k.lastTargeted)
      return targetedDate < cutoff
    })
  }

  /**
   * Get content recommendations based on keyword analysis
   */
  async getContentRecommendations(limit: number = 5): Promise<KeywordRecommendation[]> {
    await this.initialize()

    const recommendations: KeywordRecommendation[] = []

    // Check for untargeted high-priority keywords
    const untargeted = await this.getUntargetedKeywords(30)
    for (const kw of untargeted.slice(0, 3)) {
      recommendations.push({
        keyword: kw.keyword,
        priority: kw.priority,
        reason: 'High-priority keyword not recently targeted',
        suggestedContentType: this.inferContentType(kw),
      })
    }

    // Check for topic cluster gaps
    for (const [clusterId, cluster] of Object.entries(this.data!.topicClusters)) {
      const articlesForCluster = this.data!.tracking.articlesPerKeyword[cluster.pillar] || []
      if (articlesForCluster.length === 0) {
        recommendations.push({
          keyword: cluster.pillar,
          priority: 90,
          reason: `Pillar content needed for ${clusterId} cluster`,
          suggestedContentType: 'pillar',
        })
      }
    }

    return recommendations
      .sort((a, b) => b.priority - a.priority)
      .slice(0, limit)
  }

  /**
   * Mark a keyword as targeted with an article
   */
  async markKeywordTargeted(keyword: string, articleSlug: string): Promise<void> {
    await this.initialize()

    const now = new Date().toISOString()

    // Update keyword lastTargeted
    for (const tier of ['primary', 'secondary', 'longtail'] as const) {
      const kw = this.data!.keywords[tier].find(
        (k) => k.keyword.toLowerCase() === keyword.toLowerCase()
      )
      if (kw) {
        kw.lastTargeted = now
        break
      }
    }

    // Track article for keyword
    if (!this.data!.tracking.articlesPerKeyword[keyword]) {
      this.data!.tracking.articlesPerKeyword[keyword] = []
    }
    if (!this.data!.tracking.articlesPerKeyword[keyword].includes(articleSlug)) {
      this.data!.tracking.articlesPerKeyword[keyword].push(articleSlug)
    }

    await this.save()
  }

  /**
   * Update keyword performance from SEO data
   */
  async updateKeywordPerformance(
    keyword: string,
    performance: Partial<KeywordPerformance>
  ): Promise<void> {
    await this.initialize()

    const existing = this.data!.tracking.keywordPerformance[keyword] || {
      articlesCount: 0,
      lastUpdated: new Date().toISOString(),
    }

    this.data!.tracking.keywordPerformance[keyword] = {
      ...existing,
      ...performance,
      lastUpdated: new Date().toISOString(),
    }

    // Update priority based on performance
    await this.adjustPriorityFromPerformance(keyword)

    await this.save()
  }

  /**
   * Sync keywords from Python SEO agent output
   */
  async syncFromSEOAgent(seoKeywords: {
    keyword: string
    priority?: number
    avgPosition?: number
    clicks?: number
    impressions?: number
  }[]): Promise<number> {
    await this.initialize()

    let updated = 0

    for (const seoKw of seoKeywords) {
      // Check if keyword exists
      let found = false
      for (const tier of ['primary', 'secondary', 'longtail'] as const) {
        const kw = this.data!.keywords[tier].find(
          (k) => k.keyword.toLowerCase() === seoKw.keyword.toLowerCase()
        )
        if (kw) {
          // Update priority if SEO agent recommends higher
          if (seoKw.priority && seoKw.priority > kw.priority) {
            kw.priority = seoKw.priority
          }
          found = true
          updated++
          break
        }
      }

      // Add new keyword if not found (to longtail)
      if (!found) {
        this.data!.keywords.longtail.push({
          keyword: seoKw.keyword,
          priority: seoKw.priority || 50,
          volume: 'low',
          difficulty: 'low',
          intent: 'informational',
          status: 'active',
          lastTargeted: null,
          performance: null,
        })
        updated++
      }

      // Update performance data
      if (seoKw.avgPosition || seoKw.clicks || seoKw.impressions) {
        await this.updateKeywordPerformance(seoKw.keyword, {
          avgPosition: seoKw.avgPosition,
          clicks: seoKw.clicks,
          impressions: seoKw.impressions,
          ctr:
            seoKw.clicks && seoKw.impressions
              ? (seoKw.clicks / seoKw.impressions) * 100
              : undefined,
        })
      }
    }

    this.data!.tracking.lastSyncedFromSEO = new Date().toISOString()
    await this.save()

    return updated
  }

  /**
   * Get topic clusters
   */
  async getTopicClusters(): Promise<Record<string, TopicCluster>> {
    await this.initialize()
    return this.data!.topicClusters
  }

  /**
   * Get keywords for a specific cluster
   */
  async getClusterKeywords(clusterId: string): Promise<Keyword[]> {
    await this.initialize()

    const cluster = this.data!.topicClusters[clusterId]
    if (!cluster) return []

    const clusterKeywords = [cluster.pillar, ...cluster.clusters]
    const allKeywords = [
      ...this.data!.keywords.primary,
      ...this.data!.keywords.secondary,
      ...this.data!.keywords.longtail,
    ]

    return allKeywords.filter((k) =>
      clusterKeywords.some(
        (ck) =>
          k.keyword.toLowerCase().includes(ck.toLowerCase()) ||
          ck.toLowerCase().includes(k.keyword.toLowerCase())
      )
    )
  }

  /**
   * Get stats for reporting
   */
  async getStats(): Promise<{
    totalKeywords: number
    activeKeywords: number
    targetedLast30Days: number
    topPerformers: string[]
    needsAttention: string[]
  }> {
    await this.initialize()

    const allKeywords = [
      ...this.data!.keywords.primary,
      ...this.data!.keywords.secondary,
      ...this.data!.keywords.longtail,
    ]

    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 30)

    const activeKeywords = allKeywords.filter((k) => k.status === 'active')
    const recentlyTargeted = allKeywords.filter((k) => {
      if (!k.lastTargeted) return false
      return new Date(k.lastTargeted) > cutoff
    })

    // Top performers (high priority, recently targeted)
    const topPerformers = allKeywords
      .filter((k) => k.priority >= 80 && k.lastTargeted)
      .map((k) => k.keyword)
      .slice(0, 5)

    // Needs attention (high priority, not targeted)
    const needsAttention = allKeywords
      .filter((k) => k.priority >= 70 && !k.lastTargeted)
      .map((k) => k.keyword)
      .slice(0, 5)

    return {
      totalKeywords: allKeywords.length,
      activeKeywords: activeKeywords.length,
      targetedLast30Days: recentlyTargeted.length,
      topPerformers,
      needsAttention,
    }
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private inferContentType(keyword: Keyword): 'pillar' | 'cluster' | 'landing' {
    const kw = keyword.keyword.toLowerCase()

    // City names suggest landing pages
    if (
      kw.includes('denver') ||
      kw.includes('boulder') ||
      kw.includes('colorado springs') ||
      kw.includes('fort collins')
    ) {
      return 'landing'
    }

    // Broad topics suggest pillar content
    if (
      kw.includes('guide') ||
      kw.includes('routine') ||
      keyword.priority >= 85
    ) {
      return 'pillar'
    }

    return 'cluster'
  }

  private async adjustPriorityFromPerformance(keyword: string): Promise<void> {
    const perf = this.data!.tracking.keywordPerformance[keyword]
    if (!perf) return

    // Find the keyword
    for (const tier of ['primary', 'secondary', 'longtail'] as const) {
      const kw = this.data!.keywords[tier].find(
        (k) => k.keyword.toLowerCase() === keyword.toLowerCase()
      )
      if (kw) {
        // Boost priority for well-performing keywords
        if (perf.avgPosition && perf.avgPosition < 10 && perf.ctr && perf.ctr > 5) {
          kw.priority = Math.min(100, kw.priority + 5)
        }
        // Reduce priority for poor performers
        else if (perf.avgPosition && perf.avgPosition > 50 && perf.articlesCount > 2) {
          kw.priority = Math.max(20, kw.priority - 5)
        }
        break
      }
    }
  }

  private getDefaultData(): KeywordData {
    return {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      keywords: {
        primary: [],
        secondary: [],
        longtail: [],
      },
      topicClusters: {},
      tracking: {
        articlesPerKeyword: {},
        keywordPerformance: {},
        lastSyncedFromSEO: null,
      },
    }
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const keywordManager = new KeywordManager()
