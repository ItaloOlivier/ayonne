import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Refund Policy | Ayonne',
  description: 'Learn about our 7-day money-back guarantee and hassle-free refund process.',
}

const refundSteps = [
  {
    step: '01',
    title: 'Contact Us',
    description: 'Send an email to support@ayonne.skin with your order number',
  },
  {
    step: '02',
    title: 'Provide Details',
    description: 'Include the reason for your refund request (optional but appreciated)',
  },
  {
    step: '03',
    title: 'Quick Review',
    description: 'Our team will review and process your request within 2-3 business days',
  },
  {
    step: '04',
    title: 'Refund Issued',
    description: 'Refunds will be credited to your original payment method',
  },
]

export default function RefundPolicyPage() {
  return (
    <>
      {/* Hero Section with Guarantee Badge */}
      <section className="relative bg-gradient-to-b from-[#F4EBE7] via-[#F4EBE7]/95 to-white py-16 md:py-24 overflow-hidden">
        {/* Subtle decorative elements */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-[#1C4444]/[0.02] rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-[#D4AF37]/[0.03] rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

        <div className="container mx-auto px-4 lg:px-8 relative">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-[#D4AF37] mb-4 animate-elegant-fade-in">
              Shop With Confidence
            </p>
            <h1 className="text-4xl md:text-5xl font-light text-[#1C4444] mb-6 tracking-tight">
              Refund Policy
            </h1>
            <p className="text-lg text-[#1C4444]/60 leading-relaxed max-w-2xl mx-auto mb-10">
              At Ayonne, we stand behind the quality of our products. We&apos;re confident you&apos;ll
              love our skincare line.
            </p>

            {/* Guarantee Badge */}
            <div className="inline-flex items-center gap-4 bg-white/80 backdrop-blur-sm px-8 py-5 rounded-2xl shadow-luxury border border-[#D4AF37]/20">
              <div className="w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-[#C9A227] rounded-full flex items-center justify-center shadow-lg">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-2xl font-light text-[#1C4444] tracking-tight">100% Zero Risk</p>
                <p className="text-[#D4AF37] font-medium tracking-wide">Money Back Guarantee</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {/* 7-Day Return Window - Featured Card */}
            <div className="card-luxury p-8 md:p-12 mb-12 bg-gradient-to-br from-[#1C4444] to-[#1C4444]/95 text-white relative overflow-hidden">
              {/* Decorative element */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-3xl" />

              <div className="relative">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <span className="text-3xl font-light">7</span>
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-light tracking-tight">
                      Day Return Window
                    </h2>
                    <p className="text-white/60">Full refund, no questions asked</p>
                  </div>
                </div>

                <p className="text-white/80 leading-relaxed text-lg max-w-2xl">
                  If you&apos;re not completely satisfied with your purchase, you can request a full
                  refund within 7 days of your purchase date. Simply send us an email with your order
                  details, and we&apos;ll process your refund for the full purchase amount.
                </p>

                <p className="text-white/50 text-sm mt-6 italic">
                  Note: Any refunds requested after the 7-day window will not be eligible for
                  processing.
                </p>
              </div>
            </div>

            {/* How to Request a Refund */}
            <div className="mb-12">
              <div className="text-center mb-10">
                <p className="text-sm uppercase tracking-[0.25em] text-[#D4AF37] mb-3">
                  Simple Process
                </p>
                <h2 className="text-2xl md:text-3xl font-light text-[#1C4444] tracking-tight">
                  How to Request a Refund
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {refundSteps.map((step, index) => (
                  <div
                    key={step.step}
                    className="card-luxury p-6 group"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#1C4444] to-[#1C4444]/90 text-white rounded-full flex items-center justify-center text-sm font-medium shadow-luxury group-hover:shadow-luxury-lg transition-all duration-300">
                        {step.step}
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-[#1C4444] mb-2 tracking-wide">
                          {step.title}
                        </h3>
                        <p className="text-[#1C4444]/60 leading-relaxed">{step.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Policies */}
            <div className="space-y-6">
              {/* Digital Products */}
              <div className="card-luxury p-8">
                <div className="flex items-start gap-5">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#1C4444] to-[#1C4444]/90 text-white rounded-full flex items-center justify-center shadow-luxury">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-light text-[#1C4444] mb-3 tracking-tight">
                      Digital Products (eBooks)
                    </h2>
                    <p className="text-[#1C4444]/65 leading-relaxed">
                      Due to the nature of digital products, eBooks are eligible for refunds within
                      the same 7-day window. We want you to be completely satisfied with your
                      purchase.
                    </p>
                  </div>
                </div>
              </div>

              {/* Damaged Products */}
              <div className="card-luxury p-8">
                <div className="flex items-start gap-5">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#1C4444] to-[#1C4444]/90 text-white rounded-full flex items-center justify-center shadow-luxury">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-light text-[#1C4444] mb-3 tracking-tight">
                      Damaged or Defective Products
                    </h2>
                    <p className="text-[#1C4444]/65 leading-relaxed">
                      If you receive a damaged or defective product, please contact us immediately
                      with photos of the damage. We&apos;ll arrange for a replacement or full refund
                      at no additional cost to you.
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Section */}
              <div className="card-luxury p-8 bg-gradient-to-br from-[#F4EBE7]/50 to-white border-[#D4AF37]/20">
                <div className="flex items-start gap-5">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#D4AF37] to-[#C9A227] text-white rounded-full flex items-center justify-center shadow-luxury">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-light text-[#1C4444] mb-3 tracking-tight">
                      Need Assistance?
                    </h2>
                    <p className="text-[#1C4444]/65 leading-relaxed mb-4">
                      Our support team is here to help with any questions about refunds.
                    </p>
                    <a
                      href="mailto:support@ayonne.skin"
                      className="inline-flex items-center gap-2 text-[#1C4444] font-medium hover:text-[#D4AF37] transition-colors duration-300"
                    >
                      support@ayonne.skin
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14 5l7 7m0 0l-7 7m7-7H3"
                        />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation to other policies */}
            <div className="mt-16 pt-8 border-t border-[#1C4444]/10">
              <p className="text-sm uppercase tracking-[0.2em] text-[#D4AF37] text-center mb-6">
                Related Policies
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/policies/privacy-policy"
                  className="inline-flex items-center gap-2 px-6 py-3 border border-[#1C4444]/20 text-[#1C4444] rounded-lg hover:border-[#1C4444]/40 hover:bg-[#F4EBE7]/50 transition-all duration-300"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  Privacy Policy
                </Link>
                <Link
                  href="/policies/terms-of-service"
                  className="inline-flex items-center gap-2 px-6 py-3 border border-[#1C4444]/20 text-[#1C4444] rounded-lg hover:border-[#1C4444]/40 hover:bg-[#F4EBE7]/50 transition-all duration-300"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
