import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Skin Type Guide | Find Your Skin Type | Ayonne',
  description: 'Discover your skin type: oily, dry, combination, sensitive, or normal. Learn the best skincare routine and products for your specific skin type.',
  keywords: ['skin type', 'oily skin', 'dry skin', 'combination skin', 'sensitive skin', 'skin type quiz'],
  alternates: {
    canonical: 'https://ai.ayonne.skin/guides/skin-types',
  },
  openGraph: {
    title: 'Skin Type Guide | Ayonne',
    description: 'Find your skin type and build the perfect skincare routine.',
    url: 'https://ai.ayonne.skin/guides/skin-types',
  },
}

const skinTypes = [
  {
    type: 'Oily Skin',
    slug: 'oily',
    emoji: '💧',
    description: 'Skin that produces excess sebum, leading to shine and enlarged pores.',
    signs: [
      'Shiny appearance, especially in T-zone',
      'Enlarged or visible pores',
      'Prone to blackheads and acne',
      'Makeup tends to slide off',
      'Skin feels greasy within hours of washing',
    ],
    causes: [
      'Genetics (most common)',
      'Hormonal fluctuations',
      'Humidity and heat',
      'Over-washing (stripping skin triggers more oil)',
      'Wrong skincare products',
    ],
    doList: [
      'Use gel or water-based cleansers',
      'Choose "non-comedogenic" products',
      'Use lightweight, oil-free moisturizers',
      'Include niacinamide to control oil',
      'Use salicylic acid for pore care',
      'Blot excess oil during day',
    ],
    dontList: [
      'Skip moisturizer (skin will produce more oil)',
      'Over-wash face (2x daily max)',
      'Use heavy creams or oils',
      'Touch face frequently',
      'Use harsh, stripping products',
    ],
    keyIngredients: ['Niacinamide', 'Salicylic acid', 'Hyaluronic acid', 'Clay', 'Zinc'],
    products: ['niacinamide-vitamin-boost-serum', 'vitamin-c-toner'],
    routine: {
      morning: ['Gentle gel cleanser', 'Niacinamide serum', 'Lightweight moisturizer', 'Oil-free SPF'],
      evening: ['Oil cleanser (for makeup)', 'Gel cleanser', 'Salicylic acid (2-3x/week)', 'Lightweight moisturizer'],
    },
  },
  {
    type: 'Dry Skin',
    slug: 'dry',
    emoji: '🏜️',
    description: 'Skin that lacks natural oils, leading to tightness, flaking, and dullness.',
    signs: [
      'Tight, uncomfortable feeling',
      'Flaking or peeling skin',
      'Rough texture',
      'Fine lines more visible',
      'Dull, lackluster appearance',
      'Possible redness or irritation',
    ],
    causes: [
      'Genetics',
      'Cold, dry climate',
      'Hot showers and baths',
      'Harsh cleansers',
      'Aging (skin produces less oil)',
      'Certain medications',
    ],
    doList: [
      'Use cream or milk cleansers',
      'Apply products to damp skin',
      'Layer hydrating products',
      'Use rich, emollient moisturizers',
      'Include hyaluronic acid',
      'Use a humidifier in dry climates',
    ],
    dontList: [
      'Use hot water on face',
      'Skip moisturizer ever',
      'Over-exfoliate',
      'Use products with alcohol',
      'Use foaming cleansers',
    ],
    keyIngredients: ['Hyaluronic acid', 'Ceramides', 'Squalane', 'Glycerin', 'Shea butter'],
    products: ['hyaluronic-acid-serum', 'hyaluronic-moisturizer', 'soothing-moisturizer'],
    routine: {
      morning: ['Cream cleanser', 'Hyaluronic acid serum', 'Rich moisturizer', 'SPF with moisturizing base'],
      evening: ['Oil cleanser', 'Cream cleanser', 'Hydrating serum', 'Night cream or facial oil'],
    },
  },
  {
    type: 'Combination Skin',
    slug: 'combination',
    emoji: '⚖️',
    description: 'Skin that\'s oily in some areas (usually T-zone) and dry or normal in others.',
    signs: [
      'Oily forehead, nose, and chin',
      'Dry or normal cheeks',
      'Enlarged pores in T-zone only',
      'Different concerns in different areas',
      'Seasonal changes in skin behavior',
    ],
    causes: [
      'Genetics',
      'Hormones',
      'Using wrong products for skin type',
      'Seasonal weather changes',
      'Product buildup in certain areas',
    ],
    doList: [
      'Multi-mask (different masks for different areas)',
      'Use balancing products',
      'Apply richer products only to dry areas',
      'Use lightweight hydration overall',
      'Adjust routine seasonally',
    ],
    dontList: [
      'Use one product type everywhere',
      'Over-treat oily areas',
      'Neglect dry areas',
      'Use very heavy products all over',
    ],
    keyIngredients: ['Niacinamide', 'Hyaluronic acid', 'Green tea', 'Aloe vera'],
    products: ['niacinamide-vitamin-boost-serum', 'hydration-serum'],
    routine: {
      morning: ['Gel cleanser', 'Niacinamide serum', 'Lightweight moisturizer', 'SPF'],
      evening: ['Oil cleanser', 'Gel cleanser', 'Serum for concerns', 'Lightweight moisturizer (richer on cheeks)'],
    },
  },
  {
    type: 'Sensitive Skin',
    slug: 'sensitive',
    emoji: '🌸',
    description: 'Skin that reacts easily to products or environmental factors with redness, stinging, or irritation.',
    signs: [
      'Redness or flushing easily',
      'Stinging or burning from products',
      'Prone to rashes or bumps',
      'Reacts to fragrances',
      'Easily irritated by weather changes',
      'May have rosacea or eczema',
    ],
    causes: [
      'Genetics',
      'Compromised skin barrier',
      'Allergies or sensitivities',
      'Over-exfoliation',
      'Environmental irritants',
      'Certain skin conditions',
    ],
    doList: [
      'Patch test all new products',
      'Use fragrance-free products',
      'Keep routine simple (fewer products)',
      'Focus on barrier repair',
      'Use mineral sunscreen',
      'Introduce one product at a time',
    ],
    dontList: [
      'Use products with fragrance',
      'Try multiple new products at once',
      'Over-exfoliate',
      'Use harsh active ingredients',
      'Skip patch testing',
    ],
    keyIngredients: ['Ceramides', 'Centella asiatica', 'Aloe vera', 'Oat extract', 'Allantoin'],
    products: ['soothing-moisturizer', 'hyaluronic-acid-serum'],
    routine: {
      morning: ['Gentle cream cleanser', 'Soothing serum (optional)', 'Gentle moisturizer', 'Mineral SPF'],
      evening: ['Micellar water or gentle cleanser', 'Soothing serum', 'Barrier-repair moisturizer'],
    },
  },
  {
    type: 'Normal Skin',
    slug: 'normal',
    emoji: '✨',
    description: 'Well-balanced skin that\'s neither too oily nor too dry, with few imperfections.',
    signs: [
      'Balanced oil production',
      'Small, barely visible pores',
      'Few imperfections',
      'No severe sensitivity',
      'Radiant, healthy complexion',
      'Good elasticity',
    ],
    causes: [
      'Genetics (lucky you!)',
      'Consistent skincare routine',
      'Healthy lifestyle',
      'Good hydration',
    ],
    doList: [
      'Maintain current routine',
      'Focus on prevention',
      'Use sunscreen daily',
      'Keep skin hydrated',
      'Add antioxidants for protection',
    ],
    dontList: [
      'Overdo it with products',
      'Fix what isn\'t broken',
      'Skip sunscreen',
      'Neglect basic care',
    ],
    keyIngredients: ['Vitamin C', 'Hyaluronic acid', 'Peptides', 'Antioxidants'],
    products: ['vitamin-c-lotion', 'hydration-serum', 'firm-serum'],
    routine: {
      morning: ['Gentle cleanser', 'Vitamin C serum', 'Light moisturizer', 'SPF'],
      evening: ['Cleanser', 'Treatment serum (retinol, peptides)', 'Night moisturizer'],
    },
  },
  {
    type: 'Mature/Aging Skin',
    slug: 'mature',
    emoji: '🌹',
    description: 'Skin showing signs of aging: fine lines, wrinkles, loss of firmness, and uneven tone.',
    signs: [
      'Fine lines and wrinkles',
      'Loss of firmness and elasticity',
      'Age spots or hyperpigmentation',
      'Drier skin than before',
      'Thinner, more delicate skin',
      'Slower healing',
    ],
    causes: [
      'Natural aging process',
      'Sun damage (photoaging)',
      'Loss of collagen and elastin',
      'Decreased cell turnover',
      'Environmental factors',
      'Lifestyle factors',
    ],
    doList: [
      'Use retinol consistently',
      'Apply SPF religiously',
      'Include antioxidants',
      'Use rich, nourishing products',
      'Add peptides for firmness',
      'Consider professional treatments',
    ],
    dontList: [
      'Skip sunscreen (even now)',
      'Use harsh, drying products',
      'Neglect neck and décolletage',
      'Over-exfoliate delicate skin',
    ],
    keyIngredients: ['Retinol', 'Vitamin C', 'Peptides', 'Hyaluronic acid', 'Niacinamide'],
    products: ['collagen-and-retinol-serum', 'vitamin-c-lotion', 'firm-serum', 'active-eye-cream'],
    routine: {
      morning: ['Gentle cleanser', 'Vitamin C serum', 'Eye cream', 'Rich moisturizer', 'SPF 30+'],
      evening: ['Oil cleanser', 'Gentle cleanser', 'Retinol serum', 'Eye cream', 'Night cream'],
    },
  },
]

