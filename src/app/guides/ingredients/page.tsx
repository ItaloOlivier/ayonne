import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Skincare Ingredient Guide | What Works & Why | Ayonne',
  description: 'Complete skincare ingredient guide. Learn what retinol, vitamin C, hyaluronic acid, niacinamide, and other active ingredients do for your skin.',
  keywords: ['skincare ingredients', 'retinol benefits', 'vitamin c skincare', 'hyaluronic acid', 'niacinamide', 'active ingredients'],
  alternates: {
    canonical: 'https://ai.ayonne.skin/guides/ingredients',
  },
  openGraph: {
    title: 'Skincare Ingredient Guide | Ayonne',
    description: 'Learn what active ingredients actually do for your skin.',
    url: 'https://ai.ayonne.skin/guides/ingredients',
  },
}

const ingredients = [
  {
    name: 'Retinol',
    slug: 'retinol',
    category: 'Anti-Aging',
    summary: 'Gold standard for anti-aging. Increases cell turnover and stimulates collagen.',
    benefits: ['Reduces fine lines & wrinkles', 'Improves skin texture', 'Fades dark spots', 'Unclogs pores'],
    bestFor: ['Aging skin', 'Uneven texture', 'Acne-prone skin'],
    howToUse: 'Start with 0.25-0.5% 2-3x per week at night. Build up slowly over months.',
    pairsWith: ['Hyaluronic acid', 'Ceramides', 'SPF (morning)'],
    avoidWith: ['Vitamin C (same routine)', 'AHAs/BHAs (same routine)', 'Benzoyl peroxide'],
    products: ['collagen-and-retinol-serum'],
  },
  {
    name: 'Vitamin C',
    slug: 'vitamin-c',
    category: 'Brightening',
    summary: 'Powerful antioxidant that brightens skin and protects against environmental damage.',
    benefits: ['Brightens dull skin', 'Fades hyperpigmentation', 'Boosts collagen', 'Protects against UV damage'],
    bestFor: ['Dull skin', 'Dark spots', 'Sun damage', 'Uneven skin tone'],
    howToUse: 'Apply in morning before sunscreen. Start with 10-15% concentration.',
    pairsWith: ['Vitamin E', 'Ferulic acid', 'Sunscreen'],
    avoidWith: ['Retinol (same routine)', 'Niacinamide (controversial)', 'AHAs/BHAs'],
    products: ['vitamin-c-lotion', 'vitamin-c-toner', 'vitamin-c-cleanser'],
  },
  {
    name: 'Hyaluronic Acid',
    slug: 'hyaluronic-acid',
    category: 'Hydration',
    summary: 'Humectant that holds 1000x its weight in water. Essential for plump, hydrated skin.',
    benefits: ['Intense hydration', 'Plumps fine lines', 'Improves skin elasticity', 'Suitable for all skin types'],
    bestFor: ['Dry skin', 'Dehydrated skin', 'Fine lines', 'All skin types'],
    howToUse: 'Apply to damp skin, follow with moisturizer to seal in hydration.',
    pairsWith: ['Almost everything', 'Vitamin C', 'Retinol', 'Moisturizers'],
    avoidWith: ['Dry climate without occlusive (can draw moisture from skin)'],
    products: ['hyaluronic-acid-serum', 'hyaluronic-moisturizer', 'hydration-serum'],
  },
  {
    name: 'Niacinamide',
    slug: 'niacinamide',
    category: 'Multi-Benefit',
    summary: 'Vitamin B3 derivative that regulates oil, minimizes pores, and strengthens skin barrier.',
    benefits: ['Controls oil production', 'Minimizes pores', 'Fades dark spots', 'Strengthens skin barrier'],
    bestFor: ['Oily skin', 'Large pores', 'Hyperpigmentation', 'Sensitive skin'],
    howToUse: 'Use 2-5% concentration twice daily. Well-tolerated by most.',
    pairsWith: ['Hyaluronic acid', 'Retinol', 'SPF'],
    avoidWith: ['High-concentration vitamin C (may reduce efficacy)'],
    products: ['niacinamide-vitamin-boost-serum'],
  },
  {
    name: 'Glycolic Acid',
    slug: 'glycolic-acid',
    category: 'Exfoliation',
    summary: 'AHA that dissolves dead skin cells for smoother, brighter skin.',
    benefits: ['Exfoliates dead skin', 'Improves texture', 'Reduces fine lines', 'Fades dark spots'],
    bestFor: ['Dull skin', 'Rough texture', 'Hyperpigmentation', 'Aging skin'],
    howToUse: 'Start with 5-7% 2-3x per week. Always use sunscreen.',
    pairsWith: ['Hyaluronic acid', 'Niacinamide'],
    avoidWith: ['Retinol (same routine)', 'Other acids', 'Vitamin C'],
    products: ['glycolic-acid-serum'],
  },
  {
    name: 'Peptides',
    slug: 'peptides',
    category: 'Anti-Aging',
    summary: 'Amino acid chains that signal skin to produce more collagen.',
    benefits: ['Boosts collagen production', 'Firms skin', 'Reduces wrinkles', 'Improves elasticity'],
    bestFor: ['Aging skin', 'Loss of firmness', 'Fine lines', 'Prevention'],
    howToUse: 'Apply twice daily. Works well in serums and moisturizers.',
    pairsWith: ['Almost everything', 'Hyaluronic acid', 'Niacinamide'],
    avoidWith: ['Direct acids (can break down peptides)'],
    products: ['firm-serum', 'active-eye-cream'],
  },
  {
    name: 'Ceramides',
    slug: 'ceramides',
    category: 'Barrier Repair',
    summary: 'Lipids naturally found in skin that strengthen the moisture barrier.',
    benefits: ['Repairs skin barrier', 'Locks in moisture', 'Reduces sensitivity', 'Protects against irritation'],
    bestFor: ['Dry skin', 'Sensitive skin', 'Damaged barrier', 'Eczema-prone'],
    howToUse: 'Use in moisturizers daily. Essential after retinol or acids.',
    pairsWith: ['Everything', 'Hyaluronic acid', 'Retinol', 'Acids'],
    avoidWith: ['Nothing - universally compatible'],
    products: ['soothing-moisturizer', 'embrace-collagen-moisturizer'],
  },
  {
    name: 'Salicylic Acid',
    slug: 'salicylic-acid',
    category: 'Acne Treatment',
    summary: 'BHA that penetrates pores to clear acne and blackheads.',
    benefits: ['Clears clogged pores', 'Reduces acne', 'Removes blackheads', 'Controls oil'],
    bestFor: ['Acne-prone skin', 'Oily skin', 'Blackheads', 'Large pores'],
    howToUse: 'Use 0.5-2% concentration. Start 2-3x per week.',
    pairsWith: ['Niacinamide', 'Hyaluronic acid'],
    avoidWith: ['Other acids (same routine)', 'Retinol (same routine)'],
    products: [],
  },
]

