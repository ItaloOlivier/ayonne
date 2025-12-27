import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Shipping Information',
}

export default function ShippingPage() {
  return (
    <div className="container mx-auto px-4 lg:px-8 py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl text-[#1C4444] mb-8">Shipping Information</h1>

        <div className="prose prose-lg text-[#1C4444]/70 space-y-8">
          <section className="bg-[#1C4444]/5 p-6 rounded-lg">
            <h2 className="text-xl text-[#1C4444] mb-2">Free Shipping</h2>
            <p className="text-lg">
              Enjoy <strong className="text-[#1C4444]">FREE shipping</strong> on all orders over $50!
            </p>
          </section>

          <section>
            <h2 className="text-xl text-[#1C4444] mb-4">Shipping Rates</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-[#1C4444]/20">
                    <th className="text-left py-3 text-[#1C4444]">Order Total</th>
                    <th className="text-left py-3 text-[#1C4444]">Shipping Cost</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[#1C4444]/10">
                    <td className="py-3">Under $50</td>
                    <td className="py-3">$9.95</td>
                  </tr>
                  <tr className="border-b border-[#1C4444]/10">
                    <td className="py-3">$50 and above</td>
                    <td className="py-3 text-green-600 font-medium">FREE</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl text-[#1C4444] mb-4">Processing Time</h2>
            <p>
              Orders are typically processed within <strong>1-2 business days</strong>.
              You will receive an email confirmation once your order has shipped with tracking information.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-[#1C4444] mb-4">Delivery Times</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-[#1C4444]/20">
                    <th className="text-left py-3 text-[#1C4444]">Location</th>
                    <th className="text-left py-3 text-[#1C4444]">Estimated Delivery</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[#1C4444]/10">
                    <td className="py-3">United States</td>
                    <td className="py-3">3-7 business days</td>
                  </tr>
                  <tr className="border-b border-[#1C4444]/10">
                    <td className="py-3">Canada</td>
                    <td className="py-3">7-14 business days</td>
                  </tr>
                  <tr className="border-b border-[#1C4444]/10">
                    <td className="py-3">International</td>
                    <td className="py-3">14-21 business days</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm italic mt-4">
              Note: Delivery times may vary during peak seasons and holidays.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-[#1C4444] mb-4">Digital Products</h2>
            <p>
              eBooks and digital downloads are delivered instantly via email after purchase.
              No shipping required!
            </p>
          </section>

          <section>
            <h2 className="text-xl text-[#1C4444] mb-4">Order Tracking</h2>
            <p>
              Once your order ships, you&apos;ll receive an email with a tracking number. Use this
              number to track your package on the carrier&apos;s website.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-[#1C4444] mb-4">International Shipping</h2>
            <p>
              We ship to most countries worldwide. Please note that international orders may
              be subject to customs duties and taxes, which are the responsibility of the recipient.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-[#1C4444] mb-4">Questions?</h2>
            <p>
              If you have any questions about shipping, please contact our support team:
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
