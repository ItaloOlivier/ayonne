import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatPrice } from '@/lib/utils'
import { Product } from '@/types'
import AddToCartButton from '@/components/product/AddToCartButton'
import ProductCard from '@/components/product/ProductCard'
import ProductGallery from '@/components/product/ProductGallery'

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
        {/* Product Details */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Images */}
          <ProductGallery images={product.images} productName={product.name} />

          {/* Info */}
          <div>
            <h1 className="text-2xl md:text-3xl font-normal text-[#1C4444] mb-4">
              {product.name}
            </h1>

            {/* Price */}
            <div className="flex items-center gap-3 mb-6">
              {hasDiscount ? (
                <>
                  <span className="text-[#1C4444]/50 line-through">
                    Regular price {formatPrice(product.price)}
                  </span>
                  <span className="text-[#1C4444]">
                    Sale price {formatPrice(product.salePrice!)}
                  </span>
                </>
              ) : (
                <span className="text-[#1C4444]">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>

            {/* Stock Status */}
            {!product.inStock && (
              <p className="text-[#1C4444]/70 mb-4">Sold out</p>
            )}

            {/* Add to Cart */}
            <AddToCartButton product={product} />

            {/* Product Details Accordion */}
            <div className="mt-8 divide-y divide-[#1C4444]/10">
              {product.description && (
                <details className="group py-4" open>
                  <summary className="flex items-center justify-between cursor-pointer text-[#1C4444] text-sm uppercase tracking-wider">
                    Description
                    <svg
                      className="w-4 h-4 transition-transform group-open:rotate-180"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="mt-4 text-[#1C4444]/70 text-sm leading-relaxed">
                    <p>{product.description}</p>
                  </div>
                </details>
              )}

              {product.benefits && (
                <details className="group py-4">
                  <summary className="flex items-center justify-between cursor-pointer text-[#1C4444] text-sm uppercase tracking-wider">
                    Benefits
                    <svg
                      className="w-4 h-4 transition-transform group-open:rotate-180"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="mt-4 text-[#1C4444]/70 text-sm leading-relaxed">
                    <p>{product.benefits}</p>
                  </div>
                </details>
              )}

              {product.howToUse && (
                <details className="group py-4">
                  <summary className="flex items-center justify-between cursor-pointer text-[#1C4444] text-sm uppercase tracking-wider">
                    How to Use
                    <svg
                      className="w-4 h-4 transition-transform group-open:rotate-180"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="mt-4 text-[#1C4444]/70 text-sm leading-relaxed">
                    <p>{product.howToUse}</p>
                  </div>
                </details>
              )}

              {product.ingredients && (
                <details className="group py-4">
                  <summary className="flex items-center justify-between cursor-pointer text-[#1C4444] text-sm uppercase tracking-wider">
                    Ingredients
                    <svg
                      className="w-4 h-4 transition-transform group-open:rotate-180"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="mt-4 text-[#1C4444]/70 text-sm leading-relaxed">
                    <p>{product.ingredients}</p>
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 md:mt-24">
            <h2 className="text-xl md:text-2xl font-normal text-[#1C4444] text-center mb-8">
              Related products
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
