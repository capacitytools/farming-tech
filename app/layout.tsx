import type { Metadata } from "next";
import "./globals.css";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";

export const metadata: Metadata = {
  title: {
    default: "Farming Tech & Business — Join, Learn, Grow, Connect & Earn",
    template: "%s | Farming Tech & Business",
  },
  description:
    "The ultimate platform for farmers: AI crop & livestock doctor, marketplace, tribes, live trainings, ebooks, reels and more.",
  manifest: "/manifest.webmanifest",
  themeColor: "#166534",
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