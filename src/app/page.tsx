import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import ProductCard from '@/components/product/ProductCard'
import { Product } from '@/types'
import HeroSlideshow from '@/components/home/HeroSlideshow'
import FeaturedProduct from '@/components/home/FeaturedProduct'
import ReviewsCarousel from '@/components/home/ReviewsCarousel'

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

async function getFeaturedProduct(slug: string): Promise<Product | null> {
  try {
    const product = await prisma.product.findUnique({
      where: { slug },
    })
    if (!product) return null
    return {
      ...product,
      price: Number(product.price),
      salePrice: product.salePrice ? Number(product.salePrice) : null,
    }
  } catch (error) {
    console.error('Error fetching featured product:', error)
    return null
  }
}

export default async function HomePage() {
  const [
    antiAgingProducts,
    moisturizerProducts,
    cleanserProducts,
    ebookProducts,
    bundleProducts,
    featuredRoseGoldOil,
    featuredHydrationSerum,
    featuredSoap,
    featuredBundle,
  ] = await Promise.all([
    getProductsByCollection('anti-aging-serums', 4),
    getProductsByCollection('moisturizers', 4),
    getProductsByCollection('cleansers', 4),
    getProductsByCollection('ebooks', 4),
    getProductsByCollection('bundles', 4),
    getFeaturedProduct('anti-aging-rose-gold-oil'),
    getFeaturedProduct('hydration-serum'),
    getFeaturedProduct('natural-soap-charcoal'),
    getFeaturedProduct('biohackers-bundle'),
  ])

  return (
    <>
      {/* Hero Slideshow */}
      <HeroSlideshow />

      {/* Brand Introduction Text */}
      <section className="py-10 md:py-14">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-lg md:text-xl lg:text-2xl font-normal text-[#1C4444] leading-relaxed">
              Transform your skincare routine with Ayonne anti-aging serums, designed to turn back time without compromising your values. Our cruelty-free formulas are packed with powerful, skin-loving ingredients to rejuvenate your complexion and smooth fine lines. Plus, we ship directly from North America for fast delivery, so glowing skin is just around the corner. It&apos;s time to invest in a serum that&apos;s as kind to animals as it is to your skin—why wait for perfect skin when it&apos;s a serum away?
            </p>
          </div>
        </div>
      </section>

      {/* Anti-Aging Serums Section */}
      <section className="py-9 md:py-11">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-normal text-[#1C4444]">
              Biohack With Us And Age Smarter
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {antiAgingProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              href="/collections/anti-aging-serums"
              className="inline-block px-8 py-3 bg-[#1C4444] text-white text-sm uppercase tracking-wider hover:bg-[#1C4444]/90 transition-colors"
            >
              View all
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Product - Rose Gold Oil */}
      {featuredRoseGoldOil && (
        <FeaturedProduct product={featuredRoseGoldOil} imagePosition="left" />
      )}

      {/* Reviews Carousel */}
      <ReviewsCarousel />

      {/* Moisturizers Section */}
      <section className="py-9 md:py-11">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-normal text-[#1C4444]">
              Good Hydration Is Half Way To A Win!
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {moisturizerProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              href="/collections/moisturizers"
              className="inline-block px-8 py-3 bg-[#1C4444] text-white text-sm uppercase tracking-wider hover:bg-[#1C4444]/90 transition-colors"
            >
              View all
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Product - Hydration Serum */}
      {featuredHydrationSerum && (
        <FeaturedProduct product={featuredHydrationSerum} imagePosition="right" />
      )}

      {/* eBooks Section */}
      <section className="py-9 md:py-11">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-normal text-[#1C4444]">
              Knowledge Is Beauty
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {ebookProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              href="/collections/ebooks"
              className="inline-block px-8 py-3 bg-[#1C4444] text-white text-sm uppercase tracking-wider hover:bg-[#1C4444]/90 transition-colors"
            >
              View all
            </Link>
          </div>
        </div>
      </section>

      {/* Cleansers Section */}
      <section className="py-9 md:py-11">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-normal text-[#1C4444]">
              Squeaky Clean: Soaps & Cleansers
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {cleanserProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              href="/collections/cleansers"
              className="inline-block px-8 py-3 bg-[#1C4444] text-white text-sm uppercase tracking-wider hover:bg-[#1C4444]/90 transition-colors"
            >
              View all
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Product - Natural Soap */}
      {featuredSoap && (
        <FeaturedProduct product={featuredSoap} imagePosition="left" />
      )}

      {/* Bundles Section */}
      <section className="py-9 md:py-11">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-normal text-[#1C4444]">
              Save with Bundles
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {bundleProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              href="/collections/bundles"
              className="inline-block px-8 py-3 bg-[#1C4444] text-white text-sm uppercase tracking-wider hover:bg-[#1C4444]/90 transition-colors"
            >
              View all
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Product - Biohacker's Bundle */}
      {featuredBundle && (
        <FeaturedProduct product={featuredBundle} imagePosition="right" />
      )}

      {/* Trust Badges */}
      <section className="py-12 md:py-16 bg-[#1C4444]">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-3 md:grid-cols-3 gap-8 max-w-3xl mx-auto text-center">
            <div className="text-white">
              <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium uppercase tracking-wider">Cruelty Free</p>
            </div>
            <div className="text-white">
              <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <p className="text-sm font-medium uppercase tracking-wider">Vegan</p>
            </div>
            <div className="text-white">
              <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <p className="text-sm font-medium uppercase tracking-wider">Paraben Free</p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
