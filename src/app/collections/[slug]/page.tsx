import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ProductCard from '@/components/product/ProductCard'
import { Product } from '@/types'
import CollectionSort from '@/components/collection/CollectionSort'

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ sort?: string; page?: string }>
}

async function getCollection(slug: string) {
  if (slug === 'all') {
    return {
      name: 'All Products',
      slug: 'all',
      description: 'Browse our complete collection of skincare products',
    }
  }

  try {
    const collection = await prisma.collection.findUnique({
      where: { slug },
    })
    return collection
  } catch (error) {
    console.error('Error fetching collection:', error)
    return null
  }
}

async function getProducts(
  collectionSlug: string,
  sort: string = 'featured',
  page: number = 1
): Promise<{ products: Product[]; total: number }> {
  const perPage = 16

  const where = collectionSlug === 'all'
    ? {}
    : { collection: collectionSlug }

  const orderBy = (() => {
    switch (sort) {
      case 'price-asc':
        return { price: 'asc' as const }
      case 'price-desc':
        return { price: 'desc' as const }
      case 'name-asc':
        return { name: 'asc' as const }
      case 'name-desc':
        return { name: 'desc' as const }
      case 'newest':
        return { createdAt: 'desc' as const }
      default:
        return { name: 'asc' as const }
    }
  })()

  try {
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.product.count({ where }),
    ])

    return {
      products: products.map(p => ({
        ...p,
        price: Number(p.price),
        salePrice: p.salePrice ? Number(p.salePrice) : null,
      })),
      total,
    }
  } catch (error) {
    console.error('Error fetching products:', error)
    return { products: [], total: 0 }
  }
}

export async function generateMetadata({ params }: PageProps) {
  try {
    const { slug } = await params
    const collection = await getCollection(slug)

    if (!collection) {
      return { title: 'Collection Not Found' }
    }

    return {
      title: collection.name,
      description: collection.description,
    }
  } catch {
    return { title: 'Collection' }
  }
}

export default async function CollectionPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { sort = 'featured', page = '1' } = await searchParams

  const collection = await getCollection(slug)

  if (!collection) {
    notFound()
  }

  const { products, total } = await getProducts(slug, sort, parseInt(page))
  const totalPages = Math.ceil(total / 16)
  const currentPage = parseInt(page)

  return (
    <div className="py-8 md:py-12">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-normal text-[#1C4444] mb-2">
            {collection.name}
          </h1>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#1C4444]/10">
          <p className="text-[#1C4444]/70 text-sm">
            {total} {total === 1 ? 'product' : 'products'}
          </p>

          <Suspense fallback={<div className="text-sm text-[#1C4444]/70">Sort by: Featured</div>}>
            <CollectionSort currentSort={sort} />
          </Suspense>
        </div>

        {/* Products Grid */}
        {products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-12">
                {currentPage > 1 && (
                  <a
                    href={`?sort=${sort}&page=${currentPage - 1}`}
                    className="px-4 py-2 border border-[#1C4444]/20 text-[#1C4444] hover:bg-[#1C4444] hover:text-white transition-colors text-sm"
                  >
                    Previous
                  </a>
                )}

                {[...Array(totalPages)].map((_, i) => {
                  const pageNum = i + 1
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <a
                        key={pageNum}
                        href={`?sort=${sort}&page=${pageNum}`}
                        className={`px-4 py-2 border transition-colors text-sm ${
                          pageNum === currentPage
                            ? 'bg-[#1C4444] text-white border-[#1C4444]'
                            : 'border-[#1C4444]/20 text-[#1C4444] hover:bg-[#1C4444] hover:text-white'
                        }`}
                      >
                        {pageNum}
                      </a>
                    )
                  }
                  if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                    return <span key={pageNum} className="px-2 py-2 text-[#1C4444]/50">...</span>
                  }
                  return null
                })}

                {currentPage < totalPages && (
                  <a
                    href={`?sort=${sort}&page=${currentPage + 1}`}
                    className="px-4 py-2 border border-[#1C4444]/20 text-[#1C4444] hover:bg-[#1C4444] hover:text-white transition-colors text-sm"
                  >
                    Next
                  </a>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-[#1C4444]/70 mb-4">No products found in this collection.</p>
            <a href="/collections/all" className="btn-primary">
              Browse All Products
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
