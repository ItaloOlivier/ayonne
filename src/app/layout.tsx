import type { Metadata, Viewport } from "next"
import { IBM_Plex_Sans } from "next/font/google"
import "./globals.css"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import { ToastProvider } from "@/components/ui/Toast"

const ibmPlexSans = IBM_Plex_Sans({
  weight: ['400', '500', '600', '700'],
  subsets: ["latin"],
  variable: "--font-ibm-plex-sans",
})

const BASE_URL = 'https://ai.ayonne.skin'

export const viewport: Viewport = {
  themeColor: '#1C4444',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "AI Skin Analyzer | Personalized Skincare | Ayonne",
    template: "%s | Ayonne AI Skin Analyzer",
  },
  description: "Free AI Skin Analyzer by Ayonne. Upload a selfie, get instant skin analysis, and discover products matched to your unique skin concerns.",
  keywords: [
    "AI skin analysis",
    "skin analyzer",
    "personalized skincare",
    "skin type test",
    "skincare recommendations",
    "anti-aging",
    "acne treatment",
    "skin health score",
    "vegan skincare",
    "cruelty-free beauty",
    "Ayonne",
  ],
  authors: [{ name: "Ayonne Skincare", url: "https://ayonne.skin" }],
  creator: "Ayonne",
  publisher: "Ayonne",
  manifest: "/manifest.json",
  alternates: {
    canonical: BASE_URL,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Ayonne Skin Analyzer",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "Ayonne AI Skin Analyzer",
    title: "AI Skin Analyzer | Get Personalized Skincare Recommendations",
    description: "Upload a selfie and get instant AI-powered skin analysis with personalized product recommendations from Ayonne's science-backed skincare line.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Ayonne AI Skin Analyzer - Personalized Skincare Recommendations",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Skin Analyzer | Ayonne",
    description: "Free AI-powered skin analysis with personalized skincare recommendations. Discover your perfect routine.",
    images: ["/og-image.png"],
    creator: "@ayonneskin",
  },
  verification: {
    // Add your verification codes here when ready
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
  category: "health",
}

// JSON-LD Structured Data for SEO and AI
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${BASE_URL}/#website`,
      url: BASE_URL,
      name: 'Ayonne AI Skin Analyzer',
      description: 'AI-powered skin analysis with personalized skincare recommendations',
      publisher: {
        '@id': `${BASE_URL}/#organization`,
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${BASE_URL}/skin-analysis`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'Organization',
      '@id': `${BASE_URL}/#organization`,
      name: 'Ayonne Skincare',
      url: 'https://ayonne.skin',
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/images/ayonne-logo.png`,
        width: 200,
        height: 60,
      },
      sameAs: [
        'https://instagram.com/ayonneskin',
        'https://facebook.com/ayonneskin',
        'https://twitter.com/ayonneskin',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        url: `${BASE_URL}/pages/contact`,
      },
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${BASE_URL}/#app`,
      name: 'Ayonne AI Skin Analyzer',
      applicationCategory: 'HealthApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        ratingCount: '2000',
        bestRating: '5',
        worstRating: '1',
      },
      description: 'Upload a selfie and receive instant AI-powered skin analysis with personalized product recommendations.',
      featureList: [
        'AI-powered skin type detection',
        'Skin condition analysis',
        'Personalized product recommendations',
        'Skin health score tracking',
        'Progress monitoring over time',
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How does the AI skin analyzer work?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Upload a clear selfie and our AI analyzes your skin type, detects conditions like acne, wrinkles, and dark spots, then recommends personalized products from our science-backed skincare line.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is the skin analysis free?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes! The AI skin analysis is completely free. You can analyze your skin daily to track improvements over time.',
          },
        },
        {
          '@type': 'Question',
          name: 'Are Ayonne products vegan and cruelty-free?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, all Ayonne products are 100% vegan, cruelty-free, and paraben-free. We never test on animals.',
          },
        },
      ],
    },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        {/* iOS Splash Screens */}
        <link rel="apple-touch-startup-image" href="/splash-1170x2532.png" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash-1284x2778.png" media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash-1179x2556.png" media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash-1290x2796.png" media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash-1125x2436.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash-1242x2688.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash-828x1792.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash-1242x2208.png" media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash-750x1334.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash-640x1136.png" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${ibmPlexSans.variable} font-sans antialiased min-h-screen flex flex-col`}>
        <ToastProvider>
          <Header />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  )
}
