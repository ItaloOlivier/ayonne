/**
 * SEO Bridge
 *
 * Connects Python SEO agent outputs to TypeScript Content Writer.
 * Reads from runs/ directory and provides prioritized content recommendations.
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import { contentPerformanceTracker, type PerformanceReport } from './content-performance'

// ============================================================================
// TYPES
// ============================================================================

export interface SEOTask {
  id: string
  agent: string
  title: string
  description: string
  priority: number
  risk: number
  actionType: 'create' | 'modify' | 'report'
  affectedUrl?: string
  suggestedKeyword?: string
}

export interface ContentGap {
  topic: string
  keyword: string
  priority: number
  source: string // which agent identified it
  reason: string
  suggestedType: 'city_landing' | 'seasonal_guide' | 'pillar_page' | 'cluster_article'
}

export interface SEOSummary {
  runDate: string
  success: boolean
  totalTasksFound: number
  tasksExecuted: number
  pagesCrawled: number
  contentGaps: ContentGap[]
  priorityKeywords: string[]
  agentMetrics: Record<string, {
    tasksGenerated: number
    avgPriority: number
  }>
}

export interface SEOAgentOutput {
  agent: string
  tasks: SEOTask[]
  metrics: Record<string, number>
  contentGaps?: ContentGap[]
}

// ============================================================================
// SEO BRIDGE CLASS
// ============================================================================

export class SEOBridge {
  private runsDir: string
  private reportsDir: string
  private cachedSummary: SEOSummary | null = null
  private cacheDate: string | null = null

  constructor() {
    this.runsDir = path.join(process.cwd(), 'runs')
    this.reportsDir = path.join(process.cwd(), 'reports')
  }

  /**
   * Get the most recent SEO run date
   */
  async getLatestRunDate(): Promise<string | null> {
    try {
      const entries = await fs.readdir(this.runsDir)
      const dates = entries
        .filter((e) => /^\d{4}-\d{2}-\d{2}$/.test(e))
        .sort()
        .reverse()

      return dates[0] || null
    } catch {
      return null
    }
  }

  /**
   * Load SEO summary from a specific run
   */
  async loadSummary(runDate?: string): Promise<SEOSummary | null> {
    const date = runDate || (await this.getLatestRunDate())
    if (!date) {
      console.log('[SEOBridge] No SEO runs found')
      return null
    }

    // Return cached if same date
    if (this.cachedSummary && this.cacheDate === date) {
      return this.cachedSummary
    }

    try {
      const summaryPath = path.join(this.runsDir, date, 'summary.json')
      const content = await fs.readFile(summaryPath, 'utf-8')
      const raw = JSON.parse(content)

      const summary: SEOSummary = {
        runDate: date,
        success: raw.success || false,
        totalTasksFound: raw.total_tasks_found || 0,
        tasksExecuted: raw.tasks_executed || 0,
        pagesCrawled: raw.pages_crawled || 0,
        contentGaps: [],
        priorityKeywords: [],
        agentMetrics: {},
      }

      // Extract content gaps from agent reports
      summary.contentGaps = await this.extractContentGaps(date)
      summary.priorityKeywords = await this.extractPriorityKeywords(date)

      this.cachedSummary = summary
      this.cacheDate = date

      console.log(`[SEOBridge] Loaded SEO summary from ${date}`)
      return summary
    } catch (error) {
      console.error('[SEOBridge] Failed to load summary:', error)
      return null
    }
  }

  /**
   * Extract content gaps from agent reports
   */
  private async extractContentGaps(runDate: string): Promise<ContentGap[]> {
    const gaps: ContentGap[] = []
    const agentReportsDir = path.join(this.runsDir, runDate, 'agent_reports')

    try {
      const files = await fs.readdir(agentReportsDir)

      for (const file of files) {
        if (!file.endsWith('.json')) continue

        const content = await fs.readFile(
          path.join(agentReportsDir, file),
          'utf-8'
        )
        const report = JSON.parse(content)

        // Extract gaps from different agent types
        if (report.content_gaps) {
          for (const gap of report.content_gaps) {
            gaps.push({
              topic: gap.topic || gap.keyword || 'Unknown',
              keyword: gap.keyword || gap.topic || '',
              priority: gap.priority || 50,
              source: file.replace('.json', ''),
              reason: gap.reason || 'Identified by SEO agent',
              suggestedType: this.inferContentType(gap),
            })
          }
        }

        // Extract from keyword mapper
        if (report.missing_topics) {
          for (const topic of report.missing_topics) {
            gaps.push({
              topic: topic,
              keyword: topic,
              priority: 70,
              source: 'keyword_mapper',
              reason: 'Missing topic coverage',
              suggestedType: 'cluster_article',
            })
          }
        }

        // Extract from competitor intel
        if (report.competitor_gaps) {
          for (const gap of report.competitor_gaps) {
            gaps.push({
              topic: gap.topic || gap,
              keyword: gap.keyword || gap,
              priority: 80,
              source: 'competitor_intel',
              reason: 'Competitor has content we lack',
              suggestedType: 'pillar_page',
            })
          }
        }
      }
    } catch {
      // No agent reports directory
    }

    // Sort by priority descending
    return gaps.sort((a, b) => b.priority - a.priority)
  }

  /**
   * Extract priority keywords from SEO data
   */
  private async extractPriorityKeywords(runDate: string): Promise<string[]> {
    const keywords: Set<string> = new Set()

    try {
      // Check for keyword_mapper report
      const keywordPath = path.join(
        this.runsDir,
        runDate,
        'agent_reports',
        'keyword_mapper.json'
      )
      const content = await fs.readFile(keywordPath, 'utf-8')
      const report = JSON.parse(content)

      if (report.priority_keywords) {
        report.priority_keywords.forEach((k: string) => keywords.add(k))
      }

      if (report.near_win_keywords) {
        report.near_win_keywords.forEach((k: string) => keywords.add(k))
      }
    } catch {
      // No keyword report
    }

    return Array.from(keywords)
  }

  /**
   * Infer content type from gap data
   */
  private inferContentType(
    gap: Record<string, unknown>
  ): ContentGap['suggestedType'] {
    const topic = String(gap.topic || gap.keyword || '').toLowerCase()

    if (
      topic.includes('denver') ||
      topic.includes('boulder') ||
      topic.includes('colorado springs') ||
      topic.includes('fort collins')
    ) {
      return 'city_landing'
    }

    if (
      topic.includes('winter') ||
      topic.includes('summer') ||
      topic.includes('spring') ||
      topic.includes('fall') ||
      topic.includes('season')
    ) {
      return 'seasonal_guide'
    }

    if (
      topic.includes('guide') ||
      topic.includes('ultimate') ||
      topic.includes('complete') ||
      topic.includes('hydration') ||
      topic.includes('altitude')
    ) {
      return 'pillar_page'
    }

    return 'cluster_article'
  }

  /**
   * Get prioritized content recommendations based on SEO data
   */
  async getContentRecommendations(limit: number = 10): Promise<ContentGap[]> {
    const summary = await this.loadSummary()
    if (!summary) {
      return []
    }

    return summary.contentGaps.slice(0, limit)
  }

  /**
   * Check if a specific topic needs content based on SEO data
   */
  async topicNeedsContent(topic: string): Promise<boolean> {
    const summary = await this.loadSummary()
    if (!summary) {
      return false
    }

    const normalizedTopic = topic.toLowerCase()
    return summary.contentGaps.some(
      (gap) =>
        gap.topic.toLowerCase().includes(normalizedTopic) ||
        gap.keyword.toLowerCase().includes(normalizedTopic)
    )
  }

  /**
   * Get SEO-driven keyword suggestions for a content type
   */
  async getKeywordSuggestions(
    contentType: ContentGap['suggestedType']
  ): Promise<string[]> {
    const summary = await this.loadSummary()
    if (!summary) {
      return []
    }

    return summary.contentGaps
      .filter((gap) => gap.suggestedType === contentType)
      .map((gap) => gap.keyword)
      .slice(0, 5)
  }

  /**
   * Check if SEO data is fresh (within last 24 hours)
   */
  async isDataFresh(): Promise<boolean> {
    const latestDate = await this.getLatestRunDate()
    if (!latestDate) return false

    const runDate = new Date(latestDate)
    const now = new Date()
    const diffHours =
      (now.getTime() - runDate.getTime()) / (1000 * 60 * 60)

    return diffHours < 24
  }

  /**
   * Get summary stats for logging/reporting
   */
  async getStats(): Promise<{
    lastRun: string | null
    contentGaps: number
    priorityKeywords: number
    dataFresh: boolean
  }> {
    const summary = await this.loadSummary()
    const dataFresh = await this.isDataFresh()

    return {
      lastRun: summary?.runDate || null,
      contentGaps: summary?.contentGaps.length || 0,
      priorityKeywords: summary?.priorityKeywords.length || 0,
      dataFresh,
    }
  }

  /**
   * Get content performance feedback for SEO agents
   * This feeds back performance data to improve recommendations
   */
  async getPerformanceFeedback(): Promise<PerformanceReport | null> {
    try {
      return await contentPerformanceTracker.generateReport()
    } catch (error) {
      console.error('[SEOBridge] Failed to get performance feedback:', error)
      return null
    }
  }

  /**
   * Update content performance from latest SEO crawl
   */
  async updatePerformanceFromCrawl(): Promise<number> {
    const latestDate = await this.getLatestRunDate()
    if (!latestDate) return 0

    try {
      const crawlPath = path.join(this.runsDir, latestDate, 'crawl_data.json')
      const content = await fs.readFile(crawlPath, 'utf-8')
      const crawlData = JSON.parse(content)

      return await contentPerformanceTracker.updateFromSEOCrawl(crawlData)
    } catch (error) {
      console.error('[SEOBridge] Failed to update performance from crawl:', error)
      return 0
    }
  }

  /**
   * Get underperforming content that needs attention
   */
  async getUnderperformingContent(limit: number = 5): Promise<{
    slug: string
    title: string
    score: number
    recommendations: string[]
  }[]> {
    try {
      const underperforming = await contentPerformanceTracker.getUnderperformingContent(limit)
      return underperforming.map((r) => ({
        slug: r.slug,
        title: r.title,
        score: r.performanceScore || 0,
        recommendations: r.updateRecommendations || [],
      }))
    } catch {
      return []
    }
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const seoBridge = new SEOBridge()
