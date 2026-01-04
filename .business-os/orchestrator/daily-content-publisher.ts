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

import { contentWriterAgent, shopifyPublisher } from '../agents/content-writer'
import { COLORADO_CITIES, COLORADO_KEYWORDS, SEASONAL_CONTENT } from '../agents/content-writer/colorado-config'
import type { ArticleBrief, GeneratedArticle } from '../agents/content-writer/types'
import {
  whatsappService,
  formatArticlePublishedMessage,
  formatDailySEOReportMessage,
  type DailySEOReportData,
  type ArticlePublishedData,
} from '../notifications/whatsapp'

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
 */
function getTodaysContent(): ContentCalendarEntry {
  const today = new Date()
  const dayOfYear = getDayOfYear(today)
  const dayOfWeek = today.getDay()
  const month = today.getMonth() + 1

  // Content rotation strategy:
  // - Monday: City landing pages (Denver, Boulder, Colorado Springs, Fort Collins)
  // - Tuesday: Seasonal content based on current/upcoming season
  // - Wednesday: Pillar pages (high_altitude, dry_climate, hydration)
  // - Thursday: Cluster articles (specific keywords)
  // - Friday: City landing pages (continued)
  // - Weekend: Lower priority cluster articles

  // Determine which city (rotate through 4 cities)
  const cityIndex = Math.floor(dayOfYear / 7) % COLORADO_CITIES.length
  const city = COLORADO_CITIES[cityIndex]

  // Determine season
  const season = getCurrentSeason(month)

  // Determine pillar topic (rotate through 3 main topics)
  const pillarTopics = ['high_altitude', 'dry_climate', 'hydration']
  const pillarIndex = Math.floor(dayOfYear / 14) % pillarTopics.length
  const pillarTopic = pillarTopics[pillarIndex]

  // Get high-priority keywords not yet covered
  const keywordIndex = dayOfYear % COLORADO_KEYWORDS.filter((k) => k.priority > 60).length
  const keyword = COLORADO_KEYWORDS.filter((k) => k.priority > 60)[keywordIndex]

  switch (dayOfWeek) {
    case 1: // Monday - City landing
      return { type: 'city_landing', target: city.slug, priority: 90 }

    case 2: // Tuesday - Seasonal
      return { type: 'seasonal_guide', target: season, priority: 85 }

    case 3: // Wednesday - Pillar
      return { type: 'pillar_page', target: pillarTopic, priority: 80 }

    case 4: // Thursday - Cluster
      return { type: 'cluster_article', target: keyword.keyword, priority: 75 }

    case 5: // Friday - City (next city)
      const nextCityIndex = (cityIndex + 1) % COLORADO_CITIES.length
      return { type: 'city_landing', target: COLORADO_CITIES[nextCityIndex].slug, priority: 85 }

    default: // Weekend - Lower priority cluster
      return { type: 'cluster_article', target: keyword.keyword, priority: 60 }
  }
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
    // Step 1: Initialize Content Writer Agent
    await contentWriterAgent.initialize()

    // Step 2: Determine today's content
    const todaysContent = getTodaysContent()
    console.log(`[DailyPublisher] Today's content: ${todaysContent.type} - ${todaysContent.target}`)

    // Step 3: Generate brief based on content type
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

    // Step 4: Generate article content
    const article = await contentWriterAgent.generateArticle(brief)
    console.log(`[DailyPublisher] Generated article: ${article.wordCount} words, quality: ${article.qualityScore.overall}`)

    result.article = {
      title: article.title,
      slug: article.slug,
      url: `https://ayonne.skin/blogs/news/${article.slug}`,
      wordCount: article.wordCount,
      qualityScore: article.qualityScore.overall,
    }

    // Step 5: Publish to Shopify (if quality is acceptable)
    if (article.qualityScore.overall >= 60) {
      if (shopifyPublisher.isReady()) {
        const publishResult = await shopifyPublisher.publishArticle(article, brief)

        if (publishResult.success) {
          result.shopifyArticleId = publishResult.articleId
          result.article!.url = publishResult.url || result.article!.url
          console.log(`[DailyPublisher] Published to Shopify: ${publishResult.articleId}`)
        } else {
          result.errors.push(`Shopify publish failed: ${publishResult.error}`)
          console.error(`[DailyPublisher] Shopify publish failed: ${publishResult.error}`)
        }
      } else {
        console.log('[DailyPublisher] Shopify publisher not configured - article saved as draft')
      }
    } else {
      result.errors.push(`Quality score too low (${article.qualityScore.overall}) - article not published`)
      console.warn(`[DailyPublisher] Quality too low for auto-publish`)
    }

    // Step 6: Send WhatsApp notifications
    if (whatsappService.isReady()) {
      const articleData: ArticlePublishedData = {
        title: article.title,
        url: result.article!.url,
        targetKeyword: brief.targetKeyword,
        city: brief.regionalFocus.primaryCity,
        wordCount: article.wordCount,
        qualityScore: article.qualityScore.overall,
      }

      await whatsappService.notifyArticlePublished(articleData)
      result.whatsappSent = true
      console.log('[DailyPublisher] WhatsApp notifications sent')
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
      console.log('Running daily content publisher...')
      const result = await runDailyPublisher()
      console.log('Result:', JSON.stringify(result, null, 2))
      process.exit(result.success ? 0 : 1)

    case 'report':
      console.log('Sending daily SEO report...')
      await sendDailySEOReport()
      process.exit(0)

    case 'both':
      console.log('Running publisher and sending report...')
      const publishResult = await runDailyPublisher()
      await sendDailySEOReport()
      process.exit(publishResult.success ? 0 : 1)

    default:
      console.log('Usage: npx ts-node daily-content-publisher.ts [publish|report|both]')
      process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
}
