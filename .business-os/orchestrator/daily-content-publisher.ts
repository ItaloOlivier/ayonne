/**
 * Daily Content Publisher
 *
 * Coordinates the Content Writer Agent with the SEO agents to:
 * 1. Generate one Colorado-focused article per day
 * 2. Publish to Shopify blog
 * 3. Send WhatsApp notifications to team
 *
 * Runs daily via GitHub Actions or cron job.
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import { contentWriterAgent, shopifyPublisher } from '../agents/content-writer'
import { COLORADO_CITIES, COLORADO_KEYWORDS, SEASONAL_CONTENT } from '../agents/content-writer/colorado-config'
import type { ArticleBrief, GeneratedArticle } from '../agents/content-writer/types'
import {
  whatsappService,
  formatArticlePublishedMessage,
  formatDailySEOReportMessage,
  formatCombinedDailyMessage,
  type DailySEOReportData,
  type ArticlePublishedData,
  type CombinedDailyMessageData,
} from '../notifications/whatsapp'
import { seoBridge, type ContentGap } from '../data/seo-bridge'
import { cleanArticleForPublishing } from '../agents/content-writer/ux-reviewer'

// ============================================================================
// CONTENT HISTORY TRACKING
// ============================================================================

interface PublishedContentRecord {
  slug: string
  title: string
  type: 'city_landing' | 'seasonal_guide' | 'pillar_page' | 'cluster_article'
  target: string
  publishedAt: string
  shopifyArticleId?: string
  url: string
}

interface ContentHistory {
  lastUpdated: string
  articles: PublishedContentRecord[]
}

const CONTENT_HISTORY_PATH = path.join(process.cwd(), '.business-os', 'data', 'content-history.json')

async function loadContentHistory(): Promise<ContentHistory> {
  try {
    const data = await fs.readFile(CONTENT_HISTORY_PATH, 'utf-8')
    return JSON.parse(data)
  } catch {
    return { lastUpdated: new Date().toISOString(), articles: [] }
  }
}

async function saveContentHistory(history: ContentHistory): Promise<void> {
  const dir = path.dirname(CONTENT_HISTORY_PATH)
  await fs.mkdir(dir, { recursive: true })
  history.lastUpdated = new Date().toISOString()
  await fs.writeFile(CONTENT_HISTORY_PATH, JSON.stringify(history, null, 2))
}

function isContentRecent(history: ContentHistory, type: string, target: string, daysThreshold: number = 90): boolean {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - daysThreshold)

  return history.articles.some((article) => {
    const publishedDate = new Date(article.publishedAt)
    return article.type === type && article.target === target && publishedDate > cutoff
  })
}

// ============================================================================
// CONTENT CALENDAR LOGIC
// ============================================================================

interface ContentCalendarEntry {
  type: 'city_landing' | 'seasonal_guide' | 'pillar_page' | 'cluster_article'
  target: string
  priority: number
}

/**
 * Get the content to publish for today based on the content calendar
 * Checks history to avoid publishing duplicate or recently published content
 * NOW INTEGRATES WITH SEO AGENT DATA for prioritization
 */
