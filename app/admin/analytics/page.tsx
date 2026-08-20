"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function countBy(list: any[], key: (x: any) => string): [string, number][] {
  const m: Record<string, number> = {};
  list.forEach((x) => {
    const k = key(x) || "unknown";
    m[k] = (m[k] || 0) + 1;
  });
  return Object.keys(m).map((k) => [k, m[k]] as [string, number]).sort((a, b) => b[1] - a[1]);
}

export default function AdminAnalyticsPage() {
  const [s, setS] = useState<any>(null);
  const [days, setDays] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);

  async function load() {
    const supabase = createClient();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const week = new Date(Date.now() - 7 * 86400000);

    const [users, usersToday, posts, postsWeek, listings, activeListings, verified, videos, scans, comments, tribes, visitsData] = await Promise.all([
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
      supabase.from("visits").select("*, profiles(full_name)").order("created_at", { ascending: false }).limit(300),
    ]);

    const v = visitsData || [];
    setVisits(v);

    const { data: all } = await supabase.from("profiles").select("created_at");
    const buckets: any[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      buckets.push({
        label: d.toLocaleDateString("en-NG", { weekday: "short" }),
        signups: (all || []).filter((u: any) => (u.created_at || "").slice(0, 10) === key).length,        visits: v.filter((x: any) => (x.created_at || "").slice(0, 10) === key).length,
      });
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

  const max = Math.max(1, ...days.map((d) => d.signups), ...days.map((d) => d.visits));
  const today = new Date().toISOString().slice(0, 10);
  const todayVisits = visits.filter((v) => (v.created_at || "").slice(0, 10) === today);
  const registeredVisits = visits.filter((v) => v.user_id);
  const sources = countBy(visits, (v) => v.source);
  const countries = countBy(visits, (v) => v.country);
  const pages = countBy(visits, (v) => (v.path || "/").split("?")[0]);
  const devices = countBy(visits, (v) => v.device);

  const Card = ({ n, label, icon }: any) => (
    <div className="glass-card p-3 rounded-2xl text-center">
      <p className="text-xl font-extrabold text-forest-800">{n}</p>
      <p className="text-[9px] text-gray-500 font-bold">{icon} {label}</p>
    </div>
  );

  const Bar = ({ label, n }: any) => (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-24 truncate font-bold text-gray-600">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className="bg-green-600 h-2 rounded-full" style={{ width: `${(n / (visits.length || 1)) * 100}%` }} />
      </div>
      <span className="w-8 text-right font-bold text-forest-700">{n}</span>
    </div>
  );
  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-extrabold mb-1">📊 Business Analytics + Visitor Intelligence</h1>
      <p className="text-xs text-gray-500 mb-4">Your whole platform at a glance — members, content, money signals AND every visitor tracked live.</p>

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
        <Card n={todayVisits.length} label="Visits Today" icon="🛰️" />
      </div>

      <div className="glass-card p-4 rounded-2xl mt-4">
        <p className="text-sm font-bold mb-3">📈 Last 7 days — signups vs visits</p>
        <div className="flex items-end gap-2 h-28">
          {days.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[9px] font-bold text-forest-700">{d.visits}</span>
              <div className="w-full bg-green-600 rounded-t-lg" style={{ height: `${(d.visits / max) * 70 + 4}px` }} />
              <div className="w-full bg-amber-400 rounded-t-lg -mt-0.5" style={{ height: `${(d.signups / max) * 40 + 3}px` }} />
              <span className="text-[8px] text-gray-400 font-bold">{d.label}</span>
            </div>
          ))}
        </div>
        <p className="text-[9px] text-gray-400 mt-2">🟩 visits · 🟨 signups</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="glass-card p-3 rounded-2xl space-y-2">
          <p className="text-xs font-extrabold text-gray-500">📡 TRAFFIC SOURCES</p>
          {sources.slice(0, 6).map(([l, n]) => <Bar key={l} label={l} n={n} />)}
          {sources.length === 0 && <p className="text-[10px] text-gray-400">No data yet.</p>}
        </div>
        <div className="glass-card p-3 rounded-2xl space-y-2">
          <p className="text-xs font-extrabold text-gray-500">🌍 COUNTRIES</p>
          {countries.slice(0, 6).map(([l, n]) => <Bar key={l} label={l} n={n} />)}
          {countries.length === 0 && <p className="text-[10px] text-gray-400">No data yet.</p>}
        </div>
        <div className="glass-card p-3 rounded-2xl space-y-2">
          <p className="text-xs font-extrabold text-gray-500">🚪 LANDING PAGES</p>
          {pages.slice(0, 6).map(([l, n]) => <Bar key={l} label={l} n={n} />)}
          {pages.length === 0 && <p className="text-[10px] text-gray-400">No data yet.</p>}        </div>
        <div className="glass-card p-3 rounded-2xl space-y-2">
          <p className="text-xs font-extrabold text-gray-500">📱 DEVICES</p>
          {devices.map(([l, n]) => <Bar key={l} label={l} n={n} />)}
          {devices.length === 0 && <p className="text-[10px] text-gray-400">No data yet.</p>}
        </div>
      </div>

      <h2 className="font-bold mt-6 mb-2">🕵️ Recent visitors — who, where, when, what they opened</h2>
      <p className="text-[10px] text-gray-500 mb-2">✅ = registered member · 👤 = guest you can still convert · total tracked: {visits.length} · registered visits: {registeredVisits.length}</p>
      <div className="space-y-2">
        {visits.slice(0, 60).map((v) => (
          <div key={v.id} className="glass-card p-3 rounded-2xl">
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-extrabold px-2 py-1 rounded-full ${v.user_id ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {v.user_id ? "✅ " + (v.profiles?.full_name || "Member") : "👤 GUEST"}
              </span>
              <span className="text-[10px] text-gray-500 ml-auto">{new Date(v.created_at).toLocaleString()}</span>
            </div>
            <p className="text-xs font-bold mt-1">🌍 {v.country}{v.city ? ", " + v.city : ""} · 📡 {v.source} · 📱 {v.device} / {v.browser}</p>
            <p className="text-[10px] text-forest-700 font-mono mt-1">→ opened: {v.path}</p>
            {v.referrer && <p className="text-[9px] text-gray-400 truncate mt-0.5">came from: {v.referrer}</p>}
          </div>
        ))}
        {visits.length === 0 && <p className="text-sm text-gray-500 text-center py-6">No visits recorded yet — share any link and watch them appear here live.</p>}
      </div>
    </div>
  );
}