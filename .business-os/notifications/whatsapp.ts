/**
 * WhatsApp Notification Service
 *
 * Sends daily SEO reports and article notifications via WhatsApp.
 * Uses the WhatsApp Business API (or alternative services like Twilio, MessageBird).
 *
 * Recipients:
 * - Wim: +27 83 233 4572
 * - Owner: +27 79 192 2423
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface WhatsAppConfig {
  provider: 'twilio' | 'messagebird' | 'whatsapp_business' | 'ultramsg'
  apiKey: string
  apiSecret?: string
  fromNumber?: string
  instanceId?: string // For UltraMsg
}

export interface Recipient {
  name: string
  phone: string
  role: 'owner' | 'team' | 'stakeholder'
  notifications: NotificationType[]
}

export type NotificationType =
  | 'daily_seo_report'
  | 'article_published'
  | 'content_gap_alert'
  | 'performance_alert'
  | 'weekly_summary'

// Default recipients for Ayonne
export const AYONNE_RECIPIENTS: Recipient[] = [
  {
    name: 'Owner',
    phone: '+27791922423',
    role: 'owner',
    notifications: ['daily_seo_report', 'article_published', 'weekly_summary', 'performance_alert'],
  },
  {
    name: 'Wim',
    phone: '+27832334572',
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

_Published by Ayonne Content Writer Agent_`
}

export function formatDailySEOReportMessage(data: DailySEOReportData): string {
  const progressBar = (current: number, total: number): string => {
    const percentage = Math.round((current / total) * 100)
    const filled = Math.round(percentage / 10)
    return '█'.repeat(filled) + '░'.repeat(10 - filled) + ` ${percentage}%`
  }

  let message = `📊 *Daily SEO Report - ${data.date}*

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
  let message = `📈 *Weekly SEO Summary - Week ${data.weekNumber}*

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
// WHATSAPP SERVICE
// ============================================================================

export class WhatsAppService {
  private config: WhatsAppConfig | null = null
  private recipients: Recipient[] = AYONNE_RECIPIENTS
  private initialized: boolean = false

  constructor() {
    this.tryAutoInitialize()
  }

  /**
   * Try to auto-initialize from environment variables
   */
  private tryAutoInitialize(): void {
    // Try UltraMsg (easiest to set up)
    if (process.env.ULTRAMSG_INSTANCE_ID && process.env.ULTRAMSG_TOKEN) {
      this.config = {
        provider: 'ultramsg',
        instanceId: process.env.ULTRAMSG_INSTANCE_ID,
        apiKey: process.env.ULTRAMSG_TOKEN,
      }
      this.initialized = true
      return
    }

    // Try Twilio
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_NUMBER) {
      this.config = {
        provider: 'twilio',
        apiKey: process.env.TWILIO_ACCOUNT_SID,
        apiSecret: process.env.TWILIO_AUTH_TOKEN,
        fromNumber: process.env.TWILIO_WHATSAPP_NUMBER,
      }
      this.initialized = true
      return
    }

    // Try MessageBird
    if (process.env.MESSAGEBIRD_API_KEY && process.env.MESSAGEBIRD_CHANNEL_ID) {
      this.config = {
        provider: 'messagebird',
        apiKey: process.env.MESSAGEBIRD_API_KEY,
        apiSecret: process.env.MESSAGEBIRD_CHANNEL_ID,
      }
      this.initialized = true
      return
    }

    console.log('[WhatsAppService] No WhatsApp credentials configured')
  }

  /**
   * Initialize with custom configuration
   */
  initialize(config: WhatsAppConfig, recipients?: Recipient[]): void {
    this.config = config
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
    // Check if already exists
    const existing = this.recipients.find((r) => r.phone === recipient.phone)
    if (existing) {
      // Update existing
      Object.assign(existing, recipient)
    } else {
      this.recipients.push(recipient)
    }
  }

  /**
   * Send a message to a specific phone number
   */
  async sendMessage(phone: string, message: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isReady() || !this.config) {
      return { success: false, error: 'WhatsApp service not configured' }
    }

    try {
      switch (this.config.provider) {
        case 'ultramsg':
          return await this.sendViaUltraMsg(phone, message)
        case 'twilio':
          return await this.sendViaTwilio(phone, message)
        case 'messagebird':
          return await this.sendViaMessageBird(phone, message)
        default:
          return { success: false, error: `Unknown provider: ${this.config.provider}` }
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

  // ==========================================================================
  // PROVIDER-SPECIFIC IMPLEMENTATIONS
  // ==========================================================================

  /**
   * Send via UltraMsg (https://ultramsg.com/)
   * Easiest to set up - just scan QR code with your WhatsApp
   */
  private async sendViaUltraMsg(
    phone: string,
    message: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.config?.instanceId || !this.config?.apiKey) {
      return { success: false, error: 'UltraMsg not configured' }
    }

    const url = `https://api.ultramsg.com/${this.config.instanceId}/messages/chat`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        token: this.config.apiKey,
        to: phone,
        body: message,
      }),
    })

    const result = await response.json()

    if (result.sent === 'true' || result.sent === true) {
      return { success: true }
    }

    return { success: false, error: result.message || 'Failed to send' }
  }

  /**
   * Send via Twilio
   */
  private async sendViaTwilio(
    phone: string,
    message: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.config?.apiKey || !this.config?.apiSecret || !this.config?.fromNumber) {
      return { success: false, error: 'Twilio not configured' }
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.config.apiKey}/Messages.json`
    const auth = Buffer.from(`${this.config.apiKey}:${this.config.apiSecret}`).toString('base64')

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${auth}`,
      },
      body: new URLSearchParams({
        To: `whatsapp:${phone}`,
        From: `whatsapp:${this.config.fromNumber}`,
        Body: message,
      }),
    })

    const result = await response.json()

    if (result.sid) {
      return { success: true }
    }

    return { success: false, error: result.message || 'Failed to send' }
  }

  /**
   * Send via MessageBird
   */
  private async sendViaMessageBird(
    phone: string,
    message: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.config?.apiKey || !this.config?.apiSecret) {
      return { success: false, error: 'MessageBird not configured' }
    }

    const url = 'https://conversations.messagebird.com/v1/send'

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `AccessKey ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        to: phone,
        from: this.config.apiSecret, // Channel ID
        type: 'text',
        content: { text: message },
      }),
    })

    const result = await response.json()

    if (result.id) {
      return { success: true }
    }

    return { success: false, error: result.errors?.[0]?.description || 'Failed to send' }
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const whatsappService = new WhatsAppService()