async function getTodaysContent(history: ContentHistory): Promise<ContentCalendarEntry> {
  const today = new Date()
  const dayOfYear = getDayOfYear(today)
  const dayOfWeek = today.getDay()
  const month = today.getMonth() + 1

  // =========================================================================
  // STEP 1: Check SEO Agent recommendations (highest priority)
  // =========================================================================
  const seoStats = await seoBridge.getStats()
  console.log(`[DailyPublisher] SEO Bridge: ${seoStats.contentGaps} gaps, data fresh: ${seoStats.dataFresh}`)

  if (seoStats.dataFresh && seoStats.contentGaps > 0) {
    const seoGaps = await seoBridge.getContentRecommendations(5)

    // Find SEO-recommended content not recently published
    for (const gap of seoGaps) {
      if (!isContentRecent(history, gap.suggestedType, gap.topic, 60)) {
        console.log(`[DailyPublisher] Using SEO gap: ${gap.topic} (priority: ${gap.priority}, source: ${gap.source})`)
        return {
          type: gap.suggestedType,
          target: gap.keyword || gap.topic,
          priority: gap.priority + 10, // Boost SEO-recommended content
        }
      }
    }
  }

  // =========================================================================
  // STEP 2: Fall back to content calendar rotation
  // =========================================================================

  // Content rotation strategy:
  // - Monday: City landing pages (Denver, Boulder, Colorado Springs, Fort Collins)
  // - Tuesday: Seasonal content based on current/upcoming season
  // - Wednesday: Pillar pages (high_altitude, dry_climate, hydration)
  // - Thursday: Cluster articles (specific keywords)
  // - Friday: City landing pages (continued)
  // - Weekend: Lower priority cluster articles

  // Determine season
  const season = getCurrentSeason(month)

  // Determine pillar topics
  const pillarTopics = ['high_altitude', 'dry_climate', 'hydration']

  // Get high-priority keywords not yet covered
  const highPriorityKeywords = COLORADO_KEYWORDS.filter((k) => k.priority > 60)

  // Build a list of potential content, checking against history
  const candidates: ContentCalendarEntry[] = []

  // Add city landing pages (skip if published in last 90 days)
  for (const city of COLORADO_CITIES) {
    if (!isContentRecent(history, 'city_landing', city.slug, 90)) {
      candidates.push({ type: 'city_landing', target: city.slug, priority: 90 })
    }
  }

  // Add seasonal content (skip if published in last 60 days for current season)
  if (!isContentRecent(history, 'seasonal_guide', season, 60)) {
    candidates.push({ type: 'seasonal_guide', target: season, priority: 85 })
  }

  // Add pillar pages (skip if published in last 120 days)
  for (const topic of pillarTopics) {
    if (!isContentRecent(history, 'pillar_page', topic, 120)) {
      candidates.push({ type: 'pillar_page', target: topic, priority: 80 })
    }
  }

  // Add cluster articles from keywords (skip if published in last 90 days)
  for (const keyword of highPriorityKeywords) {
    if (!isContentRecent(history, 'cluster_article', keyword.keyword, 90)) {
      candidates.push({ type: 'cluster_article', target: keyword.keyword, priority: keyword.priority })
    }
  }

  // If no fresh candidates, log warning and pick oldest content type
  if (candidates.length === 0) {
    console.warn('[DailyPublisher] All content types have been recently published. Selecting least recent.')
    // Fall back to day-based rotation
    const cityIndex = Math.floor(dayOfYear / 7) % COLORADO_CITIES.length
    return { type: 'city_landing', target: COLORADO_CITIES[cityIndex].slug, priority: 50 }
  }

  // Select based on day of week preferences, but only from available candidates
  let preferredType: ContentCalendarEntry['type']
  switch (dayOfWeek) {
    case 1: // Monday - City landing
    case 5: // Friday - City landing
      preferredType = 'city_landing'
      break
    case 2: // Tuesday - Seasonal
      preferredType = 'seasonal_guide'
      break
    case 3: // Wednesday - Pillar
      preferredType = 'pillar_page'
      break
    default: // Thursday, Weekend - Cluster
      preferredType = 'cluster_article'
  }

  // Try to find preferred type first
  const preferredCandidates = candidates.filter((c) => c.type === preferredType)
  if (preferredCandidates.length > 0) {
    // Sort by priority and pick highest
    preferredCandidates.sort((a, b) => b.priority - a.priority)
    return preferredCandidates[0]
  }

  // Fall back to highest priority available
  candidates.sort((a, b) => b.priority - a.priority)
  return candidates[0]
}

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0)
  const diff = date.getTime() - start.getTime()
  const oneDay = 1000 * 60 * 60 * 24
  return Math.floor(diff / oneDay)
}

function getCurrentSeason(month: number): 'winter' | 'spring' | 'summer' | 'fall' {
  if (month >= 12 || month <= 2) return 'winter'
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  return 'fall'
}

// ============================================================================
// MAIN PUBLISHER
// ============================================================================

export interface DailyPublishResult {
  success: boolean
  date: string
  article?: {
    title: string
    slug: string
    url: string
    wordCount: number
    qualityScore: number
  }
  shopifyArticleId?: string
  whatsappSent: boolean
  errors: string[]
}

