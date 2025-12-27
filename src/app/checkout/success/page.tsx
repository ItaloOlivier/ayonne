import Link from 'next/link'

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>
}) {
  const params = await searchParams
  const orderNumber = params.order

  return (
    <div className="min-h-screen bg-[#F4EBE7] flex items-center justify-center py-16">
      <div className="max-w-lg mx-auto text-center px-4">
        <div className="w-20 h-20 bg-[#1C4444] rounded-full flex items-center justify-center mx-auto mb-8">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="white"
            className="w-10 h-10"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 12.75l6 6 9-13.5"
            />
          </svg>
        </div>

        <h1 className="text-3xl md:text-4xl text-[#1C4444] mb-4">
          Thank you for your order!
        </h1>

        {orderNumber && (
          <p className="text-[#1C4444]/70 mb-2">
            Order number: <span className="font-medium text-[#1C4444]">{orderNumber}</span>
          </p>
        )}

        <p className="text-[#1C4444]/70 mb-8">
          We&apos;ve received your order and will send you a confirmation email shortly.
          Your items will be shipped within 2-3 business days.
        </p>

        <div className="space-y-4">
          <Link href="/collections/all" className="btn-primary inline-block">
            Continue Shopping
          </Link>
        </div>

        <div className="mt-12 pt-8 border-t border-[#1C4444]/10">
          <h2 className="text-lg text-[#1C4444] mb-4">What happens next?</h2>
          <div className="grid gap-6 text-left">
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-[#1C4444]/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-[#1C4444] text-sm font-medium">1</span>
              </div>
              <div>
                <h3 className="text-[#1C4444] font-medium">Order Confirmation</h3>
                <p className="text-[#1C4444]/70 text-sm">
                  You&apos;ll receive an email confirming your order details.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-[#1C4444]/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-[#1C4444] text-sm font-medium">2</span>
              </div>
              <div>
                <h3 className="text-[#1C4444] font-medium">Processing</h3>
                <p className="text-[#1C4444]/70 text-sm">
                  We&apos;ll carefully prepare and package your products.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-[#1C4444]/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-[#1C4444] text-sm font-medium">3</span>
              </div>
              <div>
                <h3 className="text-[#1C4444] font-medium">Shipping</h3>
                <p className="text-[#1C4444]/70 text-sm">
                  You&apos;ll receive tracking information once shipped.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
