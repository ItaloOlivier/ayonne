/**
 * WhatsApp Notification Service (Wazzup)
 *
 * Sends daily SEO reports and article notifications via WhatsApp using Wazzup API.
 *
 * Recipients:
 * - Owner: +27 79 192 2423
 * - Wim: +27 83 233 4572
 *
 * Environment Variables:
 * - WAZZUP_API_KEY: Your Wazzup API key
 * - WAZZUP_CHANNEL_ID: Your WhatsApp channel ID
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface WazzupConfig {
  apiKey: string
  channelId: string
  baseUrl?: string
}

export interface Recipient {
  name: string
  phone: string // Without + prefix, e.g., "27791922423"
  role: 'owner' | 'team' | 'stakeholder'
  notifications: NotificationType[]
}

export type NotificationType =
  | 'daily_seo_report'
  | 'article_published'
  | 'content_gap_alert'
  | 'performance_alert'
  | 'weekly_summary'

export interface SendResult {
  success: boolean
  messageId?: string
  error?: string
}

// Ayonne recipients
export const AYONNE_RECIPIENTS: Recipient[] = [
  {
    name: 'Owner',
    phone: '27791922423',
    role: 'owner',
    notifications: ['daily_seo_report', 'article_published', 'weekly_summary', 'performance_alert'],
  },
  {
    name: 'Wim',
    phone: '27832334572',
    role: 'team',
    notifications: ['daily_seo_report', 'article_published', 'weekly_summary'],
  },
]

// ============================================================================
// MESSAGE TEMPLATES
// ============================================================================

export interface ArticlePublishedData {
  title: string
  url: string
  targetKeyword: string
  city?: string
  wordCount: number
  qualityScore: number
}

export interface DailySEOReportData {
  date: string
  articlesPublished: number
  totalArticles: number
  keywordsCovered: number
  totalKeywords: number
  topPerformingKeyword?: string
  contentGaps: string[]
  upcomingContent: string[]
  recommendations: string[]
}

export interface WeeklySummaryData {
  weekNumber: number
  articlesPublished: number
  totalPageViews?: number
  topArticle?: { title: string; views: number }
  keywordRankings?: { keyword: string; position: number; change: number }[]
  nextWeekPlan: string[]
}

export function formatArticlePublishedMessage(data: ArticlePublishedData): string {
  const qualityEmoji = data.qualityScore >= 80 ? '🌟' : data.qualityScore >= 60 ? '✅' : '⚠️'

  return `📝 *New Article Published*

*${data.title}*

🔗 ${data.url}

📊 Stats:
• Target: ${data.targetKeyword}
${data.city ? `• Region: ${data.city}, Colorado` : ''}
• Words: ${data.wordCount.toLocaleString()}
• Quality: ${data.qualityScore}/100 ${qualityEmoji}

_Ayonne Content Writer Agent_`
}

export function formatDailySEOReportMessage(data: DailySEOReportData): string {
  const progressBar = (current: number, total: number): string => {
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0
    const filled = Math.round(percentage / 10)
    return '█'.repeat(filled) + '░'.repeat(10 - filled) + ` ${percentage}%`
  }

  let message = `📊 *Ayonne Daily SEO Report - ${data.date}*

📝 *Content Progress*
Articles: ${data.articlesPublished}/${data.totalArticles}
${progressBar(data.articlesPublished, data.totalArticles)}

🎯 *Keyword Coverage*
${data.keywordsCovered}/${data.totalKeywords} keywords targeted
${progressBar(data.keywordsCovered, data.totalKeywords)}`

  if (data.topPerformingKeyword) {
    message += `

🏆 *Top Keyword*
"${data.topPerformingKeyword}"`
  }

  if (data.contentGaps.length > 0) {
    message += `

⚠️ *Content Gaps*
${data.contentGaps.slice(0, 3).map((gap) => `• ${gap}`).join('\n')}`
  }

  if (data.upcomingContent.length > 0) {
    message += `

📅 *Tomorrow's Content*
${data.upcomingContent.slice(0, 2).map((content) => `• ${content}`).join('\n')}`
  }

  if (data.recommendations.length > 0) {
    message += `

💡 *Recommendations*
${data.recommendations.slice(0, 2).map((rec) => `• ${rec}`).join('\n')}`
  }

  message += `

_Ayonne SEO Agent Report_`

  return message
}

export function formatWeeklySummaryMessage(data: WeeklySummaryData): string {
  let message = `📈 *Ayonne Weekly Summary - Week ${data.weekNumber}*

📝 *Content Output*
${data.articlesPublished} articles published this week`

  if (data.totalPageViews) {
    message += `
👀 ${data.totalPageViews.toLocaleString()} total page views`
  }

  if (data.topArticle) {
    message += `

🏆 *Top Performer*
"${data.topArticle.title}"
${data.topArticle.views.toLocaleString()} views`
  }

  if (data.keywordRankings && data.keywordRankings.length > 0) {
    message += `

📊 *Keyword Rankings*`
    for (const ranking of data.keywordRankings.slice(0, 3)) {
      const changeEmoji = ranking.change > 0 ? '📈' : ranking.change < 0 ? '📉' : '➡️'
      const changeText = ranking.change !== 0 ? ` (${ranking.change > 0 ? '+' : ''}${ranking.change})` : ''
      message += `\n• "${ranking.keyword}": #${ranking.position}${changeText} ${changeEmoji}`
    }
  }

  if (data.nextWeekPlan.length > 0) {
    message += `

📅 *Next Week Plan*
${data.nextWeekPlan.map((item) => `• ${item}`).join('\n')}`
  }

  message += `

_Ayonne Weekly Report_`

  return message
}

// ============================================================================
// WHATSAPP SERVICE (WAZZUP)
// ============================================================================

export class WhatsAppService {
  private config: WazzupConfig | null = null
  private recipients: Recipient[] = AYONNE_RECIPIENTS
  private initialized: boolean = false

  constructor() {
    this.tryAutoInitialize()
  }

  /**
   * Try to auto-initialize from environment variables
   */
  private tryAutoInitialize(): void {
    const apiKey = process.env.WAZZUP_API_KEY
    const channelId = process.env.WAZZUP_CHANNEL_ID

    if (apiKey && channelId) {
      this.config = {
        apiKey,
        channelId,
        baseUrl: 'https://api.wazzup24.com/v3',
      }
      this.initialized = true
      console.log('[WhatsAppService] Initialized with Wazzup')
    } else {
      console.log('[WhatsAppService] Wazzup not configured - set WAZZUP_API_KEY and WAZZUP_CHANNEL_ID')
    }
  }

  /**
   * Initialize with custom configuration
   */
  initialize(config: WazzupConfig, recipients?: Recipient[]): void {
    this.config = {
      ...config,
      baseUrl: config.baseUrl || 'https://api.wazzup24.com/v3',
    }
    if (recipients) {
      this.recipients = recipients
    }
    this.initialized = true
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.initialized && !!this.config
  }

  /**
   * Get configured recipients
   */
  getRecipients(): Recipient[] {
    return this.recipients
  }

  /**
   * Add a recipient
   */
  addRecipient(recipient: Recipient): void {
    const existing = this.recipients.find((r) => r.phone === recipient.phone)
    if (existing) {
      Object.assign(existing, recipient)
    } else {
      this.recipients.push(recipient)
    }
  }

  /**
   * Send a message to a specific phone number via Wazzup
   */
  async sendMessage(phone: string, message: string): Promise<SendResult> {
    if (!this.isReady() || !this.config) {
      return { success: false, error: 'Wazzup service not configured' }
    }

    // Clean phone number (remove + and spaces)
    const cleanPhone = phone.replace(/[\s+\-()]/g, '')

    try {
      const response = await fetch(`${this.config.baseUrl}/message`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelId: this.config.channelId,
          chatId: cleanPhone,
          chatType: 'whatsapp',
          text: message,
        }),
      })

      const result = await response.json()

      if (response.ok && (result.messageId || result.id)) {
        return { success: true, messageId: result.messageId || result.id }
      }

      return {
        success: false,
        error: result.error || result.message || `HTTP ${response.status}`,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Send to all recipients subscribed to a notification type
   */
  async broadcast(
    notificationType: NotificationType,
    message: string
  ): Promise<{ sent: number; failed: number; errors: string[] }> {
    const eligibleRecipients = this.recipients.filter((r) =>
      r.notifications.includes(notificationType)
    )

    let sent = 0
    let failed = 0
    const errors: string[] = []

    for (const recipient of eligibleRecipients) {
      const result = await this.sendMessage(recipient.phone, message)
      if (result.success) {
        sent++
        console.log(`[WhatsApp] Sent to ${recipient.name} (${recipient.phone})`)
      } else {
        failed++
        errors.push(`${recipient.name}: ${result.error}`)
        console.error(`[WhatsApp] Failed to send to ${recipient.name}: ${result.error}`)
      }
    }

    return { sent, failed, errors }
  }

  /**
   * Send article published notification
   */
  async notifyArticlePublished(data: ArticlePublishedData): Promise<void> {
    const message = formatArticlePublishedMessage(data)
    const result = await this.broadcast('article_published', message)
    console.log(`[WhatsApp] Article notification: ${result.sent} sent, ${result.failed} failed`)
  }

  /**
   * Send daily SEO report
   */
  async sendDailySEOReport(data: DailySEOReportData): Promise<void> {
    const message = formatDailySEOReportMessage(data)
    const result = await this.broadcast('daily_seo_report', message)
    console.log(`[WhatsApp] Daily report: ${result.sent} sent, ${result.failed} failed`)
  }

  /**
   * Send weekly summary
   */
  async sendWeeklySummary(data: WeeklySummaryData): Promise<void> {
    const message = formatWeeklySummaryMessage(data)
    const result = await this.broadcast('weekly_summary', message)
    console.log(`[WhatsApp] Weekly summary: ${result.sent} sent, ${result.failed} failed`)
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const whatsappService = new WhatsAppService()
