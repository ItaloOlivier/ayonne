/**
 * Shopify Blog API Integration
 *
 * Manages blog articles via Shopify Admin GraphQL API
 */

import { shopifyGraphQL, isShopifyConfigured } from './client'

// ============================================================================
// TYPES
// ============================================================================

export interface BlogArticle {
  id: string
  title: string
  handle: string
  bodyHtml: string
  summary?: string
  author: {
    name: string
  }
  publishedAt?: string
  tags: string[]
  image?: {
    url: string
    altText?: string
  }
  seo?: {
    title?: string
    description?: string
  }
}

export interface Blog {
  id: string
  title: string
  handle: string
}

export interface CreateArticleInput {
  blogId: string
  title: string
  bodyHtml: string
  summary?: string
  author: string
  tags?: string[]
  publishedAt?: string // ISO date string, or leave empty for draft
  image?: {
    src: string
    altText?: string
  }
  seo?: {
    title?: string
    description?: string
  }
}

export interface ArticleResult {
  success: boolean
  article?: BlogArticle
  error?: string
  userErrors?: Array<{ field: string[]; message: string }>
}

// ============================================================================
// GRAPHQL QUERIES
// ============================================================================

const LIST_BLOGS_QUERY = `
  query ListBlogs($first: Int!) {
    blogs(first: $first) {
      edges {
        node {
          id
          title
          handle
        }
      }
    }
  }
`

const GET_BLOG_QUERY = `
  query GetBlog($handle: String!) {
    blogByHandle(handle: $handle) {
      id
      title
      handle
    }
  }
`

const LIST_ARTICLES_QUERY = `
  query ListArticles($blogId: ID!, $first: Int!) {
    blog(id: $blogId) {
      articles(first: $first, sortKey: PUBLISHED_AT, reverse: true) {
        edges {
          node {
            id
            title
            handle
            bodyHtml
            summary
            author {
              name
            }
            publishedAt
            tags
            image {
              url
              altText
            }
            seo {
              title
              description
            }
          }
        }
      }
    }
  }
`

const CREATE_ARTICLE_MUTATION = `
  mutation ArticleCreate($article: ArticleCreateInput!) {
    articleCreate(article: $article) {
      article {
        id
        title
        handle
        bodyHtml
        summary
        author {
          name
        }
        publishedAt
        tags
        image {
          url
          altText
        }
        seo {
          title
          description
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`

const UPDATE_ARTICLE_MUTATION = `
  mutation ArticleUpdate($id: ID!, $article: ArticleUpdateInput!) {
    articleUpdate(id: $id, article: $article) {
      article {
        id
        title
        handle
        bodyHtml
        summary
        author {
          name
        }
        publishedAt
        tags
        image {
          url
          altText
        }
        seo {
          title
          description
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`

const DELETE_ARTICLE_MUTATION = `
  mutation ArticleDelete($id: ID!) {
    articleDelete(id: $id) {
      deletedArticleId
      userErrors {
        field
        message
      }
    }
  }
`

// ============================================================================
// FUNCTIONS
// ============================================================================

/**
 * List all blogs in the store
 */
export async function listBlogs(): Promise<Blog[]> {
  if (!isShopifyConfigured()) {
    throw new Error('Shopify Admin API not configured')
  }

  const result = await shopifyGraphQL<{
    blogs: { edges: Array<{ node: Blog }> }
  }>(LIST_BLOGS_QUERY, { first: 20 })

  if (result.errors) {
    throw new Error(`Failed to list blogs: ${result.errors[0].message}`)
  }

  return result.data?.blogs.edges.map(e => e.node) || []
}

/**
 * Get a blog by handle
 */
export async function getBlogByHandle(handle: string): Promise<Blog | null> {
  if (!isShopifyConfigured()) {
    throw new Error('Shopify Admin API not configured')
  }

  const result = await shopifyGraphQL<{
    blogByHandle: Blog | null
  }>(GET_BLOG_QUERY, { handle })

  if (result.errors) {
    throw new Error(`Failed to get blog: ${result.errors[0].message}`)
  }

  return result.data?.blogByHandle || null
}

/**
 * List articles in a blog
 */
