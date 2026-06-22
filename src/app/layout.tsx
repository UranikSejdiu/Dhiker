import type { Metadata, Viewport } from 'next'
import { Providers } from '@/providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'My Dhikr Counter',
  description: 'Remember Allah, find peace',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'My Dhikr Counter',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#060D1B',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-512.png" />
        <link rel="apple-touch-startup-image" href="/icons/icon-512.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="My Dhikr" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
