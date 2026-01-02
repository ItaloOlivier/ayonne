import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Skincare Guides & Education | Learn Skincare | Ayonne',
  description: 'Free skincare education guides. Learn about ingredients, skin types, routines, and how to build the perfect skincare regimen for your needs.',
  keywords: ['skincare guide', 'skincare education', 'skin type guide', 'ingredient guide', 'skincare routine'],
  alternates: {
    canonical: 'https://ai.ayonne.skin/guides',
  },
  openGraph: {
    title: 'Skincare Guides | Ayonne',
    description: 'Free skincare education to help you achieve your best skin.',
    url: 'https://ai.ayonne.skin/guides',
  },
}

const guides = [
  {
    title: 'Skincare Ingredient Guide',
    description: 'Learn what retinol, vitamin C, hyaluronic acid, niacinamide, and other active ingredients actually do for your skin.',
    href: '/guides/ingredients',
    icon: '🧪',
    topics: ['Retinol', 'Vitamin C', 'Hyaluronic Acid', 'Niacinamide', 'Glycolic Acid', 'Peptides'],
  },
  {
    title: 'Skin Type Guide',
    description: 'Discover your skin type and learn the best products, ingredients, and routines tailored to your needs.',
    href: '/guides/skin-types',
    icon: '✨',
    topics: ['Oily Skin', 'Dry Skin', 'Combination', 'Sensitive', 'Normal', 'Mature/Aging'],
  },
]

const comingSoon = [
  {
    title: 'Building Your Skincare Routine',
    description: 'Step-by-step guide to creating a morning and evening skincare routine.',
    icon: '📝',
  },
  {
    title: 'Ingredient Interactions',
    description: 'What ingredients work together and what to never mix.',
    icon: '⚗️',
  },
  {
    title: 'Seasonal Skincare',
    description: 'How to adjust your routine for summer, winter, and climate changes.',
    icon: '🌡️',
  },
]

export default function GuidesPage() {
  return (
    <main className="min-h-screen bg-[#F4EBE7]">
      {/* Hero Section */}
      <section className="bg-[#1C4444] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-[#D4AF37] text-sm font-medium tracking-wider uppercase mb-4">
            Free Education
          </p>
          <h1 className="text-4xl md:text-5xl font-light mb-6">
            Skincare Guides
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Everything you need to know about skincare, from ingredients to routines, all in one place.
          </p>
        </div>
      </section>

      {/* Main Guides */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-semibold text-[#1C4444] mb-8">Popular Guides</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {guides.map(guide => (
            <Link
              key={guide.href}
              href={guide.href}
              className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow group"
            >
              <span className="text-5xl block mb-4">{guide.icon}</span>
              <h3 className="text-xl font-semibold text-[#1C4444] mb-2 group-hover:text-[#D4AF37] transition-colors">
                {guide.title}
              </h3>
              <p className="text-gray-600 mb-4">{guide.description}</p>
              <div className="flex flex-wrap gap-2">
                {guide.topics.slice(0, 4).map(topic => (
                  <span key={topic} className="px-3 py-1 bg-[#F4EBE7] text-[#1C4444] rounded-full text-xs">
                    {topic}
                  </span>
                ))}
                {guide.topics.length > 4 && (
                  <span className="px-3 py-1 bg-[#F4EBE7] text-[#1C4444] rounded-full text-xs">
                    +{guide.topics.length - 4} more
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Coming Soon */}
      <section className="max-w-4xl mx-auto px-4 py-12 border-t">
        <h2 className="text-2xl font-semibold text-[#1C4444] mb-8">Coming Soon</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {comingSoon.map(guide => (
            <div key={guide.title} className="bg-white/50 rounded-2xl p-6 border-2 border-dashed border-gray-300">
              <span className="text-3xl block mb-3 opacity-50">{guide.icon}</span>
              <h3 className="text-lg font-medium text-gray-500 mb-2">{guide.title}</h3>
              <p className="text-sm text-gray-400">{guide.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#1C4444] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-light mb-4">
            Skip the Reading?
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Our AI analyzes your skin in seconds and tells you exactly what you need—no guesswork required.
          </p>
          <Link
            href="/skin-analysis"
            className="inline-block px-8 py-4 bg-[#D4AF37] text-[#1C4444] font-semibold rounded-full hover:bg-white transition-colors"
          >
            Get Free AI Analysis →
          </Link>
        </div>
      </section>
    </main>
  )
}
