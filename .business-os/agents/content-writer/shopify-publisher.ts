/**
 * Shopify Blog Publisher
 *
 * Integrates the Content Writer Agent with Shopify's Admin API
 * for publishing articles to the Ayonne blog.
 */

import type { GeneratedArticle, ArticleBrief } from './types'

// ============================================================================
// TYPES
// ============================================================================

interface ShopifyArticleNode {
  id: string
  title: string
  handle: string
  publishedAt?: string
  createdAt: string
  updatedAt: string
  tags?: string[]
  author?: { name: string }
}

interface UserError {
  field: string[]
  message: string
}

interface ArticleCreateResponse {
  articleCreate?: {
    article?: ShopifyArticleNode
    userErrors?: UserError[]
  }
}

interface ArticleUpdateResponse {
  articleUpdate?: {
    article?: ShopifyArticleNode
    userErrors?: UserError[]
  }
}

interface BlogArticlesResponse {
  blog?: {
    articles?: {
      nodes?: ShopifyArticleNode[]
    }
  }
}

interface PublishResult {
  success: boolean
  articleId?: string
  handle?: string
  url?: string
  error?: string
}

interface ShopifyBlogConfig {
  blogId: string
  storeDomain: string
  adminApiToken: string
  apiVersion: string
}

// ============================================================================
// SHOPIFY PUBLISHER CLASS
// ============================================================================

export class ShopifyPublisher {
  private config: ShopifyBlogConfig | null = null
  private initialized: boolean = false

  constructor() {
    // Initialize from environment if available
    this.tryAutoInitialize()
  }

  /**
   * Try to auto-initialize from environment variables
   */
  private tryAutoInitialize(): void {
    const domain = process.env.SHOPIFY_STORE_DOMAIN
    const token = process.env.SHOPIFY_ADMIN_API_TOKEN

    if (domain && token) {
      this.config = {
        blogId: 'gid://shopify/Blog/108098158940', // Ayonne's blog ID
        storeDomain: domain,
        adminApiToken: token,
        apiVersion: '2024-01',
      }
      this.initialized = true
    }
  }

  /**
   * Initialize with custom configuration
   */
  initialize(config: ShopifyBlogConfig): void {
    this.config = config
    this.initialized = true
  }

  /**
   * Check if publisher is ready
   */
  isReady(): boolean {
    return this.initialized && !!this.config
  }

