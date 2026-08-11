import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AdsterraInjector from "@/components/AdsterraInjector";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import OneSignalInit from "@/components/OneSignalInit";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Farming Tech & Business",
  description: "AI Agri-Doctor · Market · Tribes · E-books",
  manifest: "/manifest.json",
  themeColor: "#166534",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Farming Tech",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={inter.className + " bg-forest-50 text-forest-900"}>
        <AdsterraInjector />
        <OneSignalInit />
        <div className="mx-auto max-w-md min-h-screen">
          <TopBar />
          <main className="pt-2">{children}</main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}