import { NextResponse } from 'next/server'
import {
  getAllProductsSEO,
  getProductSEO,
  updateProductSEO,
  getAllPagesSEO,
  analyzeSEOQuality,
  generateOptimizedTitle,
  generateOptimizedDescription,
  generateLLMSProductCatalog,
  isShopifyConfigured,
} from '@/lib/shopify-admin'

// Simple admin key check
function isAdminRequest(request: Request): boolean {
  const adminKey = request.headers.get('x-admin-key')
  const expectedKey = process.env.ADMIN_API_KEY
  return !!expectedKey && adminKey === expectedKey
}

/**
 * GET: Get SEO data and analysis for all products
 * Query params:
 * - type: 'products' | 'pages' | 'audit' | 'catalog' (default: 'audit')
 * - handle: specific product handle (optional)
 */
export async function GET(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isShopifyConfigured()) {
    return NextResponse.json({
      error: 'Shopify not configured',
      message: 'Set SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_API_TOKEN environment variables',
    }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'audit'
  const handle = searchParams.get('handle')

  try {
    // Get specific product SEO
    if (handle) {
      const product = await getProductSEO(handle)
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }
      const analysis = analyzeSEOQuality(product)
      return NextResponse.json({
        success: true,
        product,
        analysis,
      })
    }

    // Get all products SEO
    if (type === 'products') {
      const products = await getAllProductsSEO(100)
      return NextResponse.json({
        success: true,
        count: products.length,
        products,
      })
    }

    // Get all pages SEO
    if (type === 'pages') {
      const pages = await getAllPagesSEO()
      return NextResponse.json({
        success: true,
        count: pages.length,
        pages,
      })
    }

    // Generate LLMS catalog
    if (type === 'catalog') {
      const catalog = await generateLLMSProductCatalog()
      return new Response(catalog, {
        headers: { 'Content-Type': 'text/plain' },
      })
    }

    // Full SEO audit (default)
    const products = await getAllProductsSEO(100)
    const pages = await getAllPagesSEO()

    const productAudits = products.map(product => ({
      id: product.id,
      handle: product.handle,
      title: product.title,
      currentSEO: product.seo,
      ...analyzeSEOQuality(product),
    }))

    // Calculate summary stats
    const avgScore = productAudits.reduce((sum, p) => sum + p.score, 0) / productAudits.length
    const criticalIssues = productAudits.filter(p => p.score < 50).length
    const needsWork = productAudits.filter(p => p.score >= 50 && p.score < 80).length
    const good = productAudits.filter(p => p.score >= 80).length

    return NextResponse.json({
      success: true,
      summary: {
        totalProducts: products.length,
        totalPages: pages.length,
        averageScore: Math.round(avgScore),
        criticalIssues,
        needsWork,
        good,
      },
      products: productAudits.sort((a, b) => a.score - b.score), // Worst first
      pages,
    })
  } catch (error) {
    console.error('SEO API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch SEO data' },
      { status: 500 }
    )
  }
}

/**
 * POST: Update product SEO or bulk optimize
 * Body:
 * - action: 'update' | 'optimize' | 'bulk-optimize'
 * - productId: product ID (for update)
 * - handle: product handle (for optimize)
 * - title: new SEO title (for update)
 * - description: new SEO description (for update)
 */
export async function POST(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isShopifyConfigured()) {
    return NextResponse.json({
      error: 'Shopify not configured',
      message: 'Set SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_API_TOKEN with write_products scope',
    }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { action, productId, handle, title, description, category, benefits, skinConcerns } = body

    // Direct update
    if (action === 'update') {
      if (!productId || !title || !description) {
        return NextResponse.json({
          error: 'Missing required fields: productId, title, description',
        }, { status: 400 })
      }

      const result = await updateProductSEO(productId, { title, description })
      return NextResponse.json(result)
    }

    // Auto-optimize single product
    if (action === 'optimize') {
      if (!handle) {
        return NextResponse.json({ error: 'Missing handle' }, { status: 400 })
      }

      const product = await getProductSEO(handle)
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }

      // Generate optimized SEO
      const optimizedTitle = generateOptimizedTitle(product.title, category)
      const optimizedDescription = generateOptimizedDescription(
        product.title,
        benefits || [],
        skinConcerns || []
      )

      const result = await updateProductSEO(product.id, {
        title: optimizedTitle,
        description: optimizedDescription,
      })

      return NextResponse.json({
        ...result,
        optimized: {
          title: optimizedTitle,
          description: optimizedDescription,
        },
      })
    }

    // Bulk optimize (preview only - no changes)
    if (action === 'bulk-optimize') {
      const products = await getAllProductsSEO(100)
      const optimizations = products.map(product => {
        const analysis = analyzeSEOQuality(product)
        return {
          handle: product.handle,
          title: product.title,
          currentScore: analysis.score,
          issues: analysis.issues,
          suggestedTitle: generateOptimizedTitle(product.title),
          suggestedDescription: generateOptimizedDescription(product.title, [], []),
        }
      }).filter(p => p.currentScore < 80) // Only products that need work

      return NextResponse.json({
        success: true,
        message: 'Preview of optimizations (no changes made)',
        count: optimizations.length,
        optimizations,
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('SEO update error:', error)
    return NextResponse.json(
      { error: 'Failed to update SEO' },
      { status: 500 }
    )
  }
}
