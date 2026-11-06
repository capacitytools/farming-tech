import { createClient } from "@/lib/supabase/server";
import HomeExperience from "@/components/home/HomeExperience";

// SEO METADATA
export const metadata = {
  title: 'Farming Tech & Business | Agricultural Knowledge & Tech',
  description: 'Learn modern farming, livestock rearing, crop science, and agribusiness in Nigeria. Use our AI Agri-Doctor to diagnose plant and animal diseases instantly.',
  alternates: { canonical: 'https://farmingtechbusiness.com' },
};

export default async function HomePage() {
  const supabase = createClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [blogs, popularBlogs, tribes, listings, ebooks, leaders, profileCount, tribeCount, listingCount, authUser, hot, recentPosts, recentSales, joinedToday, verifiedCount] = await Promise.all([
    // Latest Articles (for the magazine section)
    supabase.from("blogs").select("title, slug, cover_image_url, cover_ratio, category, views_count, excerpt").eq("status", "published").order("created_at", { ascending: false }).limit(6),
    
    // Popular Articles (for the trending section)
    supabase.from("blogs").select("title, slug, cover_image_url, cover_ratio, category, views_count").eq("status", "published").order("views_count", { ascending: false }).limit(3),

    supabase.from("tribes").select("name, slug, icon, image_url, member_count").order("member_count", { ascending: false }).limit(6),
    supabase.from("livestock_listings").select("id, title, price, currency, images").eq("status", "active").order("created_at", { ascending: false }).limit(4),
    supabase.from("ebooks").select("id, title, price, currency, cover_url").eq("is_active", true).limit(3),
    supabase.rpc("public_leaderboard"),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("tribes").select("*", { count: "exact", head: true }),
    supabase.from("livestock_listings").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.auth.getUser(),
    supabase.rpc("ranked_feed"),
    supabase.from("feed_posts").select("id, profiles(full_name)").order("created_at", { ascending: false }).limit(5),
    supabase.from("livestock_listings").select("title, profiles(full_name)").eq("status", "sold").order("created_at", { ascending: false }).limit(3),
    supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", today.toISOString()),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("verified", true),
  ]);

  let onboarding: any = null;
  const user = authUser.data?.user;
  if (user) {
    const [tm, fp, sc, eb] = await Promise.all([
      supabase.from("tribe_members").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("feed_posts").select("id", { count: "exact", head: true }).eq("author_id", user.id),
      supabase.from("ai_scans").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("ebook_purchases").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    ]);
    const steps = [
      { label: "🌾 Join a tribe", done: (tm.count || 0) > 0, href: "/communities" },
      { label: "📣 Post on the Timeline", done: (fp.count || 0) > 0, href: "/feed" },
      { label: "🩺 Scan with AI Doctor", done: (sc.count || 0) > 0, href: "/scanner" },
      { label: "📚 Get an e-book", done: (eb.count || 0) > 0, href: "/ebooks" },
    ];
    const doneCount = steps.filter((s: any) => s.done).length;
    if (doneCount < steps.length) onboarding = { steps, doneCount };
  }

  return (
    <HomeExperience
      d={{
        blogs: blogs.data || [],
        popularBlogs: popularBlogs.data || [], // 🚨 NEW: Passing popular blogs to the UI
        tribes: tribes.data || [],
        listings: listings.data || [],
        ebooks: ebooks.data || [],
        leaders: leaders.data || [],
        profileCount: profileCount.count || 0,
        tribeCount: tribeCount.count || 0,
        listingCount: listingCount.count || 0,
        user: user ? { id: user.id } : null,
        hot: hot.data || [],
        onboarding,
        tickerPosts: (recentPosts.data || []).map((p: any) => p.profiles?.full_name || "A farmer"),
        tickerSales: (recentSales.data || []).map((s: any) => ({ title: s.title, name: s.profiles?.full_name || "A farmer" })),
        joinedToday: joinedToday.count || 0,
        verifiedCount: verifiedCount.count || 0,
      }}
    />
  );
}