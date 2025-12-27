import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as fs from 'fs'
import * as path from 'path'

// Seed endpoint - requires ADMIN_SECRET environment variable
export async function POST(request: NextRequest) {
  try {
    // Check for admin secret
    const { secret } = await request.json()
    const adminSecret = process.env.ADMIN_SECRET

    if (!adminSecret || secret !== adminSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if already seeded
    const existingProducts = await prisma.product.count()
    if (existingProducts > 0) {
      return NextResponse.json({
        message: `Database already has ${existingProducts} products. Skipping seed.`,
        skipped: true
      })
    }

    // Load seed data
    const seedDataPath = path.join(process.cwd(), 'prisma', 'seed-data.json')

    if (!fs.existsSync(seedDataPath)) {
      return NextResponse.json(
        { error: 'Seed data file not found at prisma/seed-data.json' },
        { status: 500 }
      )
    }

    const seedData = JSON.parse(fs.readFileSync(seedDataPath, 'utf-8'))

    // Create collections
    let collectionsCreated = 0
    for (const collection of seedData.collections) {
      await prisma.collection.upsert({
        where: { slug: collection.slug },
        update: {},
        create: {
          name: collection.name,
          slug: collection.slug,
          description: `Shop our ${collection.name} collection`,
        },
      })
      collectionsCreated++
    }

    // Create products
    let productsCreated = 0
    for (const product of seedData.products) {
      await prisma.product.upsert({
        where: { slug: product.slug },
        update: {},
        create: {
          name: product.name,
          slug: product.slug,
          shopifySlug: product.shopifySlug,
          description: product.description,
          price: product.price,
          salePrice: product.salePrice,
          images: product.images,
          category: product.category,
          collection: product.collection,
          ingredients: product.ingredients,
          benefits: product.benefits,
          howToUse: product.howToUse,
          inStock: product.inStock ?? true,
          featured: product.featured ?? false,
          active: product.active ?? true,
        },
      })
      productsCreated++
    }

    return NextResponse.json({
      success: true,
      collectionsCreated,
      productsCreated,
      message: `Successfully seeded ${collectionsCreated} collections and ${productsCreated} products`
    })
  } catch (error) {
    console.error('Error seeding database:', error)
    return NextResponse.json(
      { error: 'Failed to seed database', details: String(error) },
      { status: 500 }
    )
  }
}
