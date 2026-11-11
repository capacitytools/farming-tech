import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { GoogleAnalytics } from '@next/third-parties/google';
import './globals.css';
import TopBar from '@/components/layout/TopBar';
import BottomNav from '@/components/BottomNav';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Farming Tech & Business',
  description: 'Join, Learn, Grow, Connect & Earn — the digital operating system for African farmers.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
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
    <html lang="en">
      <head>
        {/* 🚨 GOOGLE ADSENSE SCRIPT 🚨 */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8616746404460464"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body>
        <TopBar />
        <main className="mx-auto max-w-md min-h-screen">
          {children}
          <Footer />
        </main>
        <BottomNav />
        
        {/* 🚨 GOOGLE ANALYTICS CODE 🚨 */}
        <GoogleAnalytics gaId="G-J548KWZT5T" />
      </body>
    </html>
  );
}