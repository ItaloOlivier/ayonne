import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Denver Colorado Skincare | High Altitude Skin Solutions',
  description: 'Expert skincare for Denver\'s high altitude climate. Combat altitude dryness, winter cracking, and UV damage with AI-powered skin analysis.',
  keywords: [
    'Denver skincare',
    'Colorado skincare',
    'high altitude skincare',
    'mountain skincare routine',
    'Denver dry skin',
    'Colorado winter skincare',
    'altitude skin dehydration',
    'Boulder skincare',
  ],
  alternates: {
    canonical: 'https://ai.ayonne.skin/skincare-denver-colorado',
  },
  openGraph: {
    title: 'Denver Colorado Skincare Guide | Ayonne',
    description: 'Expert skincare solutions for Denver\'s high altitude climate. Free AI skin analysis.',
    url: 'https://ai.ayonne.skin/skincare-denver-colorado',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Denver Colorado Skincare Guide',
  description: 'Expert skincare solutions for Denver\'s high altitude climate',
  url: 'https://ai.ayonne.skin/skincare-denver-colorado',
  mainEntity: {
    '@type': 'Article',
    headline: 'Skincare Solutions for Denver\'s Dry Mountain Air',
    author: {
      '@type': 'Organization',
      name: 'Ayonne Skincare',
    },
  },
  areaServed: {
    '@type': 'City',
    name: 'Denver',
    containedInPlace: {
      '@type': 'State',
      name: 'Colorado',
    },
  },
}

const altitudeSkinConcerns = [
  {
    concern: 'Altitude Dehydration',
    description: 'At 5,280 feet, Denver\'s thinner air holds 25% less moisture. Your skin loses hydration faster through increased trans-epidermal water loss (TEWL).',
    solution: 'Multi-layer hydration is essential. Start with hyaluronic acid to draw moisture in, seal with a rich moisturizer.',
    product: 'hydration-serum',
  },
  {
    concern: 'Intensified UV Exposure',
    description: 'UV radiation increases 4% for every 1,000 feet elevation. Denver receives 25% more UV than sea level, accelerating photoaging.',
    solution: 'Daily SPF 50+ is non-negotiable. Antioxidant serums provide additional protection against free radical damage.',
    product: 'vitamin-c-lotion',
  },
  {
    concern: 'Winter Cracking & Flaking',
    description: 'Colorado winters bring humidity below 20%. Combined with indoor heating, this creates severe barrier disruption and painful cracking.',
    solution: 'Heavy barrier repair creams with ceramides and squalane. Apply to damp skin immediately after cleansing.',
    product: 'soothing-moisturizer',
  },
  {
    concern: 'Sensitive, Reactive Skin',
    description: 'Rapid weather changes (40°F swings in hours) stress the skin barrier. Wind exposure compounds the damage.',
    solution: 'Gentle, fragrance-free formulas that strengthen rather than irritate. Niacinamide calms inflammation.',
    product: 'niacinamide-vitamin-boost-serum',
  },
]

const denverSeasons = [
  {
    season: 'Winter (Nov-Mar)',
    temp: '15-45°F',
    humidity: '15-25%',
    concerns: ['Severe cracking', 'Painful dryness', 'Windburn'],
    tips: 'Switch to cream cleansers. Layer multiple hydrating products. Use overnight masks 2-3x weekly.',
  },
  {
    season: 'Spring (Apr-May)',
    temp: '45-70°F',
    humidity: '25-35%',
    concerns: ['Unpredictable weather', 'Late snow', 'Increasing UV'],
    tips: 'Maintain winter hydration levels. Increase SPF. Keep a face mist handy for sudden dry spells.',
  },
  {
    season: 'Summer (Jun-Aug)',
    temp: '65-90°F',
    humidity: '30-40%',
    concerns: ['Intense sun at altitude', 'Outdoor activity', 'Sweat + dry air'],
    tips: 'Lightweight hydration. Reapply SPF every 90 minutes outdoors. Cleanse thoroughly after sweating.',
  },
  {
    season: 'Fall (Sep-Oct)',
    temp: '40-70°F',
    humidity: '20-30%',
    concerns: ['Rapid temperature drops', 'Early dryness', 'Wind exposure'],
    tips: 'Transition to richer moisturizers. Start barrier repair before winter hits. Add facial oil.',
  },
]

export default function DenverSkincareGuidePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-[#F4EBE7] to-white py-16 md:py-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#1C4444]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#D4AF37]/5 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-[#D4AF37] text-sm tracking-[0.2em] uppercase mb-4">
              High Altitude Skincare
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-[#1C4444] mb-6 leading-tight">
              Skincare Solutions for Denver&apos;s{' '}
              <span className="relative">
                <span className="relative z-10">Dry Mountain Air</span>
                <span className="absolute bottom-2 left-0 right-0 h-3 bg-[#D4AF37]/20 -z-0" />
              </span>
            </h1>
            <p className="text-xl text-[#1C4444]/70 mb-8 max-w-2xl mx-auto">
              At 5,280 feet, the Mile High City presents unique skincare challenges.
              Our AI analysis identifies how altitude affects your skin and recommends
              products engineered for Colorado conditions.
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
                <p className="text-3xl font-light text-[#1C4444]">5,280</p>
                <p className="text-sm text-[#1C4444]/60">Feet Elevation</p>
              </div>
              <div>
                <p className="text-3xl font-light text-[#1C4444]">+25%</p>
                <p className="text-sm text-[#1C4444]/60">More UV Exposure</p>
              </div>
              <div>
                <p className="text-3xl font-light text-[#1C4444]">300</p>
                <p className="text-sm text-[#1C4444]/60">Sunny Days/Year</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Altitude Skin Concerns */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-light text-[#1C4444] mb-4">
              How Altitude Affects Your Skin
            </h2>
            <p className="text-[#1C4444]/60 max-w-2xl mx-auto">
              Living at elevation creates unique challenges that require targeted solutions
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {altitudeSkinConcerns.map((item, index) => (
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

      {/* Seasonal Guide */}
      <section className="py-16 md:py-20 bg-[#F4EBE7]">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-light text-[#1C4444] mb-4">
              Denver Seasonal Skincare Guide
            </h2>
            <p className="text-[#1C4444]/60 max-w-2xl mx-auto">
              Adapt your routine to Colorado&apos;s dramatic seasonal shifts
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {denverSeasons.map((season, index) => (
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
            Get Your Personalized Denver Skincare Routine
          </h2>
          <p className="text-white/70 mb-8 max-w-xl mx-auto">
            Our AI analyzes your unique skin and recommends products specifically
            formulated to thrive at altitude.
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

      {/* Local Areas */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-light text-[#1C4444] mb-4">
              Serving the Front Range
            </h2>
            <p className="text-[#1C4444]/60">
              Skincare solutions for Colorado communities
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
            {['Boulder', 'Aurora', 'Lakewood', 'Fort Collins', 'Colorado Springs', 'Arvada', 'Westminster', 'Thornton', 'Centennial', 'Highlands Ranch'].map((city) => (
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
