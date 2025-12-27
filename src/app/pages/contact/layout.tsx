import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us - Get in Touch',
  description: 'Contact Ayonne skincare support team. We respond within 24-48 hours. Questions about products, orders, shipping, or AI skin analysis? We\'re here to help.',
  alternates: {
    canonical: 'https://ai.ayonne.skin/pages/contact',
  },
  openGraph: {
    title: 'Contact Us | Ayonne Skincare',
    description: 'Get in touch with our support team for product questions, order inquiries, and more.',
    url: 'https://ai.ayonne.skin/pages/contact',
  },
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
