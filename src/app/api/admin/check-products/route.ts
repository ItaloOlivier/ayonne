import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Simple endpoint to check if products are seeded
export async function GET() {
  try {
    const totalProducts = await prisma.product.count()
    const activeProducts = await prisma.product.count({
      where: { active: true, inStock: true }
    })
    const featuredProducts = await prisma.product.count({
      where: { active: true, inStock: true, featured: true }
    })

    const sampleProducts = await prisma.product.findMany({
      where: { active: true, inStock: true },
      take: 5,
      select: {
        name: true,
        slug: true,
        category: true,
        collection: true,
      }
    })

    return NextResponse.json({
      status: 'ok',
      counts: {
        total: totalProducts,
        active: activeProducts,
        featured: featuredProducts,
      },
      sampleProducts,
      needsSeeding: totalProducts === 0,
      message: totalProducts === 0
        ? 'No products found. Please run: npx ts-node prisma/seed.ts'
        : `Found ${activeProducts} active products ready for recommendations`
    })
  } catch (error) {
    console.error('Error checking products:', error)
    return NextResponse.json(
      { error: 'Failed to check products', details: String(error) },
      { status: 500 }
    )
  }
}
