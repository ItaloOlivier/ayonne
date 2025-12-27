import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatPrice } from '@/lib/utils'
import { Product } from '@/types'
import AddToCartButton from '@/components/product/AddToCartButton'
import ProductCard from '@/components/product/ProductCard'

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getProduct(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
  })

  if (!product) return null

  return {
    ...product,
    price: Number(product.price),
    salePrice: product.salePrice ? Number(product.salePrice) : null,
  }
}

async function getRelatedProducts(collection: string, excludeId: string): Promise<Product[]> {
  const products = await prisma.product.findMany({
    where: {
      collection,
      id: { not: excludeId },
      inStock: true,
    },
    take: 4,
  })

  return products.map(p => ({
    ...p,
    price: Number(p.price),
    salePrice: p.salePrice ? Number(p.salePrice) : null,
  }))
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product) {
    return { title: 'Product Not Found' }
  }

  return {
    title: product.name,
    description: product.description?.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.description?.slice(0, 160),
      images: product.images[0] ? [product.images[0]] : [],
    },
  }
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product) {
    notFound()
  }

  const relatedProducts = await getRelatedProducts(product.collection, product.id)
  const hasDiscount = product.salePrice && product.salePrice < product.price

  return (
    <div className="py-8 md:py-12">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm">
          <ol className="flex items-center gap-2 text-[#1C4444]/70">
            <li>
              <Link href="/" className="hover:text-[#1C4444]">Home</Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/collections/all" className="hover:text-[#1C4444]">Products</Link>
            </li>
            <li>/</li>
            <li className="text-[#1C4444]">{product.name}</li>
          </ol>
        </nav>

        {/* Product Details */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Images */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-white rounded-lg overflow-hidden">
              {product.images[0] ? (
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#1C4444]/30">
                  No image available
                </div>
              )}
              {hasDiscount && (
                <span className="absolute top-4 left-4 bg-[#1C4444] text-white text-sm px-3 py-1 rounded">
                  Sale
                </span>
              )}
              {!product.inStock && (
                <span className="absolute top-4 right-4 bg-[#1C4444]/50 text-white text-sm px-3 py-1 rounded">
                  Sold out
                </span>
              )}
            </div>

            {/* Thumbnail gallery */}
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.slice(0, 4).map((image, index) => (
                  <div
                    key={index}
                    className="relative aspect-square bg-white rounded overflow-hidden cursor-pointer border-2 border-transparent hover:border-[#1C4444]"
                  >
                    <Image
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <h1 className="text-3xl md:text-4xl font-normal text-[#1C4444] mb-4">
              {product.name}
            </h1>

            {/* Price */}
            <div className="flex items-center gap-3 mb-6">
              {hasDiscount ? (
                <>
                  <span className="text-2xl text-[#1C4444] font-medium">
                    {formatPrice(product.salePrice!)}
                  </span>
                  <span className="text-lg text-[#1C4444]/50 line-through">
                    {formatPrice(product.price)}
                  </span>
                </>
              ) : (
                <span className="text-2xl text-[#1C4444] font-medium">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>

            {/* Description */}
            <div className="prose prose-sm max-w-none text-[#1C4444]/70 mb-8">
              <p>{product.description}</p>
            </div>

            {/* Add to Cart */}
            <AddToCartButton product={product} />

            {/* Product Details Accordion */}
            <div className="mt-8 divide-y divide-[#1C4444]/10">
              {product.benefits && (
                <details className="group py-4">
                  <summary className="flex items-center justify-between cursor-pointer text-[#1C4444] font-medium">
                    Benefits
                    <svg
                      className="w-5 h-5 transition-transform group-open:rotate-180"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <p className="mt-4 text-[#1C4444]/70 text-sm">
                    {product.benefits}
                  </p>
                </details>
              )}

              {product.ingredients && (
                <details className="group py-4">
                  <summary className="flex items-center justify-between cursor-pointer text-[#1C4444] font-medium">
                    Ingredients
                    <svg
                      className="w-5 h-5 transition-transform group-open:rotate-180"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <p className="mt-4 text-[#1C4444]/70 text-sm">
                    {product.ingredients}
                  </p>
                </details>
              )}

              {product.howToUse && (
                <details className="group py-4">
                  <summary className="flex items-center justify-between cursor-pointer text-[#1C4444] font-medium">
                    How to Use
                    <svg
                      className="w-5 h-5 transition-transform group-open:rotate-180"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <p className="mt-4 text-[#1C4444]/70 text-sm">
                    {product.howToUse}
                  </p>
                </details>
              )}
            </div>

            {/* Trust badges */}
            <div className="mt-8 flex flex-wrap gap-4 text-[#1C4444]/70 text-sm">
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0" />
                </svg>
                <span>Paraben-Free</span>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 md:mt-24">
            <h2 className="text-2xl md:text-3xl font-normal text-[#1C4444] text-center mb-8">
              You may also like
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
