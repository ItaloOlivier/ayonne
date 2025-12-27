import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Our Story - The Science of Timeless Beauty | Ayonne',
  description: 'Discover the Ayonne story - where biohacking meets beauty. Our vegan, cruelty-free skincare combines cutting-edge science with nature\'s most powerful ingredients for radiant, youthful skin.',
  alternates: {
    canonical: 'https://ai.ayonne.skin/pages/about',
  },
  openGraph: {
    title: 'Our Story | Ayonne - Biohacking Beauty',
    description: 'Where cutting-edge science meets timeless beauty rituals. 100% vegan, cruelty-free, paraben-free skincare.',
    url: 'https://ai.ayonne.skin/pages/about',
  },
}

export default function AboutPage() {
  return (
    <div className="bg-[#F4EBE7]">
      {/* Hero Section - Immersive Full Screen */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1C4444] via-[#1C4444]/95 to-[#2d5a5a]" />

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#D4AF37]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        {/* Floating Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-2 h-2 bg-[#D4AF37]/30 rounded-full animate-float" />
          <div className="absolute top-40 right-40 w-3 h-3 bg-white/10 rounded-full animate-float-delayed" />
          <div className="absolute bottom-32 left-1/3 w-2 h-2 bg-[#D4AF37]/20 rounded-full animate-float" />
        </div>

        <div className="relative container mx-auto px-4 lg:px-8 text-center z-10">
          <div className="max-w-4xl mx-auto">
            {/* Elegant Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-5 py-2 rounded-full mb-8 animate-fade-in">
              <span className="w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse" />
              <span className="text-white/80 text-sm tracking-widest uppercase">Est. 2024</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-light text-white mb-6 tracking-tight animate-slide-up">
              Our Story
            </h1>

            <p className="text-xl md:text-2xl text-white/70 font-light max-w-2xl mx-auto mb-8 leading-relaxed animate-slide-up-delayed">
              Where cutting-edge science meets the art of timeless beauty
            </p>

            {/* Scroll Indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
              <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2">
                <div className="w-1 h-2 bg-white/50 rounded-full animate-scroll-indicator" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Statement - Editorial Style */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left: Large Quote */}
              <div className="relative">
                <div className="absolute -top-8 -left-4 text-[120px] leading-none text-[#D4AF37]/20 font-serif select-none">
                  &ldquo;
                </div>
                <blockquote className="relative z-10">
                  <p className="text-2xl md:text-3xl lg:text-4xl text-[#1C4444] font-light leading-relaxed">
                    Beauty is not just skin deep—it&apos;s a holistic journey to feeling and looking your absolute best.
                  </p>
                </blockquote>
                <div className="mt-8 flex items-center gap-4">
                  <div className="w-12 h-px bg-[#D4AF37]" />
                  <span className="text-[#1C4444]/60 text-sm tracking-widest uppercase">Our Philosophy</span>
                </div>
              </div>

              {/* Right: Story Text */}
              <div className="space-y-6">
                <p className="text-lg text-[#1C4444]/70 leading-relaxed">
                  At Ayonne, we&apos;re redefining what skincare can be. Inspired by the revolutionary
                  biohacking protocols of Bryan Johnson&apos;s Blueprint, we&apos;ve created a line that
                  harnesses both scientific innovation and nature&apos;s most powerful ingredients.
                </p>
                <p className="text-lg text-[#1C4444]/70 leading-relaxed">
                  Every formula is meticulously crafted to restore vitality, encourage cellular renewal,
                  and deliver sustainable, long-term results you can see and feel.
                </p>
                <div className="pt-4">
                  <Link
                    href="/skin-analysis"
                    className="inline-flex items-center gap-3 text-[#1C4444] font-medium group"
                  >
                    <span className="border-b-2 border-[#D4AF37] pb-1 group-hover:border-[#1C4444] transition-colors">
                      Discover Your Skin Type
                    </span>
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section - Premium Cards */}
      <section className="py-20 md:py-32 bg-white relative overflow-hidden">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231C4444' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />

        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <span className="text-[#D4AF37] text-sm tracking-widest uppercase mb-4 block">What We Stand For</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl text-[#1C4444] font-light">Our Core Values</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* Value Card 1 */}
            <div className="group relative bg-gradient-to-b from-[#F4EBE7] to-white p-8 rounded-2xl border border-[#1C4444]/5 hover:border-[#D4AF37]/30 transition-all duration-500 hover:shadow-luxury">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/5 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-[#1C4444] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-xl text-[#1C4444] font-medium mb-3">Cruelty-Free</h3>
                <p className="text-[#1C4444]/60 text-sm leading-relaxed">
                  We never test on animals. Our commitment to ethical beauty is unwavering and non-negotiable.
                </p>
              </div>
            </div>

            {/* Value Card 2 */}
            <div className="group relative bg-gradient-to-b from-[#F4EBE7] to-white p-8 rounded-2xl border border-[#1C4444]/5 hover:border-[#D4AF37]/30 transition-all duration-500 hover:shadow-luxury">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/5 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-[#1C4444] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                  </svg>
                </div>
                <h3 className="text-xl text-[#1C4444] font-medium mb-3">100% Vegan</h3>
                <p className="text-[#1C4444]/60 text-sm leading-relaxed">
                  Every ingredient is plant-based. No animal-derived components, ever. Pure botanical power.
                </p>
              </div>
            </div>

            {/* Value Card 3 */}
            <div className="group relative bg-gradient-to-b from-[#F4EBE7] to-white p-8 rounded-2xl border border-[#1C4444]/5 hover:border-[#D4AF37]/30 transition-all duration-500 hover:shadow-luxury">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/5 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-[#1C4444] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                  </svg>
                </div>
                <h3 className="text-xl text-[#1C4444] font-medium mb-3">Clean Formula</h3>
                <p className="text-[#1C4444]/60 text-sm leading-relaxed">
                  No parabens, sulfates, or harmful additives. Just pure, effective ingredients your skin loves.
                </p>
              </div>
            </div>

            {/* Value Card 4 */}
            <div className="group relative bg-gradient-to-b from-[#F4EBE7] to-white p-8 rounded-2xl border border-[#1C4444]/5 hover:border-[#D4AF37]/30 transition-all duration-500 hover:shadow-luxury">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/5 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-[#1C4444] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                </div>
                <h3 className="text-xl text-[#1C4444] font-medium mb-3">Made in NA</h3>
                <p className="text-[#1C4444]/60 text-sm leading-relaxed">
                  Proudly formulated and manufactured in North America with the highest quality standards.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Science Section - Split Layout */}
      <section className="py-20 md:py-32 relative">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left: Content */}
              <div>
                <span className="text-[#D4AF37] text-sm tracking-widest uppercase mb-4 block">The Science</span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl text-[#1C4444] font-light mb-8">
                  Clinically-Proven<br />
                  <span className="text-[#D4AF37]">Ingredients</span>
                </h2>
                <p className="text-lg text-[#1C4444]/70 leading-relaxed mb-8">
                  Every Ayonne formula is backed by peer-reviewed research and contains
                  the most effective concentrations of active ingredients proven to transform skin.
                </p>

                {/* Ingredient Pills */}
                <div className="flex flex-wrap gap-3">
                  {[
                    { name: 'Hyaluronic Acid', desc: 'Deep hydration' },
                    { name: 'Retinol', desc: 'Cell renewal' },
                    { name: 'Vitamin C', desc: 'Brightening' },
                    { name: 'Peptides', desc: 'Firming' },
                    { name: 'Niacinamide', desc: 'Pore refining' },
                    { name: 'Glycolic Acid', desc: 'Exfoliation' },
                  ].map((ingredient) => (
                    <div
                      key={ingredient.name}
                      className="group relative bg-white px-5 py-3 rounded-full border border-[#1C4444]/10 hover:border-[#D4AF37] hover:shadow-md transition-all cursor-default"
                    >
                      <span className="text-[#1C4444] font-medium text-sm">{ingredient.name}</span>
                      <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-[#1C4444] text-white text-xs px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {ingredient.desc}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Visual Stats */}
              <div className="relative">
                <div className="bg-white rounded-3xl p-10 shadow-luxury-lg border border-[#1C4444]/5">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="text-center p-6 bg-[#F4EBE7]/50 rounded-2xl">
                      <div className="text-5xl font-light text-[#1C4444] mb-2">98%</div>
                      <p className="text-[#1C4444]/60 text-sm">Natural Origin Ingredients</p>
                    </div>
                    <div className="text-center p-6 bg-[#F4EBE7]/50 rounded-2xl">
                      <div className="text-5xl font-light text-[#1C4444] mb-2">50+</div>
                      <p className="text-[#1C4444]/60 text-sm">Clinical Studies Referenced</p>
                    </div>
                    <div className="text-center p-6 bg-[#F4EBE7]/50 rounded-2xl">
                      <div className="text-5xl font-light text-[#1C4444] mb-2">0</div>
                      <p className="text-[#1C4444]/60 text-sm">Harmful Chemicals</p>
                    </div>
                    <div className="text-center p-6 bg-[#F4EBE7]/50 rounded-2xl">
                      <div className="text-5xl font-light text-[#1C4444] mb-2">100%</div>
                      <p className="text-[#1C4444]/60 text-sm">Satisfaction Guaranteed</p>
                    </div>
                  </div>

                  {/* Decorative */}
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-[#D4AF37]/10 rounded-full blur-2xl" />
                  <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-[#1C4444]/5 rounded-full blur-2xl" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Feature Highlight */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-white to-[#F4EBE7]">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-[#1C4444]/5 px-5 py-2 rounded-full mb-8">
              <svg className="w-5 h-5 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
              <span className="text-[#1C4444] text-sm font-medium">AI-Powered Skincare</span>
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl text-[#1C4444] font-light mb-6">
              Personalized for Your Skin
            </h2>
            <p className="text-lg text-[#1C4444]/70 max-w-2xl mx-auto mb-10">
              Our advanced AI skin analyzer examines your unique skin characteristics to recommend
              the perfect products for your specific needs. No more guessing—just results.
            </p>

            <Link
              href="/skin-analysis"
              className="inline-flex items-center gap-3 bg-[#1C4444] text-white px-8 py-4 rounded-full font-medium hover:bg-[#1C4444]/90 transition-all hover:shadow-luxury-lg hover:-translate-y-0.5 group"
            >
              Try Free Skin Analysis
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA - Premium */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-[#1C4444]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1C4444] via-[#1C4444]/95 to-[#2d5a5a]" />

        {/* Decorative */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#D4AF37]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />

        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl text-white font-light mb-6">
              Begin Your Transformation
            </h2>
            <p className="text-xl text-white/70 mb-10 max-w-xl mx-auto">
              Join thousands who have discovered the power of science-backed skincare tailored to their unique needs.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/skin-analysis"
                className="inline-flex items-center gap-3 bg-white text-[#1C4444] px-8 py-4 rounded-full font-medium hover:bg-[#F4EBE7] transition-all hover:shadow-luxury-lg"
              >
                Get Your Free Analysis
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="https://ayonne.skin"
                className="inline-flex items-center gap-2 text-white/80 hover:text-white px-6 py-4 transition-colors"
              >
                <span>Shop All Products</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
