import type { Metadata, Viewport } from 'next';
import './globals.css';
import TopBar from '@/components/layout/TopBar';
import BottomNav from '@/components/BottomNav';

export const metadata: Metadata = {
  title: 'Farming Tech & Business',
  description: 'Join, Learn, Grow, Connect & Earn — the digital operating system for African farmers.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#166534',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TopBar />
        <main className="mx-auto max-w-md min-h-screen">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}