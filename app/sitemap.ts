import { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const BASE = process.env.SITE_URL || "https://farming-tech.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient();

  const [blogs, tribes, listings] = await Promise.all([
    supabase.from("blogs").select("slug, published_at, updated_at").eq("status", "published"),
    supabase.from("tribes").select("slug"),
    supabase.from("livestock_listings").select("id, created_at").eq("status", "active"),
  ]);

  const staticPages = [
    "", "/blog", "/market", "/communities", "/ebooks", "/scanner",
    "/experts", "/about", "/contact", "/search", "/leaderboard", "/login",
  ].map((path) => ({
    url: `${BASE}${path}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  const blogPages = (blogs.data || []).map((b: any) => ({
    url: `${BASE}/blog/${b.slug}`,
    lastModified: new Date(b.updated_at || b.published_at || Date.now()),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const tribePages = (tribes.data || []).map((t: any) => ({
    url: `${BASE}/communities/${t.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));

  const listingPages = (listings.data || []).map((l: any) => ({
    url: `${BASE}/market/${l.id}`,
    lastModified: new Date(l.created_at || Date.now()),
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  return [...staticPages, ...blogPages, ...tribePages, ...listingPages];
}