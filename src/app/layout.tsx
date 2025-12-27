import type { Metadata } from "next"
import { IBM_Plex_Sans } from "next/font/google"
import "./globals.css"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"

const ibmPlexSans = IBM_Plex_Sans({
  weight: ['400', '500', '600', '700'],
  subsets: ["latin"],
  variable: "--font-ibm-plex-sans",
})

export const metadata: Metadata = {
  title: {
    default: "Ayonne | Science-Backed Skincare",
    template: "%s | Ayonne",
  },
  description: "Shop Ayonne's skincare line, inspired by Bryan Johnson's Blue Project Protocol. Discover anti-aging serums, glow-enhancing products, and beauty eBooks for radiant, youthful skin.",
  keywords: ["skincare", "anti-aging", "serums", "moisturizers", "vegan", "cruelty-free", "beauty"],
  openGraph: {
    title: "Ayonne | Science-Backed Skincare",
    description: "Transform your skincare routine with science-backed, cruelty-free formulas designed to turn back time.",
    url: "https://ayonne.skin",
    siteName: "Ayonne",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${ibmPlexSans.variable} font-sans antialiased min-h-screen flex flex-col`}>
        <Header />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
