import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import Footer from "@/components/layout/Footer";
import AdsterraInjector from "@/components/AdsterraInjector";

export const metadata: Metadata = {
  title: {
    default: "Farming Tech & Business",
    template: "%s | Farming Tech & Business",
  },
  description:
    "AI Agri-Doctor, livestock marketplace, farming communities, daily farming insights and expert directory for African farmers.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Farming Tech & Business",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#15803d",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AdsterraInjector />
        <TopBar />
        <main>{children}</main>
        <Footer />
        <BottomNav />
      </body>
    </html>
  );
}