export async function runDailyPublisher(): Promise<DailyPublishResult> {
  const result: DailyPublishResult = {
    success: false,
    date: new Date().toISOString().split('T')[0],
    whatsappSent: false,
    errors: [],
  }

  console.log(`[DailyPublisher] Starting for ${result.date}`)

  try {
    // Step 1: Load content history to avoid duplicates
    const history = await loadContentHistory()
    console.log(`[DailyPublisher] Loaded history with ${history.articles.length} published articles`)

    // Step 2: Initialize Content Writer Agent
    await contentWriterAgent.initialize()

    // Step 3: Determine today's content (checks history for freshness)
    const todaysContent = await getTodaysContent(history)
    console.log(`[DailyPublisher] Today's content: ${todaysContent.type} - ${todaysContent.target}`)

    // Step 4: Generate brief based on content type
    let brief: ArticleBrief

    switch (todaysContent.type) {
      case 'city_landing':
        brief = contentWriterAgent.generateCityLandingBrief(todaysContent.target)
        break
      case 'seasonal_guide':
        brief = contentWriterAgent.generateSeasonalBrief(
          todaysContent.target as 'winter' | 'spring' | 'summer' | 'fall'
        )
        break
      case 'pillar_page':
        brief = contentWriterAgent.generatePillarBrief(todaysContent.target)
        break
      default:
        // For cluster articles, create a city landing for now
        // In future, add generateClusterBrief method
        brief = contentWriterAgent.generateCityLandingBrief('denver')
    }

    console.log(`[DailyPublisher] Generated brief: ${brief.title}`)

    // Step 5: Generate article content
    const rawArticle = await contentWriterAgent.generateArticle(brief)
    console.log(`[DailyPublisher] Generated article: ${rawArticle.wordCount} words, quality: ${rawArticle.qualityScore.overall}`)

    // Step 5b: UX/UI Review - clean up formatting before publishing
    const article = cleanArticleForPublishing(rawArticle)
    console.log(`[DailyPublisher] UX review complete - article ready for publishing`)

    result.article = {
      title: article.title,
      slug: article.slug,
      url: `https://ayonne.skin/blogs/news/${article.slug}`,
      wordCount: article.wordCount,
      qualityScore: article.qualityScore.overall,
    }

    // Step 6: Publish to Shopify (if quality is acceptable)
    let publishedSuccessfully = false
    if (article.qualityScore.overall >= 60) {
      if (shopifyPublisher.isReady()) {
        // Check for duplicate content before publishing
        const duplicateCheck = await shopifyPublisher.checkForDuplicate(article.slug)

        if (duplicateCheck.exists) {
          const existingTitle = duplicateCheck.existingArticle?.title || 'unknown'
          const existingHandle = duplicateCheck.existingArticle?.handle || article.slug
          result.errors.push(`Duplicate detected: "${existingTitle}" (${existingHandle}) - skipping publish`)
          console.warn(`[DailyPublisher] Duplicate article found: ${existingTitle}`)
          console.log(`[DailyPublisher] Skipping to avoid duplicate content`)
        } else {
          const publishResult = await shopifyPublisher.publishArticle(article, brief)

          if (publishResult.success) {
            result.shopifyArticleId = publishResult.articleId
            result.article!.url = publishResult.url || result.article!.url
            publishedSuccessfully = true
            console.log(`[DailyPublisher] Published to Shopify: ${publishResult.articleId}`)

            // Step 7: Save to content history to prevent future duplicates
            history.articles.push({
              slug: article.slug,
              title: article.title,
              type: todaysContent.type,
              target: todaysContent.target,
              publishedAt: new Date().toISOString(),
              shopifyArticleId: publishResult.articleId,
              url: result.article!.url,
            })
            await saveContentHistory(history)
            console.log(`[DailyPublisher] Saved to content history`)
          } else {
            result.errors.push(`Shopify publish failed: ${publishResult.error}`)
            console.error(`[DailyPublisher] Shopify publish failed: ${publishResult.error}`)
          }
        }
      } else {
        console.log('[DailyPublisher] Shopify publisher not configured - article saved as draft')
      }
    } else {
      result.errors.push(`Quality score too low (${article.qualityScore.overall}) - article not published`)
      console.warn(`[DailyPublisher] Quality too low for auto-publish`)
    }

    // Step 8: Send SINGLE combined WhatsApp notification (only if published successfully)
    // This replaces the old separate article + SEO report messages
    if (publishedSuccessfully && whatsappService.isReady()) {
      // Get tomorrow's content topic for the message
      const tomorrowsContent = await getTodaysContent(history) // Will get next priority item
      const nextTopic = tomorrowsContent ? `${tomorrowsContent.target} ${tomorrowsContent.type.replace('_', ' ')}` : undefined

      // Count articles published this week
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      const articlesThisWeek = history.articles.filter(
        a => new Date(a.publishedAt) >= weekStart
      ).length

      const combinedData: CombinedDailyMessageData = {
        title: article.title,
        url: result.article!.url,
        targetKeyword: brief.targetKeyword,
        city: brief.regionalFocus.primaryCity,
        wordCount: article.wordCount,
        qualityScore: article.qualityScore.overall,
        nextArticleTopic: nextTopic,
        totalArticlesThisWeek: articlesThisWeek,
      }

      await whatsappService.sendCombinedDailyUpdate(combinedData)
      result.whatsappSent = true
      console.log('[DailyPublisher] Combined WhatsApp notification sent')
    } else if (!publishedSuccessfully) {
      console.log('[DailyPublisher] Skipping WhatsApp - article was not published')
    } else {
      console.log('[DailyPublisher] WhatsApp not configured - skipping notifications')
    }

    result.success = true

  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown error')
    console.error('[DailyPublisher] Error:', error)
  }

  return result
}

