import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Las Vegas Nevada Skincare | Desert Skin Solutions',
  description: 'Expert skincare for Las Vegas\' extreme desert climate. Combat dehydration, sun damage, and AC dryness with AI-powered skin analysis.',
  keywords: [
    'Las Vegas skincare',
    'Nevada skincare',
    'desert skincare routine',
    'Vegas dry skin',
    'Henderson skincare',
    'Summerlin skincare',
    'desert climate moisturizer',
    'Nevada skin care',
  ],
  alternates: {
    canonical: 'https://ai.ayonne.skin/skincare-las-vegas-nevada',
  },
  openGraph: {
    title: 'Las Vegas Nevada Skincare Guide | Ayonne',
    description: 'Expert skincare solutions for Las Vegas\' extreme desert climate. Free AI skin analysis.',
    url: 'https://ai.ayonne.skin/skincare-las-vegas-nevada',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Las Vegas Nevada Skincare Guide',
  description: 'Expert skincare solutions for Las Vegas\' extreme desert climate',
  url: 'https://ai.ayonne.skin/skincare-las-vegas-nevada',
  mainEntity: {
    '@type': 'Article',
    headline: 'Hydration Essentials for Las Vegas Living',
    author: {
      '@type': 'Organization',
      name: 'Ayonne Skincare',
    },
  },
  areaServed: {
    '@type': 'City',
    name: 'Las Vegas',
    containedInPlace: {
      '@type': 'State',
      name: 'Nevada',
    },
  },
}

const vegasSkinConcerns = [
  {
    concern: 'Extreme Dehydration',
    description: 'Las Vegas humidity often drops below 10% in summer. This is drier than the Sahara Desert. Your skin loses moisture at an alarming rate.',
    solution: 'Intensive hydration protocol: hyaluronic acid serum, hydrating toner, rich moisturizer, facial oil as final seal.',
    product: 'hyaluronic-acid-serum',
  },
  {
    concern: 'Intense Sun Damage',
    description: 'With 294 sunny days and extreme UV index (often 10+), Las Vegas accelerates photoaging. Unprotected skin ages visibly faster here.',
    solution: 'SPF 50+ daily, rain or shine. Reapply every 2 hours. Vitamin C provides antioxidant backup against UV damage.',
    product: 'vitamin-c-lotion',
  },
  {
    concern: 'AC-Induced Dryness',
    description: 'Escaping 115°F heat means living in air conditioning. AC removes humidity from air, creating a second assault on your skin barrier.',
    solution: 'Portable humidifier. Face mists throughout the day. Night cream to repair barrier damage from daily AC exposure.',
    product: 'embrace-collagen-moisturizer',
  },
  {
    concern: 'Premature Fine Lines',
    description: 'The combination of dehydration, UV exposure, and low humidity accelerates the appearance of fine lines, even in your 20s and 30s.',
    solution: 'Retinol at night (start low, go slow). Peptides support collagen. Consistent hydration plumps and reduces line visibility.',
    product: 'collagen-and-retinol-serum',
  },
]

const vegasLifestyleChallenges = [
  {
    challenge: 'Casino & Hotel Life',
    problem: 'Recirculated air, 24/7 AC, lack of windows',
    solution: 'Keep a hydrating mist in your bag. Apply moisture mask after long sessions indoors.',
  },
  {
    challenge: 'Pool Days',
    problem: 'Chlorine + sun + dry air triple threat',
    solution: 'Rinse immediately after swimming. Apply hydrating serum before SPF reapplication.',
  },
  {
    challenge: 'Late Nights',
    problem: 'Sleep deprivation + alcohol = dehydrated skin',
    solution: 'Double cleanse after nights out. Sleep with a heavy night cream. Drink extra water.',
  },
  {
    challenge: 'Outdoor Activities',
    problem: 'Golf, hiking, festivals in extreme heat',
    solution: 'SPF 50+ every 90 minutes. Electrolyte supplements. Cooling face mist.',
  },
]

