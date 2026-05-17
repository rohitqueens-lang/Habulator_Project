import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['300', '400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'Habulator — Great Lakes Phytoplankton Predictor',
  description:
    'ML-powered phytoplankton biovolume prediction tool for the Great Lakes. ' +
    'Powered by XGBoost + Conformal Prediction. Data: 2001–2022.',
  keywords: [
    'Great Lakes',
    'phytoplankton',
    'biovolume',
    'prediction',
    'machine learning',
    'XGBoost',
    'SHAP',
    'water quality',
  ],
  authors: [{ name: 'Shukla Lab' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#0A0F1E',
  openGraph: {
    title: 'Habulator — Great Lakes Phytoplankton Predictor',
    description: 'ML-powered phytoplankton biovolume prediction for the Great Lakes.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-sans text-white antialiased" style={{ background: '#0A0F1E' }}>
        {children}
      </body>
    </html>
  )
}
