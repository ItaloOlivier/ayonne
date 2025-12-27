import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About Us - Biohacking Beauty',
  description: 'Learn about Ayonne skincare - inspired by Bryan Johnson\'s Blue Project Protocol. Our vegan, cruelty-free products combine cutting-edge science with nature\'s most powerful ingredients.',
  alternates: {
    canonical: 'https://ai.ayonne.skin/pages/about',
  },
  openGraph: {
    title: 'About Ayonne | Biohacking Beauty',
    description: 'Where cutting-edge science meets timeless beauty rituals. 100% vegan, cruelty-free, paraben-free skincare.',
    url: 'https://ai.ayonne.skin/pages/about',
  },
}

export default function AboutPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-[#1C4444] text-white py-20">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-normal mb-6">
            Biohacking Beauty
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Where cutting-edge science meets timeless beauty rituals
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl text-[#1C4444] mb-8 text-center">Our Story</h2>
            <div className="prose prose-lg text-[#1C4444]/70 space-y-6">
              <p>
                At Ayonne, we believe beauty is not just skin deep—it&apos;s a holistic journey
                to feeling and looking your best. Our skincare line is inspired by Bryan Johnson&apos;s
                Blue Project Protocol, combining cutting-edge science with nature&apos;s most
                powerful ingredients.
              </p>
              <p>
                Every product is formulated to restore vitality and encourage sustainable,
                long-term beauty results. We&apos;re committed to cruelty-free, vegan, and
                paraben-free formulations that deliver real results.
              </p>
              <p>
                Our mission is simple: to help you achieve radiant, youthful skin through
                science-backed skincare that you can feel good about using.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="text-3xl text-[#1C4444] mb-12 text-center">Our Values</h2>
          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#1C4444]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-8 h-8 text-[#1C4444]"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"
                  />
                </svg>
              </div>
              <h3 className="text-[#1C4444] font-medium mb-2">Cruelty-Free</h3>
              <p className="text-[#1C4444]/70 text-sm">
                We never test on animals and are committed to ethical beauty.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#1C4444]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-8 h-8 text-[#1C4444]"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                  />
                </svg>
              </div>
              <h3 className="text-[#1C4444] font-medium mb-2">Vegan</h3>
              <p className="text-[#1C4444]/70 text-sm">
                All products are 100% vegan with no animal-derived ingredients.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#1C4444]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-8 h-8 text-[#1C4444]"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
                  />
                </svg>
              </div>
              <h3 className="text-[#1C4444] font-medium mb-2">Paraben-Free</h3>
              <p className="text-[#1C4444]/70 text-sm">
                Clean formulas without harmful parabens or toxins.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#1C4444]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-8 h-8 text-[#1C4444]"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                  />
                </svg>
              </div>
              <h3 className="text-[#1C4444] font-medium mb-2">Made in North America</h3>
              <p className="text-[#1C4444]/70 text-sm">
                Proudly formulated and manufactured locally.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Science Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl text-[#1C4444] mb-8">Science-Backed Formulas</h2>
            <p className="text-lg text-[#1C4444]/70 mb-8">
              Our products feature clinically-proven ingredients including:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {[
                'Hyaluronic Acid',
                'Retinol',
                'Vitamin C',
                'Peptide Complexes',
                'Niacinamide',
                'Glycolic Acid',
              ].map((ingredient) => (
                <div
                  key={ingredient}
                  className="bg-white p-4 rounded-lg border border-[#1C4444]/10"
                >
                  <span className="text-[#1C4444] font-medium">{ingredient}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-[#1C4444] text-white">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <h2 className="text-3xl mb-6">Start Your Skincare Journey</h2>
          <p className="text-white/70 mb-8 max-w-xl mx-auto">
            Discover the perfect products for your unique skin needs and begin your transformation today.
          </p>
          <Link
            href="/collections/all"
            className="inline-block bg-white text-[#1C4444] px-8 py-3 hover:bg-white/90 transition-colors"
          >
            Shop Now
          </Link>
        </div>
      </section>
    </div>
  )
}
