import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '30-Day Glow Challenge | Transform Your Skin',
  description: 'Join the 30-Day Glow Challenge. Get daily skin analysis, earn rewards, and see your transformation. Free to join.',
  alternates: {
    canonical: 'https://ai.ayonne.skin/challenge',
  },
  openGraph: {
    title: '30-Day Glow Challenge | Ayonne',
    description: 'Transform your skin in 30 days. Daily tracking, rewards, and personalized recommendations.',
    url: 'https://ai.ayonne.skin/challenge',
  },
}

export default function ChallengeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
