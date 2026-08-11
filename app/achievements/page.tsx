"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AchievementsPage() {
  const [user, setUser] = useState<any>(null);
  const [s, setS] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user: u } } = await supabase.auth.getUser();
      setUser(u);
      if (u) {
        const count = async (table: string, col: string, val: any) => {
          const { count } = await supabase.from(table).select("*", { count: "exact", head: true }).eq(col, val);
          return count || 0;
        };
        const [posts, likesGiven, commentsGiven, listings, sold, scans, reviews, tribes, blogs, purchases, prof, pts] = await Promise.all([
          count("feed_posts", "author_id", u.id),
          count("feed_likes", "user_id", u.id),
          count("feed_comments", "user_id", u.id),
          count("livestock_listings", "seller_id", u.id),
          supabase.from("livestock_listings").select("*", { count: "exact", head: true }).eq("seller_id", u.id).eq("status", "sold").then((r) => r.count || 0),
          count("ai_scans", "user_id", u.id),
          count("listing_reviews", "user_id", u.id),
          count("tribe_members", "user_id", u.id),
          count("blogs", "author_id", u.id),
          supabase.from("ebook_purchases").select("*", { count: "exact", head: true }).eq("user_id", u.id).eq("status", "paid").then((r) => r.count || 0),
          supabase.from("profiles").select("verified, referral_code").eq("id", u.id).single(),
          supabase.rpc("user_points", { uid: u.id }),
        ]);
        const { data: myPosts } = await supabase.from("feed_posts").select("id, views_count").eq("author_id", u.id);
        let likesRecv = 0;
        if (myPosts && myPosts.length) {
          const ids = myPosts.map((p: any) => p.id);
          const { data: lv } = await supabase.from("feed_likes").select("post_id").in("post_id", ids);
          likesRecv = (lv || []).length;
        }
        const viewsTotal = (myPosts || []).reduce((a: number, x: any) => a + (x.views_count || 0), 0);
        const refCode = prof.data?.referral_code;
        let referrals = 0;
        if (refCode) {
          const { count } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("referred_by", refCode);
          referrals = count || 0;
        }
        setS({
          posts, likesGiven, commentsGiven, listings, sold, scans, reviews, tribes, blogs, purchases,          verified: prof.data?.verified, points: pts.data || 0, likesRecv, viewsTotal, referrals,
        });
      }
      setLoaded(true);
    })();
  }, []);

  if (!loaded) return <p className="text-center text-gray-500 py-10">Loading…</p>;
  if (!user || !s) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-2">🏅 Achievements</h1>
        <p className="text-gray-500 mb-6">Log in to see your badge collection.</p>
        <a href="/login" className="inline-block bg-green-600 text-white px-6 py-3 rounded-xl font-semibold">Log in</a>
      </div>
    );
  }

  const BADGES: any[] = [
    { icon: "🌱", name: "Sprout", desc: "Joined the platform", earned: true },
    { icon: "📣", name: "First Post", desc: "Shared on the Timeline", earned: s.posts >= 1 },
    { icon: "🔥", name: "Storyteller", desc: "5 timeline posts", earned: s.posts >= 5 },
    { icon: "❤️", name: "Friendly", desc: "Liked 10 posts", earned: s.likesGiven >= 10 },
    { icon: "⭐", name: "Loved Creator", desc: "Received 10 likes", earned: s.likesRecv >= 10 },
    { icon: "👁️", name: "Seen", desc: "100 total post views", earned: s.viewsTotal >= 100 },
    { icon: "💬", name: "Conversationalist", desc: "10 comments given", earned: s.commentsGiven >= 10 },
    { icon: "🌾", name: "Tribesman", desc: "Joined a tribe", earned: s.tribes >= 1 },
    { icon: "🐄", name: "Seller", desc: "Created a listing", earned: s.listings >= 1 },
    { icon: "💰", name: "Dealmaker", desc: "Marked an item SOLD", earned: s.sold >= 1 },
    { icon: "📚", name: "Scholar", desc: "Bought an e-book", earned: s.purchases >= 1 },
    { icon: "🩺", name: "Doctor Visitor", desc: "Used the AI Agri-Doctor", earned: s.scans >= 1 },
    { icon: "✍️", name: "Writer", desc: "Published a blog", earned: s.blogs >= 1 },
    { icon: "🎁", name: "Recruiter", desc: "Invited a friend", earned: s.referrals >= 1 },
    { icon: "🎖️", name: "Recruiter Pro", desc: "Invited 5 friends", earned: s.referrals >= 5 },
    { icon: "✅", name: "Verified", desc: "Verified member", earned: !!s.verified },
    { icon: "🏅", name: "Professional", desc: "Reached 300 points", earned: s.points >= 300 },
    { icon: "👑", name: "Golden Star", desc: "Reached 600 points", earned: s.points >= 600 },
  ];

  const earnedCount = BADGES.filter((b) => b.earned).length;

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">🏅 My Achievements</h1>
      <p className="text-gray-600 text-sm mb-6">
        You've earned <b className="text-amber-600">{earnedCount}</b> of {BADGES.length} badges · {s.points} pts
      </p>
      <div className="grid grid-cols-3 gap-3">
        {BADGES.map((b) => (
          <div key={b.name} className={`glass-card p-3 rounded-2xl text-center ${b.earned ? "border-2 border-amber-300" : "opacity-40 grayscale"}`}>            <p className="text-3xl mb-1">{b.icon}</p>
            <p className="font-bold text-xs">{b.name}</p>
            <p className="text-[9px] text-gray-500 mt-1">{b.desc}</p>
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-gray-500 mt-6">Grey badges = locked. Keep posting, selling, scanning & inviting to unlock them all! 🔓</p>
    </div>
  );
}