export default function IngredientsGuidePage() {
  const categories = [...new Set(ingredients.map(i => i.category))]

  return (
    <main className="min-h-screen bg-[#F4EBE7]">
      {/* Hero Section */}
      <section className="bg-[#1C4444] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-[#D4AF37] text-sm font-medium tracking-wider uppercase mb-4">
            Skincare Education
          </p>
          <h1 className="text-4xl md:text-5xl font-light mb-6">
            Skincare Ingredient Guide
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Understand what active ingredients do, how to use them, and which ones work together for your best skin.
          </p>
        </div>
      </section>

      {/* Quick Navigation */}
      <section className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <p className="text-sm text-gray-600 mb-3">Jump to category:</p>
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <a
                key={category}
                href={`#${category.toLowerCase().replace(/\s+/g, '-')}`}
                className="px-4 py-2 bg-[#F4EBE7] text-[#1C4444] rounded-full text-sm hover:bg-[#1C4444] hover:text-white transition-colors"
              >
                {category}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Ingredients by Category */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        {categories.map(category => (
          <div key={category} id={category.toLowerCase().replace(/\s+/g, '-')} className="mb-16">
            <h2 className="text-2xl font-semibold text-[#1C4444] mb-8 pb-2 border-b-2 border-[#D4AF37]">
              {category}
            </h2>
            <div className="space-y-8">
              {ingredients.filter(i => i.category === category).map(ingredient => (
                <article key={ingredient.slug} className="bg-white rounded-2xl p-8 shadow-sm">
                  <h3 className="text-2xl font-semibold text-[#1C4444] mb-3">
                    {ingredient.name}
                  </h3>
                  <p className="text-lg text-gray-700 mb-6">
                    {ingredient.summary}
                  </p>

                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="font-medium text-[#1C4444] mb-2">Key Benefits</h4>
                      <ul className="space-y-1">
                        {ingredient.benefits.map(benefit => (
                          <li key={benefit} className="text-gray-600 flex items-start">
                            <span className="text-[#D4AF37] mr-2">✓</span>
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-[#1C4444] mb-2">Best For</h4>
                      <div className="flex flex-wrap gap-2">
                        {ingredient.bestFor.map(skin => (
                          <span key={skin} className="px-3 py-1 bg-[#F4EBE7] text-[#1C4444] rounded-full text-sm">
                            {skin}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#F4EBE7] rounded-xl p-4 mb-6">
                    <h4 className="font-medium text-[#1C4444] mb-2">How to Use</h4>
                    <p className="text-gray-700">{ingredient.howToUse}</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-medium text-green-700 mb-1">Pairs Well With</h4>
                      <p className="text-gray-600">{ingredient.pairsWith.join(', ')}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-red-700 mb-1">Avoid Using With</h4>
                      <p className="text-gray-600">{ingredient.avoidWith.join(', ')}</p>
                    </div>
                  </div>

                  {ingredient.products.length > 0 && (
                    <div className="mt-6 pt-6 border-t">
                      <p className="text-sm text-gray-600 mb-2">Shop products with {ingredient.name}:</p>
                      <div className="flex flex-wrap gap-2">
                        {ingredient.products.map(slug => (
                          <Link
                            key={slug}
                            href={`https://ayonne.skin/products/${slug}`}
                            className="px-4 py-2 bg-[#1C4444] text-white rounded-full text-sm hover:bg-[#D4AF37] transition-colors"
                          >
                            View Product →
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* CTA Section */}
      <section className="bg-[#1C4444] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-light mb-4">
            Not Sure What Your Skin Needs?
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Take our free AI skin analysis to discover which ingredients will work best for your unique skin concerns.
          </p>
          <Link
            href="/skin-analysis"
            className="inline-block px-8 py-4 bg-[#D4AF37] text-[#1C4444] font-semibold rounded-full hover:bg-white transition-colors"
          >
            Get Your Free Skin Analysis →
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
