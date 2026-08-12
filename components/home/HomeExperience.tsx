"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import QuickScanWidget from "@/components/home/QuickScanWidget";
import { currencySymbol } from "@/lib/currency";

const TIPS = [
  "Give rabbits fresh water daily — a doe with kits drinks 2x more.",
  "Plant marigold around your vegetable garden to repel pests naturally.",
  "Deworm goats every 3 months to keep them gaining weight.",
  "Store grains with dried neem leaves to keep weevils away.",
  "Vaccinate chickens against Newcastle disease every 3 months.",
  "Turn kitchen waste into liquid fertilizer: soak 7 days, dilute 1:10.",
];

const PERSONAS: any = {
  farmer: { emoji: "👨‍🌾", label: "I'm a Farmer", tag: "Diagnose diseases with your camera, sell at your price & get paid to learn.", cta: { href: "/scanner", text: "🩺 Try the AI Doctor now" } },
  buyer: { emoji: "🛒", label: "I Want to Buy", tag: "Trusted farmers, verified ✅ sellers, real reviews — shop farm-fresh with confidence.", cta: { href: "/market", text: "🐄 Browse the Market" } },
  business: { emoji: "💼", label: "I'm a Business", tag: "Put your brand under every video & post — thousands of farmers see you daily.", cta: { href: "/ads/submit", text: "📢 Advertise Here" } },
  creator: { emoji: "🎬", label: "I'm a Creator", tag: "Post videos, publish e-books, keep 70% of sales & earn from the ad pool monthly.", cta: { href: "/ebooks", text: "💰 Start Earning" } },
};

