import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import TopBar from '@/components/layout/TopBar';
import BottomNav from '@/components/layout/BottomNav';
import AdsterraInjector from '@/components/layout/AdsterraInjector';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'Farming Tech & Business | AI Agri-Doctor, Marketplace & Farming Community',
    template: '%s | Farming Tech & Business',
  },
  description:
    'Join 130,000+ African farmers on Farming Tech & Business. Get AI crop & livestock diagnosis, buy/sell livestock, join Tribes for Poultry, Goats, Fish, Rabbits & more, and learn from verified experts.',
  applicationName: 'Farming Tech & Business',
  manifest: '/manifest.json',
  keywords: [
    'farming app Nigeria', 'AI crop disease detection', 'livestock marketplace Africa',
    'poultry farming app', 'agribusiness Nigeria', 'goat farming', 'fish farming app',
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Farming Tech',
  },
  openGraph: {
    type: 'website',
    siteName: 'Farming Tech & Business',
    title: 'Farming Tech & Business',
    description: 'AI-powered farming community, marketplace & agri-doctor for African farmers.',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icons/icon-192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#14532D',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        <div className="mx-auto max-w-md min-h-screen bg-forest-50 dark:bg-forest-900 relative">
          <TopBar />

          {/* Adsterra native ad zone — top of content, admin-controlled */}
          <div className="px-4 pt-2">
            <AdsterraInjector slot="native" />
          </div>

          <main className="pb-28">{children}</main>

          {/* Adsterra banner zone — above bottom nav, admin-controlled */}
          <div className="px-4 pb-2">
            <AdsterraInjector slot="banner" />
          </div>

          <BottomNav />
        </div>

        {/* Adsterra push notification script — loaded site-wide, admin-controlled */}
        <AdsterraInjector slot="push" />
      </body>
    </html>
  );
}
