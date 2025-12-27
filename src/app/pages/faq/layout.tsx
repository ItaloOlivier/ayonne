import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FAQ - Frequently Asked Questions',
  description: 'Find answers to common questions about Ayonne skincare products, AI skin analysis, shipping, returns, ingredients, and more. Get help with your skincare routine.',
  alternates: {
    canonical: 'https://ai.ayonne.skin/pages/faq',
  },
  openGraph: {
    title: 'FAQ | Ayonne Skincare',
    description: 'Common questions about our vegan, cruelty-free skincare products and AI skin analyzer.',
    url: 'https://ai.ayonne.skin/pages/faq',
  },
}

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
