'use client'

import { useState } from 'react'

const faqs = [
  {
    question: 'Are your products cruelty-free?',
    answer: 'Yes! All Ayonne products are 100% cruelty-free. We never test on animals and are committed to ethical beauty practices.',
  },
  {
    question: 'Are your products vegan?',
    answer: 'Yes, all our skincare products are vegan and free from animal-derived ingredients. We use only plant-based and synthetic alternatives.',
  },
  {
    question: 'What is your return policy?',
    answer: 'We offer a 7-day money-back guarantee on all purchases. If you\'re not satisfied with your order, simply contact us within 7 days of purchase for a full refund.',
  },
  {
    question: 'How long does shipping take?',
    answer: 'Orders within the US typically arrive in 3-7 business days. International shipping takes 7-21 business days depending on location. Digital products are delivered instantly via email.',
  },
  {
    question: 'Do you offer free shipping?',
    answer: 'Yes! We offer free shipping on all orders over $50 within the US. Orders under $50 ship for $9.95.',
  },
  {
    question: 'What ingredients do you use?',
    answer: 'We use high-quality, science-backed ingredients including hyaluronic acid, retinol, vitamin C, peptides, and natural botanical extracts. All products are paraben-free and talc-free.',
  },
  {
    question: 'How should I store my skincare products?',
    answer: 'Store products in a cool, dry place away from direct sunlight. Some products with active ingredients like retinol and vitamin C may benefit from refrigeration to extend their potency.',
  },
  {
    question: 'Can I use multiple serums together?',
    answer: 'Yes, you can layer multiple serums! Apply from thinnest to thickest consistency, and wait a minute between layers for absorption. Our bundles are specifically curated to work well together.',
  },
  {
    question: 'What skincare routine do you recommend?',
    answer: 'We recommend: 1) Cleanser, 2) Toner, 3) Serum(s), 4) Eye Cream, 5) Moisturizer, and 6) Sunscreen (AM). Start simple and add products gradually to see how your skin responds.',
  },
  {
    question: 'Are your products safe during pregnancy?',
    answer: 'While most of our products are safe, we recommend consulting with your healthcare provider before using products containing retinol or high concentrations of certain acids during pregnancy.',
  },
  {
    question: 'How long until I see results?',
    answer: 'Most customers notice improvements in skin hydration and texture within 2-4 weeks. For anti-aging benefits and significant changes, consistent use for 8-12 weeks is typically needed.',
  },
  {
    question: 'Do you ship internationally?',
    answer: 'Yes, we ship to most countries worldwide! Please note that international orders may be subject to customs duties and taxes, which are the responsibility of the recipient.',
  },
]

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="container mx-auto px-4 lg:px-8 py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl text-[#1C4444] text-center mb-4">
          Frequently Asked Questions
        </h1>
        <p className="text-center text-[#1C4444]/70 mb-12">
          Find answers to common questions about our products, shipping, and policies.
        </p>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-[#1C4444]/10 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-4 text-left bg-white hover:bg-[#F4EBE7]/50 transition-colors"
              >
                <span className="text-[#1C4444] font-medium pr-4">{faq.question}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className={`w-5 h-5 text-[#1C4444] flex-shrink-0 transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              {openIndex === index && (
                <div className="p-4 bg-[#F4EBE7]/50 border-t border-[#1C4444]/10">
                  <p className="text-[#1C4444]/70">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 text-center p-8 bg-[#1C4444]/5 rounded-lg">
          <h2 className="text-xl text-[#1C4444] mb-4">Still have questions?</h2>
          <p className="text-[#1C4444]/70 mb-6">
            Can&apos;t find what you&apos;re looking for? Our support team is here to help.
          </p>
          <a href="/pages/contact" className="btn-primary inline-block">
            Contact Us
          </a>
        </div>
      </div>
    </div>
  )
}
