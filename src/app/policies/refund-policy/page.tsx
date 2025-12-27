import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Refund Policy',
}

export default function RefundPolicyPage() {
  return (
    <div className="container mx-auto px-4 lg:px-8 py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl text-[#1C4444] mb-8">Refund Policy</h1>

        <div className="prose prose-lg text-[#1C4444]/70 space-y-6">
          <section>
            <h2 className="text-xl text-[#1C4444] mb-4">100% Zero Risk Money Back Guarantee</h2>
            <p>
              At Ayonne, we stand behind the quality of our products. We&apos;re confident you&apos;ll love
              our skincare line, which is why we offer a comprehensive money-back guarantee.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-[#1C4444] mb-4">7-Day Return Window</h2>
            <p>
              If you&apos;re not completely satisfied with your purchase, you can request a full refund
              within 7 days of your purchase date. Simply send us an email with your order details,
              and we&apos;ll process your refund for the full purchase amount.
            </p>
            <p className="text-sm italic mt-4">
              Please note: Any refunds requested after the 7-day window will not be eligible for processing.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-[#1C4444] mb-4">Digital Products (eBooks)</h2>
            <p>
              Due to the nature of digital products, eBooks are eligible for refunds within the same
              7-day window. We want you to be completely satisfied with your purchase.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-[#1C4444] mb-4">How to Request a Refund</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>Send an email to support@ayonne.skin with your order number</li>
              <li>Include the reason for your refund request (optional but appreciated)</li>
              <li>Our team will review and process your request within 2-3 business days</li>
              <li>Refunds will be credited to your original payment method</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl text-[#1C4444] mb-4">Damaged or Defective Products</h2>
            <p>
              If you receive a damaged or defective product, please contact us immediately with photos
              of the damage. We&apos;ll arrange for a replacement or full refund at no additional cost to you.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-[#1C4444] mb-4">Contact Us</h2>
            <p>
              For any questions about our refund policy, please contact us at:
            </p>
            <ul className="list-none mt-4">
              <li>Email: support@ayonne.skin</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