export default function HomeExperience({ d }: { d: any }) {
  const [persona, setPersona] = useState<string | null>(null);
  const [demo, setDemo] = useState<"" | "scan" | "result">("");
  const [left, setLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    setPersona(localStorage.getItem("persona"));
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      const now = new Date();
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const diff = Math.max(0, end.getTime() - now.getTime());
      setLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor(diff / 3600000) % 24,
        m: Math.floor(diff / 60000) % 60,
        s: Math.floor(diff / 1000) % 60,
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (demo !== "scan") return;
    const t = setTimeout(() => setDemo("result"), 2200);    return () => clearTimeout(t);
  }, [demo]);

  function pick(p: string) {
    localStorage.setItem("persona", p);
    setPersona(p);
  }

  const P = persona ? PERSONAS[persona] : null;
  const TIP = TIPS[Math.floor(Date.now() / 86400000) % TIPS.length];

  const tickerItems = [
    ...d.tickerPosts.map((n: string) => `📣 ${n} just posted on the Timeline`),
    ...d.tickerSales.map((s: any) => `💰 ${s.name} SOLD: ${s.title}`),
    `👥 ${d.joinedToday} new farmer${d.joinedToday === 1 ? "" : "s"} joined today`,
    `✅ ${d.verifiedCount} verified members share this month's ad pool`,
  ];

  const hotVisible = d.user ? d.hot : d.hot.slice(0, 3);
  const hotLocked = d.user ? [] : d.hot.slice(3, 6);

  return (
    <div className="pb-24">
      {/* HERO */}
      <div className="bg-gradient-to-b from-forest-600 to-forest-800 text-white p-6 pb-10 rounded-b-3xl">
        {!P ? (
          <>
            <h1 className="text-2xl font-extrabold leading-tight mb-3">Welcome! Who are you? 👇</h1>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(PERSONAS).map(([k, v]: any) => (
                <button key={k} onClick={() => pick(k)} className="bg-white/10 hover:bg-white/20 p-3 rounded-2xl text-left active:scale-95 transition-transform">
                  <span className="text-2xl">{v.emoji}</span>
                  <p className="text-sm font-bold mt-1">{v.label}</p>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-extrabold leading-tight mb-2">{P.emoji} {P.tag}</h1>
            <Link href={P.cta.href} className="inline-block bg-amber-400 text-forest-900 px-4 py-2 rounded-xl font-bold text-sm mt-2">{P.cta.text} →</Link>
            <button onClick={() => setPersona("")} className="block text-[10px] text-forest-200 underline mt-2">change</button>
          </>
        )}
        <div className="grid grid-cols-3 gap-2 text-center mt-5">
          <div className="bg-white/10 rounded-xl p-2"><p className="text-lg font-bold">{d.profileCount}</p><p className="text-[10px] text-forest-100">Farmers</p></div>
          <div className="bg-white/10 rounded-xl p-2"><p className="text-lg font-bold">{d.tribeCount}</p><p className="text-[10px] text-forest-100">Tribes</p></div>
          <div className="bg-white/10 rounded-xl p-2"><p className="text-lg font-bold">{d.listingCount}</p><p className="text-[10px] text-forest-100">Live Listings</p></div>
        </div>
      </div>
      {/* LIVE ACTIVITY TICKER */}
      <div className="bg-black overflow-hidden py-2">
        <p className="ftb-marquee text-xs font-bold text-green-400 px-4">
          {tickerItems.join("   ···   ")}
        </p>
      </div>

      {/* MAGIC DEMO */}
      <div className="p-4 -mt-2">
        <button onClick={() => setDemo("scan")} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-2xl font-bold shadow-lg active:scale-[0.98]">
          🩺 See the magic — watch a real diagnosis in 3 seconds (no signup)
        </button>
      </div>

      {demo && (
        <div className="fixed inset-0 z-50 bg-forest-900/95 p-4 overflow-y-auto" onClick={() => demo === "result" && setDemo("")}>
          <div className="max-w-md mx-auto pt-10">
            {demo === "scan" ? (
              <div className="text-center">
                <p className="text-6xl animate-pulse">🐔</p>
                <div className="h-1 bg-green-400 rounded-full mt-6 animate-pulse" />
                <p className="text-white font-bold mt-4">🔬 AI analyzing...</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-white font-extrabold text-center text-lg mb-4">🩺 AI Agri-Doctor Report</p>
                <div className="rounded-xl border-l-4 border-red-400 bg-red-50 p-3"><p className="text-xs font-bold text-red-700">DIAGNOSIS</p><p className="text-sm">Coccidiosis (early stage) — likely in your flock.</p></div>
                <div className="rounded-xl border-l-4 border-amber-400 bg-amber-50 p-3"><p className="text-xs font-bold text-amber-700">SEVERITY</p><p className="text-sm">Medium — act within 48 hours.</p></div>
                <div className="rounded-xl border-l-4 border-green-500 bg-green-50 p-3"><p className="text-xs font-bold text-green-700">TREATMENT</p><p className="text-sm">• Amprolium in water for 5 days<br />• Clean & dry the pen today<br />• Isolate badly affected birds</p></div>
                <p className="text-center text-forest-200 text-xs">This is a SAMPLE. Register FREE to scan YOUR own photos! 🌾</p>
                <div className="flex gap-2">
                  <Link href="/login" className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold text-center">🔓 Try It On My Farm — Free</Link>
                  <button onClick={() => setDemo("")} className="px-4 bg-white/10 text-white rounded-xl font-bold">Close</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI DOCTOR WIDGET */}
      <div className="p-4">
        <QuickScanWidget />
      </div>

      {/* QUICK ACTIONS */}
      <div className="px-4 mt-2">
        <div className="glass-card p-4 rounded-2xl shadow-lg grid grid-cols-4 gap-2 text-center">
          <Link href="/scanner" className="bg-green-50 p-2 rounded-xl"><span className="text-2xl">🩺</span><p className="text-[10px] font-bold text-green-800">AI Doctor</p></Link>          <Link href="/market" className="bg-amber-50 p-2 rounded-xl"><span className="text-2xl">🐄</span><p className="text-[10px] font-bold text-amber-800">Market</p></Link>
          <Link href="/ebooks" className="bg-blue-50 p-2 rounded-xl"><span className="text-2xl">📚</span><p className="text-[10px] font-bold text-blue-800">E-books</p></Link>
          <Link href="/leaderboard" className="bg-purple-50 p-2 rounded-xl"><span className="text-2xl">🏆</span><p className="text-[10px] font-bold text-purple-800">Top Farmers</p></Link>
        </div>
      </div>

      {/* ONBOARDING */}
      {d.onboarding && (
        <div className="px-4 mt-4">
          <div className="glass-card p-4 rounded-2xl border-2 border-green-300">
            <div className="flex items-center justify-between mb-2">
              <p className="font-bold text-sm">🚀 Get Started</p>
              <span className="text-xs font-bold text-green-700">{d.onboarding.doneCount}/{d.onboarding.steps.length} done</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: `${(d.onboarding.doneCount / d.onboarding.steps.length) * 100}%` }} />
            </div>
            <div className="space-y-1">
              {d.onboarding.steps.map((st: any) => (
                <Link key={st.label} href={st.href} className={`flex items-center gap-2 p-2 rounded-xl text-sm font-semibold ${st.done ? "text-gray-400 line-through" : "bg-green-50 text-green-800"}`}>
                  <span>{st.done ? "✅" : "⬜"}</span> {st.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TIMELINE BANNER */}
      <div className="px-4 mt-4">
        <Link href="/feed" className="block bg-gradient-to-r from-amber-500 to-orange-600 text-white p-4 rounded-2xl shadow-lg active:scale-[0.98] transition-transform">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📣</span>
            <div className="flex-1">
              <p className="font-bold">Farmer Timeline</p>
              <p className="text-xs text-amber-100">Post, like, comment, share — EVERY action earns points = monthly money!</p>
            </div>
            <span className="text-xl">→</span>
          </div>
        </Link>
      </div>

      {/* 🔥 FOR YOU with LOCK */}
      <div className="px-4 mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">🔥 For You — Top Posts</h2>
          <span className="text-[10px] text-gray-500 font-semibold">🤖 smart-ranked</span>
        </div>
        <div className="space-y-3">
          {hotVisible.map((p: any, i: number) => (            <div key={p.id} className="glass-card p-3 rounded-2xl">
              <div className="flex items-center gap-2 mb-1">
                <Link href={`/farmer/${p.author_id}`}>
                  {p.author_avatar ? (
                    <img src={p.author_avatar} className="w-8 h-8 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center text-xs font-bold text-green-800">{(p.author_name || "?")[0]}</div>
                  )}
                </Link>
                <Link href={`/farmer/${p.author_id}`} className="font-bold text-sm text-forest-800 hover:underline">{p.author_name || "Farmer"}</Link>
                {p.author_verified && <span className="text-sky-500 text-xs">✅</span>}
                <span className="ml-auto text-[10px] font-bold text-amber-600">#{i + 1} 🔥</span>
              </div>
              <Link href="/feed" className="block text-sm text-gray-800 line-clamp-3 whitespace-pre-line">{p.content}</Link>
              {p.image_url && (
                <Link href="/feed"><img src={p.image_url} alt="" className="mt-2 w-full h-40 object-cover rounded-xl" /></Link>
              )}
              <p className="text-[10px] text-gray-500 mt-2">❤️ {p.likes} · 💬 {p.comments} · 👁️ {p.views_count}</p>
            </div>
          ))}

          {hotLocked.length > 0 && (
            <div className="relative">
              <div className="space-y-3 blur-sm select-none pointer-events-none">
                {hotLocked.map((p: any) => (
                  <div key={p.id} className="glass-card p-3 rounded-2xl">
                    <p className="font-bold text-sm">{p.author_name}</p>
                    <p className="text-sm text-gray-800 line-clamp-2">{p.content}</p>
                  </div>
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Link href="/login" className="bg-green-600 text-white px-6 py-3 rounded-2xl font-bold shadow-xl text-center">
                  🔒 Register FREE to unlock more posts<br />
                  <span className="text-[10px] font-semibold text-green-100">+ claim your 50 welcome points 🎁</span>
                </Link>
              </div>
            </div>
          )}
          {d.hot.length === 0 && <p className="text-sm text-gray-500">No posts yet — be the first on the For You board!</p>}
        </div>
      </div>

      {/* 💵 CREATOR POOL COUNTDOWN */}
      <div className="px-4 mt-6">
        <div className="bg-gradient-to-r from-green-700 to-forest-800 text-white p-4 rounded-2xl text-center">
          <p className="text-xs font-bold text-green-200">💵 THIS MONTH'S CREATOR POOL — shared by verified members</p>
          <div className="flex justify-center gap-3 mt-2 font-mono text-lg font-extrabold">
            <span>{left.d}d</span><span>{left.h}h</span><span>{left.m}m</span><span className="text-amber-300">{left.s}s</span>
          </div>          <p className="text-[10px] text-green-200 mt-1">left to earn points & claim your share · ✅ verified members get +10%</p>
          <Link href="/wallet" className="inline-block bg-amber-400 text-forest-900 px-5 py-2 rounded-xl font-bold text-xs mt-2">See How It Works →</Link>
        </div>
      </div>

      {/* TIP OF THE DAY */}
      <div className="px-4 mt-4">
        <div className="glass-card p-4 rounded-2xl border-l-4 border-amber-400">
          <p className="text-xs font-bold text-amber-600 mb-1">💡 TIP OF THE DAY</p>
          <p className="text-sm text-gray-800">{TIP}</p>
        </div>
      </div>

      {/* LATEST INSIGHTS */}
      <div className="px-4 mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">📰 Latest Insights</h2>
          <Link href="/blog" className="text-xs font-semibold text-green-700">View all →</Link>
        </div>
        <div className="space-y-3">
          {d.blogs.map((b: any) => (
            <Link key={b.slug} href={`/blog/${b.slug}`} className="glass-card p-3 rounded-2xl flex gap-3 items-center">
              {b.cover_image_url ? (
                <img src={b.cover_image_url} alt={b.title} className="w-16 h-16 object-cover rounded-xl flex-shrink-0" />
              ) : (
                <div className="w-16 h-16 bg-forest-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">📰</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm line-clamp-2">{b.title}</p>
                <p className="text-[10px] text-gray-500 mt-1">{b.category} · 👁️ {b.views_count || 0}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* TRENDING TRIBES */}
      <div className="mt-8">
        <div className="flex items-center justify-between px-4 mb-3">
          <h2 className="text-lg font-bold">🌾 Trending Tribes</h2>
          <Link href="/communities" className="text-xs font-semibold text-green-700">View all →</Link>
        </div>
        <div className="flex gap-3 overflow-x-auto px-4 pb-2">
          {d.tribes.map((t: any) => (
            <Link key={t.slug} href={`/communities/${t.slug}`} className="glass-card p-3 rounded-2xl w-36 flex-shrink-0 text-center">
              {t.image_url ? (
                <img src={t.image_url} alt={t.name} className="w-full h-20 object-cover rounded-xl mb-2" />
              ) : (
                <div className="w-full h-20 bg-forest-100 rounded-xl flex items-center justify-center text-3xl mb-2">{t.icon}</div>
              )}              <p className="font-bold text-xs line-clamp-1">{t.name}</p>
              <p className="text-[10px] text-gray-500">👥 {t.member_count || 0}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* FRESH FROM MARKET */}
      <div className="px-4 mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">🐄 Fresh from Market</h2>
          <Link href="/market" className="text-xs font-semibold text-green-700">View all →</Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {d.listings.map((l: any) => (
            <Link key={l.id} href={`/market/${l.id}`} className="glass-card p-3 rounded-2xl">
              {l.images?.[0] ? (
                <img src={l.images[0]} alt={l.title} className="w-full h-24 object-cover rounded-xl mb-2" />
              ) : (
                <div className="w-full h-24 bg-forest-100 rounded-xl flex items-center justify-center text-3xl mb-2">🐄</div>
              )}
              <p className="font-semibold text-xs line-clamp-1">{l.title}</p>
              <p className="text-sm font-bold text-green-700 mt-1">{currencySymbol(l.currency)}{Number(l.price).toLocaleString()}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* TOP FARMERS */}
      <div className="px-4 mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">🏆 Top Farmers</h2>
          <Link href="/leaderboard" className="text-xs font-semibold text-green-700">Full board →</Link>
        </div>
        <div className="glass-card p-4 rounded-2xl space-y-2">
          {d.leaders.slice(0, 3).map((u: any, i: number) => (
            <Link key={i} href={`/farmer/${u.id}`} className="flex items-center gap-3">
              <span className="text-lg">{["🥇", "", ""][i]}</span>
              <div className="w-9 h-9 rounded-full bg-green-200 flex items-center justify-center font-bold text-green-800">{(u.full_name || "?")[0]}</div>
              <p className="flex-1 font-semibold text-sm truncate">{u.full_name || "Farmer"}</p>
              <span className="text-xs font-bold text-amber-600">{u.points} pts</span>
            </Link>
          ))}
        </div>
      </div>

      {/* EBOOK TEASER */}
      {d.ebooks.length > 0 && (
        <div className="px-4 mt-8">
          <div className="flex items-center justify-between mb-3">            <h2 className="text-lg font-bold">📚 Learn from E-books</h2>
            <Link href="/ebooks" className="text-xs font-semibold text-green-700">Store →</Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {d.ebooks.map((b: any) => (
              <Link key={b.id} href="/ebooks" className="glass-card p-3 rounded-2xl w-32 flex-shrink-0">
                {b.cover_url ? (
                  <img src={b.cover_url} alt={b.title} className="w-full h-36 object-cover rounded-xl mb-2" />
                ) : (
                  <div className="w-full h-36 bg-forest-100 rounded-xl flex items-center justify-center text-3xl mb-2">📚</div>
                )}
                <p className="font-semibold text-xs line-clamp-2">{b.title}</p>
                <p className="text-xs font-bold text-green-700 mt-1">{currencySymbol(b.currency)}{Number(b.price).toLocaleString()}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* INSTALL CTA */}
      <div className="p-4 mt-8">
        <div className="bg-gradient-to-r from-green-600 to-forest-700 text-white p-5 rounded-2xl text-center">
          <p className="text-lg font-bold m