export default function SkinTypesGuidePage() {
  return (
    <main className="min-h-screen bg-[#F4EBE7]">
      {/* Hero Section */}
      <section className="bg-[#1C4444] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-[#D4AF37] text-sm font-medium tracking-wider uppercase mb-4">
            Skincare Education
          </p>
          <h1 className="text-4xl md:text-5xl font-light mb-6">
            Complete Skin Type Guide
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Discover your skin type and learn the best products, ingredients, and routines for your unique skin.
          </p>
        </div>
      </section>

      {/* Quick Navigation */}
      <section className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex flex-wrap justify-center gap-2">
            {skinTypes.map(skin => (
              <a
                key={skin.slug}
                href={`#${skin.slug}`}
                className="px-4 py-2 bg-[#F4EBE7] text-[#1C4444] rounded-full text-sm hover:bg-[#1C4444] hover:text-white transition-colors"
              >
                {skin.emoji} {skin.type}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* AI Analysis CTA */}
      <section className="bg-gradient-to-r from-[#1C4444] to-[#2D5A5A] text-white py-8">
        <div className="max-w-4xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-medium">Not Sure About Your Skin Type?</h2>
            <p className="text-white/80">Our AI analyzes your photo and tells you exactly what your skin needs.</p>
          </div>
          <Link
            href="/skin-analysis"
            className="px-6 py-3 bg-[#D4AF37] text-[#1C4444] font-semibold rounded-full hover:bg-white transition-colors whitespace-nowrap"
          >
            Free AI Analysis →
          </Link>
        </div>
      </section>

      {/* Skin Types */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        {skinTypes.map((skin, index) => (
          <article
            key={skin.slug}
            id={skin.slug}
            className={`mb-16 pb-16 ${index < skinTypes.length - 1 ? 'border-b border-gray-200' : ''}`}
          >
            <div className="flex items-center gap-4 mb-6">
              <span className="text-5xl">{skin.emoji}</span>
              <div>
                <h2 className="text-3xl font-semibold text-[#1C4444]">{skin.type}</h2>
                <p className="text-gray-600">{skin.description}</p>
              </div>
            </div>

            {/* Signs & Causes */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6">
                <h3 className="font-semibold text-[#1C4444] mb-4">Signs You Have {skin.type}</h3>
                <ul className="space-y-2">
                  {skin.signs.map(sign => (
                    <li key={sign} className="flex items-start text-gray-600">
                      <span className="text-[#D4AF37] mr-2 mt-1">•</span>
                      {sign}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white rounded-xl p-6">
                <h3 className="font-semibold text-[#1C4444] mb-4">Common Causes</h3>
                <ul className="space-y-2">
                  {skin.causes.map(cause => (
                    <li key={cause} className="flex items-start text-gray-600">
                      <span className="text-[#1C4444] mr-2 mt-1">→</span>
                      {cause}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Do's and Don'ts */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                <h3 className="font-semibold text-green-800 mb-4">✓ Do This</h3>
                <ul className="space-y-2">
                  {skin.doList.map(item => (
                    <li key={item} className="flex items-start text-green-700">
                      <span className="mr-2">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-red-50 rounded-xl p-6 border border-red-200">
                <h3 className="font-semibold text-red-800 mb-4">✗ Avoid This</h3>
                <ul className="space-y-2">
                  {skin.dontList.map(item => (
                    <li key={item} className="flex items-start text-red-700">
                      <span className="mr-2">✗</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Key Ingredients */}
            <div className="bg-[#1C4444] text-white rounded-xl p-6 mb-8">
              <h3 className="font-semibold mb-4">Key Ingredients for {skin.type}</h3>
              <div className="flex flex-wrap gap-3">
                {skin.keyIngredients.map(ingredient => (
                  <Link
                    key={ingredient}
                    href="/guides/ingredients"
                    className="px-4 py-2 bg-white/20 rounded-full text-sm hover:bg-[#D4AF37] hover:text-[#1C4444] transition-colors"
                  >
                    {ingredient}
                  </Link>
                ))}
              </div>
            </div>

            {/* Routine */}
            <div className="bg-white rounded-xl p-6 mb-8">
              <h3 className="font-semibold text-[#1C4444] mb-6">Recommended Routine</h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-medium text-[#D4AF37] mb-3 flex items-center">
                    <span className="mr-2">☀️</span> Morning
                  </h4>
                  <ol className="space-y-2">
                    {skin.routine.morning.map((step, i) => (
                      <li key={step} className="flex items-start text-gray-600">
                        <span className="w-6 h-6 bg-[#F4EBE7] rounded-full flex items-center justify-center text-[#1C4444] text-sm mr-3 flex-shrink-0">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
                <div>
                  <h4 className="font-medium text-[#1C4444] mb-3 flex items-center">
                    <span className="mr-2">🌙</span> Evening
                  </h4>
                  <ol className="space-y-2">
                    {skin.routine.evening.map((step, i) => (
                      <li key={step} className="flex items-start text-gray-600">
                        <span className="w-6 h-6 bg-[#1C4444] rounded-full flex items-center justify-center text-white text-sm mr-3 flex-shrink-0">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>

            {/* Products */}
            {skin.products.length > 0 && (
              <div>
                <h3 className="font-semibold text-[#1C4444] mb-4">Recommended Products</h3>
                <div className="flex flex-wrap gap-3">
                  {skin.products.map(slug => (
                    <Link
                      key={slug}
                      href={`https://ayonne.skin/products/${slug}`}
                      className="px-5 py-2 bg-[#1C4444] text-white rounded-full text-sm hover:bg-[#D4AF37] hover:text-[#1C4444] transition-colors"
                    >
                      Shop {slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} →
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </article>
        ))}
      </section>

      {/* Final CTA */}
      <section className="bg-[#1C4444] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-light mb-4">
            Get Personalized Recommendations
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Our AI doesn&apos;t just identify your skin type—it analyzes your specific concerns and matches you with the perfect products.
          </p>
          <Link
            href="/skin-analysis"
            className="inline-block px-8 py-4 bg-[#D4AF37] text-[#1C4444] font-semibold rounded-full hover:bg-white transition-colors"
          >
            Try Free AI Skin Analysis →
          </Link>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-sm text-gray-500 text-center">
          <em>This content is for informational purposes only and is not intended as medical advice.
          Individual results may vary. Consult a dermatologist for personalized skincare recommendations.</em>
        </p>
      </section>
    </main>
  )
}
