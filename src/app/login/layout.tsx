import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login - Access Your Account',
  description: 'Sign in to your Ayonne account to view your skin analysis history, track skin health progress, and access personalized skincare recommendations.',
  alternates: {
    canonical: 'https://ai.ayonne.skin/login',
  },
  robots: {
    index: false, // Don't index login page
    follow: true,
  },
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
