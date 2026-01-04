/**
 * Blog Admin API
 *
 * GET - List blogs and articles
 * POST - Create new article
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  listBlogs,
  listArticles,
  createArticle,
  getOrCreateBlog,
  type CreateArticleInput,
} from '@/lib/shopify-admin/blog'

const ADMIN_API_KEY = process.env.ADMIN_API_KEY

function validateAdminKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-admin-key')
  return apiKey === ADMIN_API_KEY
}

/**
 * GET /api/admin/blog
 * List all blogs and their articles
 */
export async function GET(request: NextRequest) {
  if (!validateAdminKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get all blogs
    const blogs = await listBlogs()

    if (blogs.length === 0) {
      return NextResponse.json({
        success: true,
        blogs: [],
        message: 'No blogs found. Create a blog in Shopify Admin first.',
      })
    }

    // Get articles for each blog
    const blogsWithArticles = await Promise.all(
      blogs.map(async (blog) => {
        const articles = await listArticles(blog.id, 50)
        return {
          ...blog,
          articleCount: articles.length,
          articles: articles.map((a) => ({
            id: a.id,
            title: a.title,
            handle: a.handle,
            publishedAt: a.publishedAt,
            tags: a.tags,
            author: a.author.name,
            summary: a.summary,
          })),
        }
      })
    )

    return NextResponse.json({
      success: true,
      blogs: blogsWithArticles,
      totalArticles: blogsWithArticles.reduce((sum, b) => sum + b.articleCount, 0),
    })
  } catch (error) {
    console.error('Blog API error:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/blog
 * Create a new blog article
 *
 * Body:
 * {
 *   title: string
 *   bodyHtml: string
 *   summary?: string
 *   author?: string
 *   tags?: string[]
 *   publish?: boolean (if true, publishes immediately)
 *   blogHandle?: string (defaults to first blog)
 *   seo?: { title?: string, description?: string }
 *   imageUrl?: string
 * }
 */
export async function POST(request: NextRequest) {
  if (!validateAdminKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()

    const {
      title,
      bodyHtml,
      summary,
      author = 'Ayonne Team',
      tags = [],
      publish = false,
      blogHandle,
      seo,
      imageUrl,
    } = body

    if (!title || !bodyHtml) {
      return NextResponse.json(
        { success: false, error: 'title and bodyHtml are required' },
        { status: 400 }
      )
    }

    // Get the target blog
    const blog = await getOrCreateBlog(blogHandle)

    if (!blog) {
      return NextResponse.json(
        {
          success: false,
          error: 'No blog found. Please create a blog in Shopify Admin first.',
        },
        { status: 404 }
      )
    }

    // Build article input
    const articleInput: CreateArticleInput = {
      blogId: blog.id,
      title,
      bodyHtml,
      author,
    }

    if (summary) {
      articleInput.summary = summary
    }

    if (tags.length > 0) {
      articleInput.tags = tags
    }

    if (publish) {
      articleInput.publishedAt = new Date().toISOString()
    }

    if (seo) {
      articleInput.seo = seo
    }

    if (imageUrl) {
      articleInput.image = {
        src: imageUrl,
        altText: title,
      }
    }

    // Create the article
    const result = await createArticle(articleInput)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          userErrors: result.userErrors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      article: result.article,
      blogUrl: `https://ayonne.skin/blogs/${blog.handle}/${result.article?.handle}`,
    })
  } catch (error) {
    console.error('Blog create error:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
