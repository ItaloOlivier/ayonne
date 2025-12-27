import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import ProductCard from '@/components/product/ProductCard'
import { Product } from '@/types'

async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const products = await prisma.product.findMany({
      where: { featured: true, inStock: true },
      take: 8,
      orderBy: { createdAt: 'desc' },
    })
    return products.map(p => ({
      ...p,
      price: Number(p.price),
      salePrice: p.salePrice ? Number(p.salePrice) : null,
    }))
  } catch (error) {
    console.error('Error fetching featured products:', error)
    return []
  }
}

async function getCollections() {
  try {
    const collections = await prisma.collection.findMany({
      take: 4,
    })
    return collections
  } catch (error) {
    console.error('Error fetching collections:', error)
    return []
  }
}

export default async function HomePage() {
  const [featuredProducts, collections] = await Promise.all([
    getFeaturedProducts(),
    getCollections(),
  ])

  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-[#F4EBE7] py-16 md:py-24 lg:py-32">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-normal text-[#1C4444] mb-6 leading-tight">
              Science-Backed Skincare for Timeless Beauty
            </h1>
            <p className="text-lg md:text-xl text-[#1C4444]/70 mb-8 max-w-2xl mx-auto">
              Transform your skincare routine with Ayonne anti-aging serums, designed to turn back time without compromising your values.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/collections/anti-aging-serums"
                className="btn-primary text-center"
              >
                Shop Anti-Aging
              </Link>
              <Link
                href="/collections/all"
                className="btn-secondary text-center"
              >
                View All Products
              </Link>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="container mx-auto px-4 lg:px-8 mt-12">
          <div className="flex flex-wrap justify-center gap-8 md:gap-12 text-[#1C4444]/70 text-sm">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
              </svg>
              <span>Cruelty-Free</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
              <span>Vegan</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
              </svg>
              <span>Paraben-Free</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              <span>Made in North America</span>
            </div>
          </div>
        </div>
      </section>

      {/* Collections Section */}
      {collections.length > 0 && (
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-normal text-[#1C4444] text-center mb-12">
              Shop by Collection
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {collections.map((collection) => (
                <Link
                  key={collection.id}
                  href={`/collections/${collection.slug}`}
                  className="group relative aspect-square bg-white rounded-lg overflow-hidden"
                >
                  <div className="absolute inset-0 bg-[#1C4444]/10 group-hover:bg-[#1C4444]/20 transition-colors" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[#1C4444] text-center font-medium px-4">
                      {collection.name}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products Section */}
      {featuredProducts.length > 0 && (
        <section className="py-16 md:py-20 bg-white">
          <div className="container mx-auto px-4 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-normal text-[#1C4444] text-center mb-12">
              Featured Products
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div className="text-center mt-12">
              <Link href="/collections/all" className="btn-secondary">
                View All Products
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* AI Skin Analysis CTA */}
      <section className="py-16 md:py-20 bg-[#1C4444]">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="text-white">
                <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-sm mb-4">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  AI-Powered
                </div>
                <h2 className="text-3xl md:text-4xl font-normal mb-4">
                  Discover Your Skin&apos;s Future
                </h2>
                <p className="text-white/80 mb-6">
                  Upload a selfie and our AI will analyze your skin type, detect concerns, and show you what you might look like in 20 years. Get personalized product recommendations based on your unique skin needs.
                </p>
                <ul className="space-y-2 text-white/70 mb-8">
                  <li className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Skin type & condition analysis
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Face aging simulation (+20 years)
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Personalized product recommendations
                  </li>
                </ul>
                <Link
                  href="/skin-analysis"
                  className="inline-flex items-center gap-2 bg-white text-[#1C4444] px-6 py-3 rounded-lg font-medium hover:bg-white/90 transition-colors"
                >
                  Try Free Skin Analysis
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
              <div className="relative hidden md:block">
                <div className="aspect-square bg-white/10 rounded-2xl flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/20 flex items-center justify-center">
                      <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                    </div>
                    <p className="text-white/80 text-lg">
                      See your future self
                    </p>
                    <p className="text-white/50 text-sm mt-2">
                      Upload a photo to begin
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-normal text-[#1C4444] mb-6">
              Biohacking Beauty
            </h2>
            <p className="text-lg text-[#1C4444]/70 mb-6 leading-relaxed">
              At Ayonne, we believe beauty is not just skin deep—it&apos;s a holistic journey to feeling and looking your best. Our skincare line is inspired by Bryan Johnson&apos;s Blue Project Protocol, combining cutting-edge science with nature&apos;s most powerful ingredients.
            </p>
            <p className="text-lg text-[#1C4444]/70 mb-8 leading-relaxed">
              Every product is formulated to restore vitality and encourage sustainable, long-term beauty results. We&apos;re committed to cruelty-free, vegan, and paraben-free formulations that deliver real results.
            </p>
            <Link href="/pages/about" className="btn-secondary">
              Learn More About Us
            </Link>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-16 md:py-20 bg-[#1C4444] text-white">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-normal text-center mb-4">
            Let customers speak for us
          </h2>
          <p className="text-center text-white/70 mb-12">
            470 reviews
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
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
                <div className="flex gap-1 mb-4">
                  {[...Array(review.rating)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                </div>
                <p className="text-white/90 mb-4 italic">&quot;{review.text}&quot;</p>
                <p className="text-white font-medium">{review.author}</p>
                <p className="text-white/60 text-sm">{review.product}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
