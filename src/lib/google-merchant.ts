/**
 * Google Merchant Center TypeScript Client
 *
 * Direct API integration for product feed monitoring.
 * Uses service account authentication via JWT.
 */

import { SignJWT, importPKCS8 } from 'jose'

interface ServiceAccountKey {
  type: string
  project_id: string
  private_key_id: string
  private_key: string
  client_email: string
  client_id: string
  auth_uri: string
  token_uri: string
}

interface ProductIssue {
  productId: string
  offerId: string
  title: string
  issueType: string
  severity: 'critical' | 'error' | 'warning' | 'suggestion'
  description: string
  resolution?: string
  documentationUrl?: string
  applicableCountries?: string[]
}

interface MerchantProduct {
  id: string
  offerId: string
  title: string
  link: string
  price: string
  availability: string
  condition: string
  brand: string
  gtin?: string
  mpn?: string
  imageLink?: string
  description?: string
  productType?: string
  googleProductCategory?: string
  issues: ProductIssue[]
  isPriority: boolean
  priorityReason?: string
}

interface GMCSummary {
  totalProducts: number
  productsWithIssues: number
  disapprovedProducts: number
  priorityProductsTotal: number
  priorityProductsWithIssues: number
  priorityProductsDisapproved: number
  bySeverity: {
    critical: number
    error: number
    warning: number
    suggestion: number
  }
  commonIssues: Record<string, { count: number; severity: string; resolution?: string }>
  issues: ProductIssue[]
  priorityIssues: ProductIssue[]
}

// Priority product handles (high-revenue items)
const PRIORITY_PRODUCT_HANDLES = [
  'vitamin-c-lotion-1',
  'collagen-and-retinol-serum-1',
  'hyaluronic-acid-serum-1',
  'niacinamide-serum',
  'peptide-complex-serum',
  'vitamin-c-serum-1',
  'retinol-serum-1',
]

const HIGH_VALUE_PRICE_THRESHOLD = 50.0

/**
 * Check if GMC integration is configured
 */
export function isGMCConfigured(): boolean {
  return !!(
    process.env.GOOGLE_MERCHANT_ID && process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  )
}

/**
 * Google Merchant Center Client
 */
export class GoogleMerchantClient {
  private merchantId: string
  private serviceAccount: ServiceAccountKey
  private accessToken: string | null = null
  private tokenExpiry: number = 0

  constructor() {
    const merchantId = process.env.GOOGLE_MERCHANT_ID
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY

    if (!merchantId || !serviceAccountKey) {
      throw new Error(
        'GOOGLE_MERCHANT_ID and GOOGLE_SERVICE_ACCOUNT_KEY are required'
      )
    }

    this.merchantId = merchantId

    try {
      this.serviceAccount = JSON.parse(serviceAccountKey)
    } catch {
      throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT_KEY JSON format')
    }
  }

