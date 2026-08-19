import { createClient } from "@/lib/supabase/server";
import EbookDetailClient from "@/components/EbookDetailClient";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const supabase = createClient();
  const { data: b } = await supabase.from("ebooks").select("*").eq("id", params.id).single();
  const title = b ? b.title + " — Farming Tech & Business" : "E-book Store — Farming Tech & Business";
  const desc = b ? (b.description || "Learn from real farmers. Buy once, read forever on Farming Tech & Business.").slice(0, 150) : "Learn from real farmers on Farming Tech & Business.";
  const img = b?.cover_url || "https://farming-tech.vercel.app/og-default.jpg";
  return {
    title,
    description: desc,
    openGraph: { title, description: desc, images: [{ url: img }], type: "book" },
    twitter: { card: "summary_large_image", title, description: desc, images: [img] },
  };
}

export default function EbookPage(props: any) {
  return <EbookDetailClient id={props.params.id} />;
}