export async function listArticles(blogId: string, limit: number = 50): Promise<BlogArticle[]> {
  if (!isShopifyConfigured()) {
    throw new Error('Shopify Admin API not configured')
  }

  const result = await shopifyGraphQL<{
    blog: { articles: { edges: Array<{ node: BlogArticle }> } }
  }>(LIST_ARTICLES_QUERY, { blogId, first: limit })

  if (result.errors) {
    throw new Error(`Failed to list articles: ${result.errors[0].message}`)
  }

  return result.data?.blog?.articles.edges.map(e => e.node) || []
}

/**
 * Create a new blog article
 */
export async function createArticle(input: CreateArticleInput): Promise<ArticleResult> {
  if (!isShopifyConfigured()) {
    return { success: false, error: 'Shopify Admin API not configured' }
  }

  const articleInput: Record<string, unknown> = {
    blogId: input.blogId,
    title: input.title,
    bodyHtml: input.bodyHtml,
    author: input.author,
  }

  if (input.summary) {
    articleInput.summary = input.summary
  }

  if (input.tags && input.tags.length > 0) {
    articleInput.tags = input.tags
  }

  if (input.publishedAt) {
    articleInput.publishedAt = input.publishedAt
  }

  if (input.image) {
    articleInput.image = {
      src: input.image.src,
      altText: input.image.altText || input.title,
    }
  }

  if (input.seo) {
    articleInput.seo = input.seo
  }

  try {
    const result = await shopifyGraphQL<{
      articleCreate: {
        article: BlogArticle | null
        userErrors: Array<{ field: string[]; message: string }>
      }
    }>(CREATE_ARTICLE_MUTATION, { article: articleInput })

    if (result.errors) {
      return { success: false, error: result.errors[0].message }
    }

    const { article, userErrors } = result.data!.articleCreate

    if (userErrors && userErrors.length > 0) {
      return { success: false, userErrors }
    }

    return { success: true, article: article! }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

/**
 * Update an existing blog article
 */
export async function updateArticle(
  id: string,
  updates: Partial<Omit<CreateArticleInput, 'blogId'>>
): Promise<ArticleResult> {
  if (!isShopifyConfigured()) {
    return { success: false, error: 'Shopify Admin API not configured' }
  }

  const articleInput: Record<string, unknown> = {}

  if (updates.title) articleInput.title = updates.title
  if (updates.bodyHtml) articleInput.bodyHtml = updates.bodyHtml
  if (updates.summary) articleInput.summary = updates.summary
  if (updates.author) articleInput.author = updates.author
  if (updates.tags) articleInput.tags = updates.tags
  if (updates.publishedAt) articleInput.publishedAt = updates.publishedAt
  if (updates.image) {
    articleInput.image = {
      src: updates.image.src,
      altText: updates.image.altText,
    }
  }
  if (updates.seo) articleInput.seo = updates.seo

  try {
    const result = await shopifyGraphQL<{
      articleUpdate: {
        article: BlogArticle | null
        userErrors: Array<{ field: string[]; message: string }>
      }
    }>(UPDATE_ARTICLE_MUTATION, { id, article: articleInput })

    if (result.errors) {
      return { success: false, error: result.errors[0].message }
    }

    const { article, userErrors } = result.data!.articleUpdate

    if (userErrors && userErrors.length > 0) {
      return { success: false, userErrors }
    }

    return { success: true, article: article! }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

/**
 * Delete a blog article
 */
export async function deleteArticle(id: string): Promise<{ success: boolean; error?: string }> {
  if (!isShopifyConfigured()) {
    return { success: false, error: 'Shopify Admin API not configured' }
  }

  try {
    const result = await shopifyGraphQL<{
      articleDelete: {
        deletedArticleId: string | null
        userErrors: Array<{ field: string[]; message: string }>
      }
    }>(DELETE_ARTICLE_MUTATION, { id })

    if (result.errors) {
      return { success: false, error: result.errors[0].message }
    }

    const { userErrors } = result.data!.articleDelete

    if (userErrors && userErrors.length > 0) {
      return { success: false, error: userErrors[0].message }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

/**
 * Get or create the main blog
 * Returns the blog ID for the "news" blog, creating it if it doesn't exist
 */
export async function getOrCreateBlog(handle: string = 'news'): Promise<Blog | null> {
  // First try to get existing blog
  const existing = await getBlogByHandle(handle)
  if (existing) {
    return existing
  }

  // If not found, list all blogs and return the first one
  const blogs = await listBlogs()
  if (blogs.length > 0) {
    return blogs[0]
  }

  // No blogs exist - user needs to create one in Shopify Admin
  console.warn('No blogs found. Please create a blog in Shopify Admin first.')
  return null
}
