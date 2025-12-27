import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy | Ayonne',
  description: 'Learn how Ayonne protects your personal information and respects your privacy.',
}

const sections = [
  {
    title: 'Information We Collect',
    content: 'We collect information you provide directly to us, including:',
    items: [
      'Name, email address, and contact information',
      'Billing and shipping addresses',
      'Payment information (processed securely through our payment providers)',
      'Order history and preferences',
      'Communications with our support team',
    ],
  },
  {
    title: 'How We Use Your Information',
    content: 'We use the information we collect to:',
    items: [
      'Process and fulfill your orders',
      'Send order confirmations and shipping updates',
      'Respond to your questions and provide customer support',
      'Send promotional emails (you can opt out anytime)',
      'Improve our products and services',
      'Comply with legal obligations',
    ],
  },
  {
    title: 'Information Sharing',
    content: 'We do not sell your personal information. We may share your information with:',
    items: [
      'Service providers who assist with order fulfillment and shipping',
      'Payment processors to complete transactions',
      'Analytics providers to improve our website',
      'Law enforcement when required by law',
    ],
  },
  {
    title: 'Data Security',
    content:
      'We implement appropriate security measures to protect your personal information. All payment transactions are encrypted using SSL technology. Your data is stored securely and accessed only by authorized personnel.',
  },
  {
    title: 'Your Rights',
    content: 'You have the right to:',
    items: [
      'Access the personal information we hold about you',
      'Request correction of inaccurate information',
      'Request deletion of your personal information',
      'Opt out of marketing communications',
    ],
  },
  {
    title: 'Cookies',
    content:
      'We use cookies and similar technologies to enhance your browsing experience, analyze website traffic, and personalize content. You can manage cookie preferences through your browser settings.',
  },
]

export default function PrivacyPolicyPage() {
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
              Your Trust Matters
            </p>
            <h1 className="text-4xl md:text-5xl font-light text-[#1C4444] mb-6 tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-lg text-[#1C4444]/60 leading-relaxed max-w-2xl mx-auto">
              This Privacy Policy describes how Ayonne collects, uses, and shares information about
              you when you use our website, products, and services.
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {/* Policy Sections */}
            <div className="space-y-8">
              {sections.map((section, index) => (
                <div
                  key={section.title}
                  className="card-luxury p-8 md:p-10"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start gap-5">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#1C4444] to-[#1C4444]/90 text-white rounded-full flex items-center justify-center text-sm font-medium shadow-luxury">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl md:text-2xl font-light text-[#1C4444] mb-4 tracking-tight">
                        {section.title}
                      </h2>
                      <p className="text-[#1C4444]/65 leading-relaxed mb-4">{section.content}</p>
                      {section.items && (
                        <ul className="space-y-3">
                          {section.items.map((item, itemIndex) => (
                            <li key={itemIndex} className="flex items-start gap-3">
                              <span className="flex-shrink-0 w-1.5 h-1.5 bg-[#D4AF37] rounded-full mt-2.5" />
                              <span className="text-[#1C4444]/65 leading-relaxed">{item}</span>
                            </li>
                          ))}
                        </ul>
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
                      Contact Us
                    </h2>
                    <p className="text-[#1C4444]/65 leading-relaxed mb-4">
                      If you have any questions about this Privacy Policy, please contact us:
                    </p>
                    <a
                      href="mailto:privacy@ayonne.skin"
                      className="inline-flex items-center gap-2 text-[#1C4444] font-medium hover:text-[#D4AF37] transition-colors duration-300"
                    >
                      privacy@ayonne.skin
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
                  href="/policies/terms-of-service"
                  className="inline-flex items-center gap-2 px-6 py-3 border border-[#1C4444]/20 text-[#1C4444] rounded-lg hover:border-[#1C4444]/40 hover:bg-[#F4EBE7]/50 transition-all duration-300"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Terms of Service
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
