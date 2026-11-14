import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { GoogleAnalytics } from '@next/third-parties/google';
import { ThemeProvider } from '@/components/ThemeProvider';
import './globals.css';
import TopBar from '@/components/layout/TopBar';
import BottomNav from '@/components/BottomNav';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Farming Tech & Business | Digital OS for African Farmers',
  description: 'Join, Learn, Grow, Connect & Earn. The ultimate agricultural platform for farmers, tech gurus, and business owners. Use our AI Doctor, Marketplace, and E-books.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icon-192.png' },
    ],
  },
  other: {
    'google-adsense-account': 'ca-pub-8616746404460464',
  },
};

export const viewport: Viewport = {
  themeColor: '#166534',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* 🚨 GOOGLE ADSENSE SCRIPT 🚨 */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8616746404460464"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />

        {/* 🚨 STRUCTURED DATA FOR GOOGLE SEARCH (LOGO & DESCRIPTION) 🚨 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Farming Tech & Business",
              "url": "https://www.farmingtechbusiness.com",
              "description": "The digital operating system for African farmers. Learn modern farming, use AI diagnostics, and grow your agribusiness.",
              "logo": "https://www.farmingtechbusiness.com/icon-192.png"
            })
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <TopBar />
          <main className="mx-auto max-w-md min-h-screen">
            {children}
            <Footer />
          </main>
          <BottomNav />
        </ThemeProvider>
        
        {/* 🚨 GOOGLE ANALYTICS 🚨 */}
        <GoogleAnalytics gaId="G-J548KWZT5T" />
      </body>
    </html>
  );
}