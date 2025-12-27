import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import ProductCard from '@/components/product/ProductCard'
import { Product } from '@/types'
import HeroSlideshow from '@/components/home/HeroSlideshow'

async function getProductsByCollection(collectionSlug: string, limit: number = 4): Promise<Product[]> {
  try {
    const products = await prisma.product.findMany({
      where: { collection: collectionSlug, inStock: true },
      take: limit,
      orderBy: { createdAt: 'desc' },
    })
    return products.map(p => ({
      ...p,
      price: Number(p.price),
      salePrice: p.salePrice ? Number(p.salePrice) : null,
    }))
  } catch (error) {
    console.error('Error fetching products:', error)
    return []
  }
}

async function getCollections() {
  try {
    const collections = await prisma.collection.findMany()
    return collections
  } catch (error) {
    console.error('Error fetching collections:', error)
    return []
  }
}

export default async function HomePage() {
  const [
    antiAgingProducts,
    moisturizerProducts,
    cleanserProducts,
    bundleProducts,
    collections
  ] = await Promise.all([
    getProductsByCollection('anti-aging-serums', 4),
    getProductsByCollection('moisturizers', 4),
    getProductsByCollection('cleansers', 4),
    getProductsByCollection('bundles', 4),
    getCollections(),
  ])

  return (
    <>
      {/* Hero Slideshow */}
      <HeroSlideshow />

      {/* Anti-Aging Serums Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-normal text-[#1C4444] mb-2">
              Biohack With Us And Age Smarter
            </h2>
            <Link
              href="/collections/anti-aging-serums"
              className="text-[#1C4444] text-sm hover:underline underline-offset-4"
            >
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {antiAgingProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Moisturizers Section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-normal text-[#1C4444] mb-2">
              Good Hydration Is Half Way To A Win!
            </h2>
            <Link
              href="/collections/moisturizers"
              className="text-[#1C4444] text-sm hover:underline underline-offset-4"
            >
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {moisturizerProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Cleansers Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-normal text-[#1C4444] mb-2">
              Squeaky Clean: Soaps & Cleansers
            </h2>
            <Link
              href="/collections/cleansers"
              className="text-[#1C4444] text-sm hover:underline underline-offset-4"
            >
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {cleanserProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-12 md:py-16 bg-[#1C4444] text-white">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-normal text-center mb-2">
            Let customers speak for us
          </h2>
          <p className="text-center text-white/70 mb-8 text-sm">
            from 470 reviews
          </p>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                rating: 5,
                text: "This rose gold oil is absolutely amazing! My skin has never looked better. The glow is unreal and it absorbs so quickly.",
                author: "Sarah M.",
                product: "Anti-aging Rose Gold Oil"
              },
              {
                rating: 5,
                text: "I've tried so many vitamin C serums and this one is by far the best. My dark spots have faded significantly in just 4 weeks.",
                author: "Jennifer K.",
                product: "Vitamin C Brightening Toner"
              },
              {
                rating: 5,
                text: "The Biohacker's Bundle was worth every penny. My entire skincare routine is now elevated. Highly recommend!",
                author: "Michael R.",
                product: "Biohacker's Bundle"
              }
            ].map((review, index) => (
              <div key={index} className="bg-white/10 p-6 rounded-lg">
                <div className="flex gap-1 mb-3">
                  {[...Array(review.rating)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                </div>
                <p className="text-white/90 mb-3 text-sm leading-relaxed">&quot;{review.text}&quot;</p>
                <p className="text-white font-medium text-sm">{review.author}</p>
                <p className="text-white/60 text-xs">{review.product}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bundles Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-normal text-[#1C4444] mb-2">
              Save with Bundles
            </h2>
            <Link
              href="/collections/bundles"
              className="text-[#1C4444] text-sm hover:underline underline-offset-4"
            >
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {bundleProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
