import { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://farming-tech.vercel.app";
  const supabase = createClient();
  const [blogs, listings, tribes] = await Promise.all([
    supabase.from("blogs").select("slug, published_at").eq("status", "published"),
    supabase.from("livestock_listings").select("id").eq("status", "active"),
    supabase.from("tribes").select("slug"),
  ]);

  const staticPages = ["", "/blog", "/market", "/communities", "/ebooks", "/scanner", "/experts", "/search", "/leaderboard", "/about", "/contact"].map((p) => ({
    url: base + p,
    changeFrequency: "daily" as const,
    priority: p === "" ? 1 : 0.8,
  }));

  const blogPages = (blogs.data || []).map((b: any) => ({
    url: `${base}/blog/${b.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const marketPages = (listings.data || []).map((l: any) => ({
    url: `${base}/market/${l.id}`,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const tribePages = (tribes.data || []).map((t: any) => ({
    url: `${base}/communities/${t.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...blogPages, ...marketPages, ...tribePages];
}