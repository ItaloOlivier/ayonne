import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 lg:px-8 py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl text-[#1C4444] mb-8">Privacy Policy</h1>

        <div className="prose prose-lg text-[#1C4444]/70 space-y-6">
          <p>
            This Privacy Policy describes how Ayonne (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) collects, uses,
            and shares information about you when you use our website, products, and services.
          </p>

          <section>
            <h2 className="text-xl text-[#1C4444] mb-4">Information We Collect</h2>
            <p>We collect information you provide directly to us, including:</p>
            <ul className="list-disc list-inside space-y-2 mt-4">
              <li>Name, email address, and contact information</li>
              <li>Billing and shipping addresses</li>
              <li>Payment information (processed securely through our payment providers)</li>
              <li>Order history and preferences</li>
              <li>Communications with our support team</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl text-[#1C4444] mb-4">How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc list-inside space-y-2 mt-4">
              <li>Process and fulfill your orders</li>
              <li>Send order confirmations and shipping updates</li>
              <li>Respond to your questions and provide customer support</li>
              <li>Send promotional emails (you can opt out anytime)</li>
              <li>Improve our products and services</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl text-[#1C4444] mb-4">Information Sharing</h2>
            <p>
              We do not sell your personal information. We may share your information with:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4">
              <li>Service providers who assist with order fulfillment and shipping</li>
              <li>Payment processors to complete transactions</li>
              <li>Analytics providers to improve our website</li>
              <li>Law enforcement when required by law</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl text-[#1C4444] mb-4">Data Security</h2>
            <p>
              We implement appropriate security measures to protect your personal information.
              All payment transactions are encrypted using SSL technology.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-[#1C4444] mb-4">Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 mt-4">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your personal information</li>
              <li>Opt out of marketing communications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl text-[#1C4444] mb-4">Cookies</h2>
            <p>
              We use cookies and similar technologies to enhance your browsing experience,
              analyze website traffic, and personalize content. You can manage cookie
              preferences through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-[#1C4444] mb-4">Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <ul className="list-none mt-4">
              <li>Email: privacy@ayonne.skin</li>
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
