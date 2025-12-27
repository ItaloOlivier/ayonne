import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Shipping Information',
  description: 'Ayonne shipping policy: Free shipping on orders over $50 in the US. International shipping available. Learn about delivery times, tracking, and shipping costs.',
  alternates: {
    canonical: 'https://ai.ayonne.skin/pages/shipping',
  },
  openGraph: {
    title: 'Shipping Information | Ayonne Skincare',
    description: 'Free shipping on orders over $50. Fast delivery from North America.',
    url: 'https://ai.ayonne.skin/pages/shipping',
  },
}

export default function ShippingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