  /**
   * Publish an article to Shopify
   */
  async publishArticle(
    article: GeneratedArticle,
    brief: ArticleBrief
  ): Promise<PublishResult> {
    if (!this.isReady() || !this.config) {
      return {
        success: false,
        error: 'Publisher not initialized. Set SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_API_TOKEN.',
      }
    }

    try {
      const mutation = `
        mutation articleCreate($article: ArticleCreateInput!) {
          articleCreate(article: $article) {
            article {
              id
              handle
              title
              publishedAt
            }
            userErrors {
              field
              message
            }
          }
        }
      `

      const variables = {
        article: {
          blogId: this.config.blogId,
          title: article.title,
          handle: article.slug,
          body: article.content,
          author: {
            name: 'Ayonne Skincare',
          },
          tags: this.generateTags(brief),
          // Note: SEO fields are set via metafields in newer Shopify API versions
          // The title and meta description will be inherited from the article title/content
          // Publish immediately - articles go live automatically
          isPublished: true,
        },
      }

      const response = await this.executeGraphQL<ArticleCreateResponse>(mutation, variables)

      if (response.data?.articleCreate?.userErrors && response.data.articleCreate.userErrors.length > 0) {
        return {
          success: false,
          error: response.data.articleCreate.userErrors
            .map((e) => e.message)
            .join(', '),
        }
      }

      const createdArticle = response.data?.articleCreate?.article
      if (createdArticle) {
        return {
          success: true,
          articleId: createdArticle.id,
          handle: createdArticle.handle,
          url: `https://ayonne.skin/blogs/news/${createdArticle.handle}`,
        }
      }

      return {
        success: false,
        error: 'Unknown error creating article',
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Update an existing article
   */
  async updateArticle(
    shopifyArticleId: string,
    updates: Partial<GeneratedArticle>
  ): Promise<PublishResult> {
    if (!this.isReady() || !this.config) {
      return {
        success: false,
        error: 'Publisher not initialized',
      }
    }

    try {
      const mutation = `
        mutation articleUpdate($id: ID!, $article: ArticleUpdateInput!) {
          articleUpdate(id: $id, article: $article) {
            article {
              id
              handle
              title
              updatedAt
            }
            userErrors {
              field
              message
            }
          }
        }
      `

      const articleInput: Record<string, unknown> = {}

      if (updates.title) {
        articleInput.title = updates.title
      }
      if (updates.content) {
        articleInput.body = updates.content
      }
      if (updates.seoMeta) {
        articleInput.seo = {
          title: updates.seoMeta.title,
          description: updates.seoMeta.description,
        }
      }

      const variables = {
        id: shopifyArticleId,
        article: articleInput,
      }

      const response = await this.executeGraphQL<ArticleUpdateResponse>(mutation, variables)

      if (response.data?.articleUpdate?.userErrors && response.data.articleUpdate.userErrors.length > 0) {
        return {
          success: false,
          error: response.data.articleUpdate.userErrors
            .map((e) => e.message)
            .join(', '),
        }
      }

      const updatedArticle = response.data?.articleUpdate?.article
      if (updatedArticle) {
        return {
          success: true,
          articleId: updatedArticle.id,
          handle: updatedArticle.handle,
          url: `https://ayonne.skin/blogs/news/${updatedArticle.handle}`,
        }
      }

      return {
        success: false,
        error: 'Unknown error updating article',
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Publish a draft article (make it live)
   */
  async publishDraft(shopifyArticleId: string): Promise<PublishResult> {
    if (!this.isReady() || !this.config) {
      return {
        success: false,
        error: 'Publisher not initialized',
      }
    }

    try {
      const mutation = `
        mutation articleUpdate($id: ID!, $article: ArticleUpdateInput!) {
          articleUpdate(id: $id, article: $article) {
            article {
              id
              handle
              publishedAt
            }
            userErrors {
              field
              message
            }
          }
        }
      `

      const variables = {
        id: shopifyArticleId,
        article: {
          isPublished: true,
        },
      }

      const response = await this.executeGraphQL<ArticleUpdateResponse>(mutation, variables)

      if (response.data?.articleUpdate?.userErrors && response.data.articleUpdate.userErrors.length > 0) {
        return {
          success: false,
          error: response.data.articleUpdate.userErrors
            .map((e) => e.message)
            .join(', '),
        }
      }

      const article = response.data?.articleUpdate?.article
      if (article) {
        return {
          success: true,
          articleId: article.id,
          handle: article.handle,
          url: `https://ayonne.skin/blogs/news/${article.handle}`,
        }
      }

      return {
        success: false,
        error: 'Unknown error publishing article',
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Check if an article with similar slug/handle already exists
   */
  async checkForDuplicate(
    slug: string
  ): Promise<{ exists: boolean; existingArticle?: ShopifyArticleNode; error?: string }> {
    if (!this.isReady() || !this.config) {
      return { exists: false, error: 'Publisher not initialized' }
    }

    try {
      // Get recent articles and check for similar slugs
      const result = await this.listArticles(100)

      if (!result.success || !result.articles) {
        return { exists: false }
      }

      // Check for exact match or similar slugs
      const normalizedSlug = slug.toLowerCase().replace(/[^a-z0-9]/g, '')

      for (const article of result.articles) {
        const existingSlug = (article.handle || '').toLowerCase().replace(/[^a-z0-9]/g, '')

        // Exact match
        if (existingSlug === normalizedSlug) {
          return { exists: true, existingArticle: article }
        }

        // Check for high similarity (same base topic)
        // e.g., "skincare-denver-colorado" vs "skincare-denver-colorado-2024"
        if (normalizedSlug.includes(existingSlug) || existingSlug.includes(normalizedSlug)) {
          // Only flag if the overlap is significant (>70% of characters)
          const shorter = Math.min(normalizedSlug.length, existingSlug.length)
          const longer = Math.max(normalizedSlug.length, existingSlug.length)
          if (shorter / longer > 0.7) {
            return { exists: true, existingArticle: article }
          }
        }
      }

      return { exists: false }
    } catch (error) {
      return {
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * List all articles in the blog
   */
  async listArticles(
    limit: number = 100
  ): Promise<{ success: boolean; articles?: ShopifyArticleNode[]; error?: string }> {
    if (!this.isReady() || !this.config) {
      return {
        success: false,
        error: 'Publisher not initialized',
      }
    }

    try {
      const query = `
        query getArticles($blogId: ID!, $first: Int!) {
          blog(id: $blogId) {
            articles(first: $first) {
              nodes {
                id
                title
                handle
                publishedAt
                createdAt
                updatedAt
                tags
                author {
                  name
                }
              }
            }
          }
        }
      `

      const variables = {
        blogId: this.config.blogId,
        first: limit,
      }

      const response = await this.executeGraphQL<BlogArticlesResponse>(query, variables)

      if (response.data?.blog?.articles?.nodes) {
        return {
          success: true,
          articles: response.data.blog.articles.nodes,
        }
      }

      return {
        success: false,
        error: 'No articles found or blog does not exist',
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Generate tags from article brief
   */
  private generateTags(brief: ArticleBrief): string[] {
    const tags: string[] = [
      'Colorado',
      brief.regionalFocus.primaryCity,
      brief.contentType.replace(/_/g, ' '),
    ]

    // Add climate-related tags
    if (brief.regionalFocus.climateFactors.altitude === 'high' ||
        brief.regionalFocus.climateFactors.altitude === 'very_high') {
      tags.push('high altitude skincare')
    }

    if (brief.regionalFocus.climateFactors.humidity === 'very_low') {
      tags.push('dry climate skincare')
    }

    // Add seasonal tags
    if (brief.slug.includes('winter')) {
      tags.push('winter skincare')
    } else if (brief.slug.includes('summer')) {
      tags.push('summer skincare')
    }

    // Add topic tags
    tags.push(brief.targetKeyword)

    // Remove duplicates using Array.from instead of spread
    return Array.from(new Set(tags))
  }

  /**
   * Execute GraphQL query against Shopify Admin API
   */
  private async executeGraphQL<T>(
    query: string,
    variables: Record<string, unknown>
  ): Promise<{ data?: T; errors?: unknown[] }> {
    if (!this.config) {
      throw new Error('Publisher not configured')
    }

    const url = `https://${this.config.storeDomain}/admin/api/${this.config.apiVersion}/graphql.json`
    console.log(`[ShopifyPublisher] Calling API: ${url}`)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': this.config.adminApiToken,
        },
        body: JSON.stringify({ query, variables }),
      })

      console.log(`[ShopifyPublisher] Response status: ${response.status}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[ShopifyPublisher] API error response: ${errorText}`)
        throw new Error(`Shopify API error: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      if (result.errors) {
        console.error(`[ShopifyPublisher] GraphQL errors:`, JSON.stringify(result.errors))
      }
      return result
    } catch (error) {
      console.error(`[ShopifyPublisher] Fetch error:`, error)
      throw error
    }
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const shopifyPublisher = new ShopifyPublisher()