  /**
   * Get OAuth2 access token using service account JWT
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid (with 5 min buffer)
    if (this.accessToken && Date.now() < this.tokenExpiry - 300000) {
      return this.accessToken
    }

    const now = Math.floor(Date.now() / 1000)
    const privateKey = await importPKCS8(
      this.serviceAccount.private_key,
      'RS256'
    )

    const jwt = await new SignJWT({
      scope: 'https://www.googleapis.com/auth/content',
    })
      .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
      .setIssuedAt(now)
      .setExpirationTime(now + 3600)
      .setIssuer(this.serviceAccount.client_email)
      .setSubject(this.serviceAccount.client_email)
      .setAudience('https://oauth2.googleapis.com/token')
      .sign(privateKey)

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    })

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text()
      throw new Error(`Failed to get access token: ${error}`)
    }

    const tokenData = await tokenResponse.json()
    this.accessToken = tokenData.access_token
    this.tokenExpiry = Date.now() + tokenData.expires_in * 1000

    return this.accessToken!
  }

  /**
   * Make authenticated request to Content API
   */
  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown
  ): Promise<T> {
    const token = await this.getAccessToken()
    const url = `https://shoppingcontent.googleapis.com/content/v2.1/${this.merchantId}/${endpoint}`

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`GMC API error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  /**
   * Check if product should be flagged as priority
   */
  private flagPriorityProduct(product: MerchantProduct): void {
    const linkLower = product.link.toLowerCase()

    // Check priority product list
    for (const handle of PRIORITY_PRODUCT_HANDLES) {
      if (linkLower.includes(handle)) {
        product.isPriority = true
        product.priorityReason = 'High-revenue product'
        return
      }
    }

    // Check price threshold
    const priceValue = parseFloat(
      product.price.replace(/[^0-9.]/g, '')
    )
    if (priceValue >= HIGH_VALUE_PRICE_THRESHOLD) {
      product.isPriority = true
      product.priorityReason = `High-value product ($${priceValue.toFixed(2)})`
      return
    }

    // Check featured products
    const titleLower = product.title.toLowerCase()
    if (titleLower.includes('best seller') || titleLower.includes('featured')) {
      product.isPriority = true
      product.priorityReason = 'Featured product'
    }
  }

  /**
   * Get all product statuses with issues
   */
  async getProductStatuses(maxResults = 250): Promise<MerchantProduct[]> {
    const products: MerchantProduct[] = []
    let pageToken: string | undefined

    while (true) {
      const params = new URLSearchParams({ maxResults: String(maxResults) })
      if (pageToken) params.set('pageToken', pageToken)

      const response = await this.request<{
        resources?: Array<{
          productId?: string
          title?: string
          link?: string
          destinationStatuses?: Array<{
            destination?: string
            status?: string
          }>
          itemLevelIssues?: Array<{
            code?: string
            servability?: string
            severity?: string
            description?: string
            detail?: string
            documentation?: string
            applicableCountries?: string[]
            resolution?: string
          }>
        }>
        nextPageToken?: string
      }>('GET', `productstatuses?${params}`)

      for (const item of response.resources || []) {
        const product: MerchantProduct = {
          id: item.productId || '',
          offerId: item.productId?.split(':').pop() || '',
          title: item.title || '',
          link: item.link || '',
          price: '',
          availability: '',
          condition: 'new',
          brand: 'Ayonne',
          issues: [],
          isPriority: false,
        }

        // Process issues
        for (const issue of item.itemLevelIssues || []) {
          product.issues.push({
            productId: product.id,
            offerId: product.offerId,
            title: product.title,
            issueType: issue.servability || 'unaffected',
            severity: (issue.severity as ProductIssue['severity']) || 'warning',
            description: issue.description || '',
            resolution: issue.resolution,
            documentationUrl: issue.documentation,
            applicableCountries: issue.applicableCountries,
          })
        }

        this.flagPriorityProduct(product)
        products.push(product)
      }

      pageToken = response.nextPageToken
      if (!pageToken) break
    }

    return products
  }

  /**
   * Get summary of all product issues
   */
  async getIssuesSummary(): Promise<GMCSummary> {
    const products = await this.getProductStatuses()

    const summary: GMCSummary = {
      totalProducts: products.length,
      productsWithIssues: 0,
      disapprovedProducts: 0,
      priorityProductsTotal: 0,
      priorityProductsWithIssues: 0,
      priorityProductsDisapproved: 0,
      bySeverity: { critical: 0, error: 0, warning: 0, suggestion: 0 },
      commonIssues: {},
      issues: [],
      priorityIssues: [],
    }

    for (const product of products) {
      if (product.isPriority) {
        summary.priorityProductsTotal++
      }

      if (product.issues.length > 0) {
        summary.productsWithIssues++

        if (product.isPriority) {
          summary.priorityProductsWithIssues++
        }

        const isDisapproved = product.issues.some(
          (i) => i.issueType === 'disapproved'
        )
        if (isDisapproved) {
          summary.disapprovedProducts++
          if (product.isPriority) {
            summary.priorityProductsDisapproved++
          }
        }

        for (const issue of product.issues) {
          // Count by severity
          if (issue.severity in summary.bySeverity) {
            summary.bySeverity[issue.severity]++
          }

          // Track common issues
          const issueKey = issue.description.slice(0, 100)
          if (!summary.commonIssues[issueKey]) {
            summary.commonIssues[issueKey] = {
              count: 0,
              severity: issue.severity,
              resolution: issue.resolution,
            }
          }
          summary.commonIssues[issueKey].count++

          // Add to issues list
          summary.issues.push(issue)

          if (product.isPriority) {
            summary.priorityIssues.push(issue)
          }
        }
      }
    }

    // Sort common issues by count and keep top 10
    const sortedIssues = Object.entries(summary.commonIssues)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 10)
    summary.commonIssues = Object.fromEntries(sortedIssues)

    // Sort priority issues by severity
    const severityOrder = { critical: 0, error: 1, warning: 2, suggestion: 3 }
    summary.priorityIssues.sort(
      (a, b) =>
        (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4)
    )

    return summary
  }

  /**
   * Get all disapproved products
   */
  async getDisapprovedProducts(): Promise<ProductIssue[]> {
    const products = await this.getProductStatuses()
    const disapproved: ProductIssue[] = []

    for (const product of products) {
      for (const issue of product.issues) {
        if (issue.issueType === 'disapproved') {
          disapproved.push(issue)
        }
      }
    }

    return disapproved
  }
}

/**
 * Get GMC summary (convenience function)
 */
export async function getGMCSummary(): Promise<GMCSummary | null> {
  if (!isGMCConfigured()) {
    return null
  }

  try {
    const client = new GoogleMerchantClient()
    return await client.getIssuesSummary()
  } catch (error) {
    console.error('Failed to get GMC summary:', error)
    return null
  }
}
