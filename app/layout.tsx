import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

// Update this to your production origin
// e.g., https://tossword.app
const SITE_URL = 'https://tossword.app' // TODO: set to your domain

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Tossword — Solve the mystery word in as few steps as possible',
    template: '%s · Tossword',
  },
  description:
    'Play Tossword, a modern word ladder puzzle. Change one letter at a time, rearrange, and discover the mystery word.',
  applicationName: 'Tossword',
  generator: 'Next.js',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'Tossword',
    title: 'Tossword — Solve the mystery word in as few steps as possible',
    description:
      'A fast, clean, accessible word ladder game. Change one letter at a time to reach the goal.',
    images: [
      {
        url: '/placeholder.jpg', // Consider replacing with a branded social image
        width: 1200,
        height: 630,
        alt: 'Tossword — Word Ladder',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@tossword', // Optional: set your Twitter handle
    title: 'Tossword — Solve the mystery word in as few steps as possible',
    description:
      'A fast, clean, accessible word ladder game. Change one letter at a time to reach the goal.',
    images: ['/placeholder.jpg'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
    other: [
      { rel: 'mask-icon', url: '/safari-pinned-tab.svg', color: '#111827' },
    ],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
  colorScheme: 'light',
  viewportFit: 'cover',
  interactiveWidget: 'overlays-content',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Tossword',
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }

  // Minimal breadcrumb; OK to be simple (Home only)
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_URL,
      },
    ],
  }

  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>

        {/* Consent Mode v2 defaults (update your CMP to grant consent as needed) */}
        <Script id="consent-defaults" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);} 
            gtag('consent', 'default', {
              'ad_storage': 'denied',
              'ad_user_data': 'denied',
              'ad_personalization': 'denied',
              'analytics_storage': 'denied',
              'functionality_storage': 'granted',
              'security_storage': 'granted'
            });
          `}
        </Script>



        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
