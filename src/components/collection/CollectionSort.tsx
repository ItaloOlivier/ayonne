'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface CollectionSortProps {
  currentSort: string
}

export default function CollectionSort({ currentSort }: CollectionSortProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', e.target.value)
    params.delete('page')
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort" className="text-sm text-[#1C4444]/70">
        Sort by:
      </label>
      <select
        id="sort"
        value={currentSort}
        onChange={handleSortChange}
        className="bg-transparent border-none text-sm text-[#1C4444] cursor-pointer focus:outline-none"
      >
        <option value="featured">Featured</option>
        <option value="price-asc">Price, low to high</option>
        <option value="price-desc">Price, high to low</option>
        <option value="name-asc">Alphabetically, A-Z</option>
        <option value="name-desc">Alphabetically, Z-A</option>
        <option value="newest">Date, new to old</option>
      </select>
    </div>
  )
}
