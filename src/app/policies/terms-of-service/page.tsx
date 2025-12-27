import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service',
}

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto px-4 lg:px-8 py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl text-[#1C4444] mb-8">Terms of Service</h1>

        <div className="prose prose-lg text-[#1C4444]/70 space-y-6">
          <section>
            <h2 className="text-xl text-[#1C4444] mb-4">1. Agreement to Terms</h2>
            <p>
              By accessing and using the Ayonne website and purchasing our products, you agree
              to be bound by these Terms of Service. If you do not agree to these terms, please
              do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-[#1C4444] mb-4">2. Products and Services</h2>
            <p>
              All products are subject to availability. We reserve the right to discontinue any
              product at any time. Prices are subject to change without notice.
            </p>
            <p className="mt-4">
              Product images are for illustrative purposes. Actual products may vary slightly
              in appearance.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-[#1C4444] mb-4">3. Orders and Payment</h2>
            <p>
              When you place an order, you are making an offer to purchase. We reserve the right
              to accept or decline your order. Payment must be received before order processing.
            </p>
            <p className="mt-4">
              We accept major credit cards and other payment methods as displayed at checkout.
              All transactions are processed securely.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-[#1C4444] mb-4">4. Shipping and Delivery</h2>
            <p>
              Shipping times and costs vary based on location and shipping method selected.
              We are not responsible for delays caused by shipping carriers or customs.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-[#1C4444] mb-4">5. Returns and Refunds</h2>
            <p>
              Please refer to our Refund Policy for detailed information about returns and
              refunds. We offer a 7-day money-back guarantee on all purchases.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-[#1C4444] mb-4">6. Intellectual Property</h2>
            <p>
              All content on this website, including text, images, logos, and product designs,
              is the property of Ayonne and is protected by copyright and trademark laws.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-[#1C4444] mb-4">7. User Accounts</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account information
              and for all activities that occur under your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-[#1C4444] mb-4">8. Limitation of Liability</h2>
            <p>
              Ayonne shall not be liable for any indirect, incidental, special, or consequential
              damages arising from your use of our products or services.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-[#1C4444] mb-4">9. Product Usage</h2>
            <p>
              Our skincare products are for external use only. Please read all product labels
              and instructions before use. If irritation occurs, discontinue use and consult
              a healthcare professional.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-[#1C4444] mb-4">10. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Changes will be effective
              immediately upon posting to the website.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-[#1C4444] mb-4">11. Contact Information</h2>
            <p>
              For questions about these Terms of Service, please contact us at:
            </p>
            <ul className="list-none mt-4">
              <li>Email: support@ayonne.skin</li>
            </ul>
          </section>

          <p className="text-sm italic">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  )
}
