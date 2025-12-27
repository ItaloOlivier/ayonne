import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service | Ayonne',
  description: 'Read the terms and conditions for using Ayonne products and services.',
}

const sections = [
  {
    title: 'Agreement to Terms',
    content:
      'By accessing and using the Ayonne website and purchasing our products, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.',
  },
  {
    title: 'Products and Services',
    content:
      'All products are subject to availability. We reserve the right to discontinue any product at any time. Prices are subject to change without notice.',
    additionalContent:
      'Product images are for illustrative purposes. Actual products may vary slightly in appearance.',
  },
  {
    title: 'Orders and Payment',
    content:
      'When you place an order, you are making an offer to purchase. We reserve the right to accept or decline your order. Payment must be received before order processing.',
    additionalContent:
      'We accept major credit cards and other payment methods as displayed at checkout. All transactions are processed securely.',
  },
  {
    title: 'Shipping and Delivery',
    content:
      'Shipping times and costs vary based on location and shipping method selected. We are not responsible for delays caused by shipping carriers or customs.',
  },
  {
    title: 'Returns and Refunds',
    content:
      'Please refer to our Refund Policy for detailed information about returns and refunds. We offer a 7-day money-back guarantee on all purchases.',
    linkTo: '/policies/refund-policy',
    linkText: 'View Refund Policy',
  },
  {
    title: 'Intellectual Property',
    content:
      'All content on this website, including text, images, logos, and product designs, is the property of Ayonne and is protected by copyright and trademark laws.',
  },
  {
    title: 'User Accounts',
    content:
      'You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account.',
  },
  {
    title: 'Limitation of Liability',
    content:
      'Ayonne shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our products or services.',
  },
  {
    title: 'Product Usage',
    content:
      'Our skincare products are for external use only. Please read all product labels and instructions before use. If irritation occurs, discontinue use and consult a healthcare professional.',
  },
  {
    title: 'Changes to Terms',
    content:
      'We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting to the website.',
  },
]

export default function TermsOfServicePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-[#F4EBE7] via-[#F4EBE7]/95 to-white py-16 md:py-24 overflow-hidden">
        {/* Subtle decorative elements */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-[#1C4444]/[0.02] rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-[#D4AF37]/[0.03] rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

        <div className="container mx-auto px-4 lg:px-8 relative">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-[#D4AF37] mb-4 animate-elegant-fade-in">
              Our Agreement
            </p>
            <h1 className="text-4xl md:text-5xl font-light text-[#1C4444] mb-6 tracking-tight">
              Terms of Service
            </h1>
            <p className="text-lg text-[#1C4444]/60 leading-relaxed max-w-2xl mx-auto">
              Please read these terms carefully before using our website and services. By using
              Ayonne, you agree to be bound by these terms.
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {/* Table of Contents */}
            <div className="card-luxury p-8 md:p-10 mb-12 bg-gradient-to-br from-[#F4EBE7]/30 to-white">
              <h2 className="text-lg font-medium text-[#1C4444] mb-6 tracking-wide flex items-center gap-3">
                <svg className="w-5 h-5 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                  />
                </svg>
                Table of Contents
              </h2>
              <div className="grid md:grid-cols-2 gap-x-8 gap-y-3">
                {sections.map((section, index) => (
                  <a
                    key={section.title}
                    href={`#section-${index + 1}`}
                    className="flex items-center gap-3 text-[#1C4444]/65 hover:text-[#1C4444] transition-colors duration-300 group"
                  >
                    <span className="text-xs text-[#D4AF37] font-medium w-6">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="group-hover:translate-x-1 transition-transform duration-300">
                      {section.title}
                    </span>
                  </a>
                ))}
              </div>
            </div>

            {/* Policy Sections */}
            <div className="space-y-8">
              {sections.map((section, index) => (
                <div
                  key={section.title}
                  id={`section-${index + 1}`}
                  className="card-luxury p-8 md:p-10 scroll-mt-24"
                >
                  <div className="flex items-start gap-5">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#1C4444] to-[#1C4444]/90 text-white rounded-full flex items-center justify-center text-sm font-medium shadow-luxury">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl md:text-2xl font-light text-[#1C4444] mb-4 tracking-tight">
                        {section.title}
                      </h2>
                      <p className="text-[#1C4444]/65 leading-relaxed">{section.content}</p>
                      {section.additionalContent && (
                        <p className="text-[#1C4444]/65 leading-relaxed mt-4">
                          {section.additionalContent}
                        </p>
                      )}
                      {section.linkTo && (
                        <Link
                          href={section.linkTo}
                          className="inline-flex items-center gap-2 mt-4 text-[#1C4444] font-medium hover:text-[#D4AF37] transition-colors duration-300"
                        >
                          {section.linkText}
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M14 5l7 7m0 0l-7 7m7-7H3"
                            />
                          </svg>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Contact Section */}
              <div className="card-luxury p-8 md:p-10 bg-gradient-to-br from-[#F4EBE7]/50 to-white border-[#D4AF37]/20">
                <div className="flex items-start gap-5">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#D4AF37] to-[#C9A227] text-white rounded-full flex items-center justify-center shadow-luxury">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl md:text-2xl font-light text-[#1C4444] mb-4 tracking-tight">
                      Contact Information
                    </h2>
                    <p className="text-[#1C4444]/65 leading-relaxed mb-4">
                      For questions about these Terms of Service, please contact us:
                    </p>
                    <a
                      href="mailto:support@ayonne.skin"
                      className="inline-flex items-center gap-2 text-[#1C4444] font-medium hover:text-[#D4AF37] transition-colors duration-300"
                    >
                      support@ayonne.skin
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

            {/* Last Updated */}
            <div className="text-center mt-12 pt-8 border-t border-[#1C4444]/10">
              <p className="text-sm text-[#1C4444]/45 tracking-wide">
                Last updated:{' '}
                {new Date().toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
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
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  href="/policies/refund-policy"
                  className="inline-flex items-center gap-2 px-6 py-3 border border-[#1C4444]/20 text-[#1C4444] rounded-lg hover:border-[#1C4444]/40 hover:bg-[#F4EBE7]/50 transition-all duration-300"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                  Refund Policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