// ============================================================================
// SEO REPORT INTEGRATION
// ============================================================================

/**
 * Read SEO agent results and send daily report via WhatsApp
 */
export async function sendDailySEOReport(): Promise<void> {
  const today = new Date().toISOString().split('T')[0]

  try {
    // Try to read the SEO summary from the runs directory
    const fs = await import('fs/promises')
    const path = await import('path')

    const summaryPath = path.join(process.cwd(), 'runs', today, 'summary.json')

    let seoSummary: Record<string, unknown> | null = null
    try {
      const content = await fs.readFile(summaryPath, 'utf-8')
      seoSummary = JSON.parse(content)
    } catch {
      console.log('[SEOReport] No SEO summary found for today')
    }

    // Get content writer report
    const report = contentWriterAgent.generateReport()

    // Combine into daily report
    const reportData: DailySEOReportData = {
      date: today,
      articlesPublished: report.qualityMetrics.publishedCount,
      totalArticles: report.qualityMetrics.totalArticles,
      keywordsCovered: Math.round(report.qualityMetrics.keywordCoverage * COLORADO_KEYWORDS.length / 100),
      totalKeywords: COLORADO_KEYWORDS.length,
      contentGaps: report.contentGaps.slice(0, 5).map((g) => g.topic),
      upcomingContent: report.recommendations
        .filter((r) => r.type === 'new_article')
        .slice(0, 3)
        .map((r) => r.description),
      recommendations: report.recommendations
        .slice(0, 3)
        .map((r) => r.description),
    }

    // Add SEO agent metrics if available
    if (seoSummary) {
      reportData.topPerformingKeyword = 'Denver skincare' // Would come from analytics
    }

    // Send via WhatsApp
    if (whatsappService.isReady()) {
      await whatsappService.sendDailySEOReport(reportData)
      console.log('[SEOReport] Daily report sent via WhatsApp')
    }

  } catch (error) {
    console.error('[SEOReport] Error sending report:', error)
  }
}

// ============================================================================
// CLI RUNNER
// ============================================================================

async function main() {
  const args = process.argv.slice(2)
  const command = args[0] || 'publish'

  switch (command) {
    case 'publish':
    case 'both': // 'both' now just runs publish (combined message replaces separate report)
      console.log('Running daily content publisher...')
      const result = await runDailyPublisher()
      console.log('Result:', JSON.stringify(result, null, 2))
      process.exit(result.success ? 0 : 1)

    case 'report':
      // Legacy: still available for manual SEO report if needed
      console.log('Sending daily SEO report...')
      await sendDailySEOReport()
      process.exit(0)

    default:
      console.log('Usage: npx ts-node daily-content-publisher.ts [publish|report]')
      process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
}
