import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Skin Analysis | Upload Your Photo',
  description: 'Upload a selfie for AI-powered skin analysis. Get personalized product recommendations in seconds.',
  alternates: {
    canonical: 'https://ai.ayonne.skin/skin-analysis',
  },
  openGraph: {
    title: 'AI Skin Analysis | Ayonne',
    description: 'Upload a selfie for instant AI skin analysis with personalized recommendations.',
    url: 'https://ai.ayonne.skin/skin-analysis',
  },
}

export default function SkinAnalysisLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
