import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Phoenix Arizona Skincare | Desert Climate Skin Solutions',
  description: 'Expert skincare for Phoenix\'s desert climate. Combat dryness, dehydration, and sun damage with AI-powered skin analysis and products.',
  keywords: [
    'Phoenix skincare',
    'Arizona skincare',
    'desert skincare routine',
    'dry climate moisturizer',
    'Phoenix skin care',
    'Arizona dermatology',
    'desert skin hydration',
    'Scottsdale skincare',
  ],
  alternates: {
    canonical: 'https://ai.ayonne.skin/skincare-phoenix-arizona',
  },
  openGraph: {
    title: 'Phoenix Arizona Skincare Guide | Ayonne',
    description: 'Expert skincare solutions for Phoenix\'s desert climate. Free AI skin analysis.',
    url: 'https://ai.ayonne.skin/skincare-phoenix-arizona',
  },
}

// JSON-LD for local SEO
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Phoenix Arizona Skincare Guide',
  description: 'Expert skincare solutions for Phoenix\'s desert climate',
  url: 'https://ai.ayonne.skin/skincare-phoenix-arizona',
  mainEntity: {
    '@type': 'Article',
    headline: 'Expert Skincare for Phoenix\'s Desert Climate',
    description: 'How to protect and hydrate your skin in Arizona\'s extreme dry heat',
    author: {
      '@type': 'Organization',
      name: 'Ayonne Skincare',
    },
  },
  areaServed: {
    '@type': 'City',
    name: 'Phoenix',
    containedInPlace: {
      '@type': 'State',
      name: 'Arizona',
    },
  },
}

const desertSkinConcerns = [
  {
    concern: 'Severe Dehydration',
    description: 'Phoenix\'s average humidity of 30% strips moisture from skin rapidly. The dry desert air can cause trans-epidermal water loss 3x faster than humid climates.',
    solution: 'Layer humectants (hyaluronic acid) under occlusives to lock in moisture. Our Hyaluronic Acid Serum provides multi-weight hydration.',
    product: 'hyaluronic-acid-serum',
  },
  {
    concern: 'Sun Damage & Premature Aging',
    description: 'With 299 sunny days per year, Phoenix skin is exposed to intense UV radiation. This accelerates collagen breakdown and causes hyperpigmentation.',
    solution: 'Daily SPF 50+ is essential. Vitamin C provides antioxidant protection against free radical damage from UV exposure.',
    product: 'vitamin-c-lotion',
  },
  {
    concern: 'Cracked & Flaky Skin',
    description: 'Desert winds and AC cycling create constant moisture fluctuation, leading to compromised skin barriers and visible flaking.',
    solution: 'Ceramide-rich moisturizers rebuild the skin barrier. Apply immediately after cleansing to lock in hydration.',
    product: 'soothing-moisturizer',
  },
  {
    concern: 'Dullness & Uneven Texture',
    description: 'Dehydrated skin reflects light poorly, causing a dull appearance. Dead skin cell buildup from dryness worsens texture.',
    solution: 'Gentle exfoliation with glycolic acid reveals fresh, radiant skin. Follow with intense hydration.',
    product: 'glycolic-acid-serum',
  },
]

const phoenixSeasons = [
  {
    season: 'Summer (May-Sept)',
    temp: '100-115°F',
    humidity: '15-30%',
    concerns: ['Extreme dehydration', 'Sun damage', 'Heat rash'],
    tips: 'Increase hydration frequency. Use water-based products. Reapply SPF every 2 hours outdoors.',
  },
  {
    season: 'Monsoon (July-Sept)',
    temp: '90-105°F',
    humidity: '40-60%',
    concerns: ['Temporary oiliness', 'Breakouts', 'Humidity fluctuation'],
    tips: 'Switch to lighter moisturizers during monsoon. Don\'t skip hydration - humidity drops rapidly after storms.',
  },
  {
    season: 'Winter (Nov-Feb)',
    temp: '45-70°F',
    humidity: '25-35%',
    concerns: ['Dry, cracked skin', 'Windburn', 'Indoor heating dryness'],
    tips: 'Layer serums under heavier moisturizers. Use a humidifier indoors. Night cream is essential.',
  },
  {
    season: 'Spring (Mar-Apr)',
    temp: '70-95°F',
    humidity: '20-30%',
    concerns: ['Allergies affecting skin', 'Increasing UV', 'Dust storms'],
    tips: 'Transition to lighter formulas. Increase SPF as days get longer. Cleanse thoroughly after dust exposure.',
  },
]

export default function PhoenixSkincareGuidePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-[#F4EBE7] to-white py-16 md:py-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#1C4444]/5 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-[#D4AF37] text-sm tracking-[0.2em] uppercase mb-4">
              Desert Climate Skincare
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-[#1C4444] mb-6 leading-tight">
              Expert Skincare for Phoenix&apos;s{' '}
              <span className="relative">
                <span className="relative z-10">Desert Climate</span>
                <span className="absolute bottom-2 left-0 right-0 h-3 bg-[#D4AF37]/20 -z-0" />
              </span>
            </h1>
            <p className="text-xl text-[#1C4444]/70 mb-8 max-w-2xl mx-auto">
              Phoenix&apos;s extreme heat and low humidity create unique skincare challenges.
              Our AI-powered analysis identifies your specific needs and recommends
              products formulated for desert conditions.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link
                href="/skin-analysis"
                className="inline-flex items-center justify-center gap-2 bg-[#1C4444] text-white px-8 py-4 rounded-xl font-medium hover:bg-[#1C4444]/90 transition-all shadow-luxury hover:shadow-luxury-lg"
              >
                Get Free Skin Analysis
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
              <a
                href="https://ayonne.skin/collections/hydration"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 border-2 border-[#1C4444] text-[#1C4444] px-8 py-4 rounded-xl font-medium hover:bg-[#1C4444] hover:text-white transition-all"
              >
                Shop Hydration Products
              </a>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-8 text-center">
              <div>
                <p className="text-3xl font-light text-[#1C4444]">299</p>
                <p className="text-sm text-[#1C4444]/60">Sunny Days/Year</p>
              </div>
              <div>
                <p className="text-3xl font-light text-[#1C4444]">30%</p>
                <p className="text-sm text-[#1C4444]/60">Avg. Humidity</p>
              </div>
              <div>
                <p className="text-3xl font-light text-[#1C4444]">4.8M</p>
                <p className="text-sm text-[#1C4444]/60">Metro Population</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Desert Skin Concerns Section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-light text-[#1C4444] mb-4">
              Phoenix Desert Skin Concerns
            </h2>
            <p className="text-[#1C4444]/60 max-w-2xl mx-auto">
              Understanding how the desert climate affects your skin is the first step to effective skincare
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {desertSkinConcerns.map((item, index) => (
              <div key={index} className="card-luxury p-8">
                <h3 className="text-xl font-medium text-[#1C4444] mb-3">{item.concern}</h3>
                <p className="text-[#1C4444]/60 text-sm mb-4">{item.description}</p>
                <div className="bg-[#F4EBE7] rounded-lg p-4 mb-4">
                  <p className="text-sm text-[#1C4444]/80">
                    <span className="font-medium text-[#D4AF37]">Solution:</span> {item.solution}
                  </p>
                </div>
                <a
                  href={`https://ayonne.skin/products/${item.product}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#1C4444] text-sm font-medium hover:text-[#D4AF37] transition-colors inline-flex items-center gap-1"
                >
                  View Recommended Product
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Seasonal Guide Section */}
      <section className="py-16 md:py-20 bg-[#F4EBE7]">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-light text-[#1C4444] mb-4">
              Phoenix Seasonal Skincare Guide
            </h2>
            <p className="text-[#1C4444]/60 max-w-2xl mx-auto">
              Adapt your routine to Phoenix&apos;s unique seasonal changes
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {phoenixSeasons.map((season, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-medium text-[#1C4444] mb-2">{season.season}</h3>
                <div className="flex gap-4 mb-4 text-sm text-[#1C4444]/60">
                  <span>{season.temp}</span>
                  <span>•</span>
                  <span>{season.humidity} humidity</span>
                </div>
                <div className="mb-4">
                  <p className="text-xs text-[#D4AF37] uppercase tracking-wide mb-2">Key Concerns</p>
                  <ul className="space-y-1">
                    {season.concerns.map((concern, i) => (
                      <li key={i} className="text-sm text-[#1C4444]/70 flex items-center gap-2">
                        <span className="w-1 h-1 bg-[#1C4444]/30 rounded-full" />
                        {concern}
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="text-sm text-[#1C4444]/60 border-t border-[#1C4444]/10 pt-4">
                  {season.tips}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-[#1C4444]">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-light text-white mb-6">
            Get Your Personalized Phoenix Skincare Routine
          </h2>
          <p className="text-white/70 mb-8 max-w-xl mx-auto">
            Our AI analyzes your unique skin and recommends products specifically
            formulated to combat Phoenix&apos;s desert conditions.
          </p>
          <Link
            href="/skin-analysis"
            className="inline-flex items-center gap-2 bg-white text-[#1C4444] px-10 py-5 rounded-xl font-medium hover:bg-white/95 transition-all shadow-luxury-lg"
          >
            Start Free Skin Analysis
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
          <p className="text-white/50 text-sm mt-4">
            Free • No app download • Instant results
          </p>
        </div>
      </section>

      {/* Local Areas Section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-light text-[#1C4444] mb-4">
              Serving the Greater Phoenix Area
            </h2>
            <p className="text-[#1C4444]/60">
              Skincare solutions for all Phoenix metro communities
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
            {['Scottsdale', 'Mesa', 'Tempe', 'Chandler', 'Gilbert', 'Glendale', 'Peoria', 'Surprise', 'Goodyear', 'Paradise Valley'].map((city) => (
              <span key={city} className="px-4 py-2 bg-[#F4EBE7] text-[#1C4444]/70 rounded-full text-sm">
                {city}
              </span>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
