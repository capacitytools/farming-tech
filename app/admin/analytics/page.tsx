"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminAnalyticsPage() {
  const [s, setS] = useState<any>(null);
  const [days, setDays] = useState<any[]>([]);

  async function load() {
    const supabase = createClient();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const week = new Date(Date.now() - 7 * 86400000);

    const [users, usersToday, posts, postsWeek, listings, activeListings, verified, videos, scans, comments, tribes] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", today.toISOString()),
      supabase.from("feed_posts").select("*", { count: "exact", head: true }),
      supabase.from("feed_posts").select("*", { count: "exact", head: true }).gte("created_at", week.toISOString()),
      supabase.from("livestock_listings").select("*", { count: "exact", head: true }),
      supabase.from("livestock_listings").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("verified", true),
      supabase.from("videos").select("*", { count: "exact", head: true }),
      supabase.from("ai_scans").select("*", { count: "exact", head: true }),
      supabase.from("feed_comments").select("*", { count: "exact", head: true }),
      supabase.from("tribes").select("*", { count: "exact", head: true }),
    ]);

    const { data: all } = await supabase.from("profiles").select("created_at");
    const buckets: any[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      const count = (all || []).filter((u: any) => (u.created_at || "").slice(0, 10) === key).length;
      buckets.push({ label: d.toLocaleDateString("en-NG", { weekday: "short" }), count });
    }

    setS({
      users: users.count || 0,
      usersToday: usersToday.count || 0,
      posts: posts.count || 0,
      postsWeek: postsWeek.count || 0,
      listings: listings.count || 0,
      activeListings: activeListings.count || 0,
      verified: verified.count || 0,
      videos: videos.count || 0,
      scans: scans.count || 0,
      comments: comments.count || 0,
      tribes: tribes.count || 0,
    });
    setDays(buckets);
  }

  useEffect(() => { load(); }, []);

  if (!s) return <p className="text-center text-gray-500 py-10">Crunching numbers…</p>;
  const max = Math.max(1, ...days.map((d) => d.count));

  const Card = ({ n, label, icon }: any) => (
    <div className="glass-card p-3 rounded-2xl text-center">
      <p className="text-xl font-extrabold text-forest-800">{n}</p>
      <p className="text-[9px] text-gray-500 font-bold">{icon} {label}</p>
    </div>
  );

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-extrabold mb-1">📊 Business Analytics</h1>
      <p className="text-xs text-gray-500 mb-4">Your platform at a glance — updated live.</p>

      <div className="grid grid-cols-3 gap-2">
        <Card n={s.users} label="Farmers" icon="👥" />
        <Card n={s.usersToday} label="Joined Today" icon="🆕" />
        <Card n={s.verified} label="Verified" icon="✅" />
        <Card n={s.posts} label="Posts" icon="📣" />
        <Card n={s.postsWeek} label="Posts (7d)" icon="🔥" />
        <Card n={s.comments} label="Comments" icon="💬" />
        <Card n={s.videos} label="Videos" icon="🎬" />
        <Card n={s.scans} label="AI Scans" icon="🩺" />
        <Card n={s.tribes} label="Tribes" icon="🌾" />
        <Card n={s.listings} label="Listings" icon="🐄" />
        <Card n={s.activeListings} label="Live Listings" icon="🛒" />
      </div>

      <div className="glass-card p-4 rounded-2xl mt-4">
        <p className="text-sm font-bold mb-3">🆕 Signups — last 7 days</p>
        <div className="flex items-end gap-2 h-28">
          {days.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[9px] font-bold text-forest-700">{d.count}</span>
              <div className="w-full bg-green-600 rounded-t-lg" style={{ height: `${(d.count / max) * 80 + 4}px` }} />
              <span className="text-[8px] text-gray-400 font-bold">{d.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}