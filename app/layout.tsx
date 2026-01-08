import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://evo2-variant-intelligence.vercel.app/"),
  title: {
    default: "Evo2 Variant Intelligence",
    template: "%s | Evo2 Variant Intelligence",
  },
  description: "Single-nucleotide variant pathogenicity prediction powered by Evo2 deep learning. An enterprise console for variant intelligence with real-time inference, ClinVar integration, and comprehensive genomic analysis.",
  keywords: [
    "pathogenicity prediction",
    "variant analysis",
    "genomics",
    "Evo2",
    "deep learning",
    "single-nucleotide variant",
    "SNV",
    "ClinVar",
    "genomic intelligence",
    "variant triage",
    "bioinformatics",
  ],
  authors: [{ name: "Evo2 Variant Intelligence Team" }],
  creator: "Evo2 Variant Intelligence",
  publisher: "Evo2 Variant Intelligence",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Evo2 Variant Intelligence",
    title: "Evo2 Variant Intelligence - Pathogenicity Prediction Platform",
    description: "Single-nucleotide variant pathogenicity prediction powered by Evo2 deep learning. An enterprise console for variant intelligence.",
    images: [
      {
        url: "/Logo.png",
        width: 1200,
        height: 630,
        alt: "Evo2 Variant Intelligence Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Evo2 Variant Intelligence - Pathogenicity Prediction Platform",
    description: "Single-nucleotide variant pathogenicity prediction powered by Evo2 deep learning.",
    images: ["/Logo.png"],
    creator: "@evo2variant",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/Logo.png", sizes: "any" },
      { url: "/Logo.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/Logo.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
  alternates: {
    canonical: "/",
  },
}

export const viewport: Viewport = {
  themeColor: "#020809",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://evo2-variant-intelligence.com"
  
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Evo2 Variant Intelligence",
    "description": "Single-nucleotide variant pathogenicity prediction powered by Evo2 deep learning",
    "url": siteUrl,
    "applicationCategory": "ScienceApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "featureList": [
      "Pathogenicity prediction",
      "Variant analysis",
      "ClinVar integration",
      "Real-time inference",
      "Genomic intelligence"
    ]
  }

  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-background min-h-screen overflow-x-hidden`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  )
}