const vegasSeasons = [
  {
    season: 'Summer (May-Sept)',
    temp: '95-115°F',
    humidity: '5-15%',
    concerns: ['Extreme dehydration', 'Severe sun damage', 'AC skin'],
    tips: 'Maximum hydration protocol. Avoid outdoor exposure 10am-4pm. Sleep with humidifier.',
  },
  {
    season: 'Fall (Oct-Nov)',
    temp: '65-85°F',
    humidity: '15-25%',
    concerns: ['Temperature swings', 'Continuing dryness', 'Repair time'],
    tips: 'Best time for skin repair. Start retinol if desired. Build back barrier.',
  },
  {
    season: 'Winter (Dec-Feb)',
    temp: '45-60°F',
    humidity: '20-35%',
    concerns: ['Cold nights, dry days', 'Indoor heating', 'Chapped lips'],
    tips: 'Most comfortable season. Don\'t skip SPF - UV still high. Focus on repair.',
  },
  {
    season: 'Spring (Mar-Apr)',
    temp: '65-90°F',
    humidity: '15-25%',
    concerns: ['Increasing UV', 'Wind events', 'Temperature jumps'],
    tips: 'Transition products. Increase SPF vigilance. Dust storms require thorough cleansing.',
  },
]

export default function LasVegasSkincareGuidePage() {
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
              Extreme Desert Skincare
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-[#1C4444] mb-6 leading-tight">
              Hydration Essentials for{' '}
              <span className="relative">
                <span className="relative z-10">Las Vegas Living</span>
                <span className="absolute bottom-2 left-0 right-0 h-3 bg-[#D4AF37]/20 -z-0" />
              </span>
            </h1>
            <p className="text-xl text-[#1C4444]/70 mb-8 max-w-2xl mx-auto">
              Vegas humidity can drop below 10% - drier than the Sahara. Our AI-powered
              analysis identifies your specific dehydration patterns and recommends
              products engineered for extreme desert conditions.
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
                <p className="text-3xl font-light text-[#1C4444]">10%</p>
                <p className="text-sm text-[#1C4444]/60">Summer Humidity</p>
              </div>
              <div>
                <p className="text-3xl font-light text-[#1C4444]">115°F</p>
                <p className="text-sm text-[#1C4444]/60">Peak Summer Temps</p>
              </div>
              <div>
                <p className="text-3xl font-light text-[#1C4444]">294</p>
                <p className="text-sm text-[#1C4444]/60">Sunny Days/Year</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Desert Skin Concerns */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-light text-[#1C4444] mb-4">
              Las Vegas Desert Skin Challenges
            </h2>
            <p className="text-[#1C4444]/60 max-w-2xl mx-auto">
              Understanding the extreme conditions your skin faces every day
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {vegasSkinConcerns.map((item, index) => (
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

      {/* Vegas Lifestyle Section */}
      <section className="py-16 md:py-20 bg-[#1C4444]">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
              Vegas Lifestyle Skincare Guide
            </h2>
            <p className="text-white/70 max-w-2xl mx-auto">
              Special challenges for living and playing in Las Vegas
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {vegasLifestyleChallenges.map((item, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <h3 className="text-lg font-medium text-white mb-2">{item.challenge}</h3>
                <p className="text-white/50 text-xs uppercase tracking-wide mb-2">The Problem</p>
                <p className="text-white/70 text-sm mb-4">{item.problem}</p>
                <p className="text-[#D4AF37] text-xs uppercase tracking-wide mb-2">The Fix</p>
                <p className="text-white/80 text-sm">{item.solution}</p>
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
              Las Vegas Seasonal Skincare
            </h2>
            <p className="text-[#1C4444]/60 max-w-2xl mx-auto">
              Adjust your routine for Vegas&apos;s extreme seasonal variations
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {vegasSeasons.map((season, index) => (
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
      <section className="py-16 md:py-24 bg-gradient-to-br from-[#D4AF37]/10 to-white">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-light text-[#1C4444] mb-6">
            Get Your Personalized Vegas Skincare Routine
          </h2>
          <p className="text-[#1C4444]/70 mb-8 max-w-xl mx-auto">
            Our AI analyzes your unique skin and recommends products specifically
            formulated to survive and thrive in Las Vegas&apos;s extreme desert climate.
          </p>
          <Link
            href="/skin-analysis"
            className="inline-flex items-center gap-2 bg-[#1C4444] text-white px-10 py-5 rounded-xl font-medium hover:bg-[#1C4444]/90 transition-all shadow-luxury-lg"
          >
            Start Free Skin Analysis
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
          <p className="text-[#1C4444]/50 text-sm mt-4">
            Free • No app download • Instant results
          </p>
        </div>
      </section>

      {/* Local Areas */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-light text-[#1C4444] mb-4">
              Serving the Las Vegas Valley
            </h2>
            <p className="text-[#1C4444]/60">
              Skincare solutions for all Vegas communities
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
            {['Henderson', 'Summerlin', 'North Las Vegas', 'Paradise', 'Spring Valley', 'Enterprise', 'Whitney', 'Green Valley', 'Anthem', 'Boulder City'].map((city) => (
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
