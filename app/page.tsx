import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import QuickScanWidget from "@/components/home/QuickScanWidget";
import { currencySymbol } from "@/lib/currency";

export default async function HomePage() {
  const supabase = createClient();

  const [blogs, tribes, listings, ebooks, leaders, profileCount, tribeCount, listingCount] = await Promise.all([
    supabase.from("blogs").select("title, slug, cover_image_url, category, views_count").eq("status", "published").order("published_at", { ascending: false }).limit(4),
    supabase.from("tribes").select("name, slug, icon, image_url, member_count").order("member_count", { ascending: false }).limit(6),
    supabase.from("livestock_listings").select("id, title, price, currency, images").eq("status", "active").order("created_at", { ascending: false }).limit(4),
    supabase.from("ebooks").select("id, title, price, currency, cover_url").eq("is_active", true).limit(3),
    supabase.rpc("public_leaderboard"),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("tribes").select("*", { count: "exact", head: true }),
    supabase.from("livestock_listings").select("*", { count: "exact", head: true }).eq("status", "active"),
  ]);

  return (
    <div className="pb-24">
      {/* HERO */}
      <div className="bg-gradient-to-b from-forest-600 to-forest-800 text-white p-6 pb-10 rounded-b-3xl">
        <h1 className="text-2xl font-extrabold leading-tight mb-2">
          Farm Smarter. Sell Faster. Grow Together. 🌾
        </h1>
        <p className="text-sm text-forest-100 mb-5">
          AI crop & animal doctor · farmer communities · livestock market · e-book library — all in one app.
        </p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white/10 rounded-xl p-2"><p className="text-lg font-bold">{profileCount.count || 0}</p><p className="text-[10px] text-forest-100">Farmers</p></div>
          <div className="bg-white/10 rounded-xl p-2"><p className="text-lg font-bold">{tribeCount.count || 0}</p><p className="text-[10px] text-forest-100">Tribes</p></div>
          <div className="bg-white/10 rounded-xl p-2"><p className="text-lg font-bold">{listingCount.count || 0}</p><p className="text-[10px] text-forest-100">Live Listings</p></div>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="p-4 -mt-4">
        <div className="glass-card p-4 rounded-2xl shadow-lg grid grid-cols-4 gap-2 text-center">
          <Link href="/scanner" className="bg-green-50 p-2 rounded-xl"><span className="text-2xl">🩺</span><p className="text-[10px] font-bold text-green-800">AI Doctor</p></Link>
          <Link href="/market" className="bg-amber-50 p-2 rounded-xl"><span className="text-2xl">🐄</span><p className="text-[10px] font-bold text-amber-800">Market</p></Link>
          <Link href="/ebooks" className="bg-blue-50 p-2 rounded-xl"><span className="text-2xl">📚</span><p className="text-[10px] font-bold text-blue-800">E-books</p></Link>
          <Link href="/leaderboard" className="bg-purple-50 p-2 rounded-xl"><span className="text-2xl">🏆</span><p className="text-[10px] font-bold text-purple-800">Top Farmers</p></Link>
        </div>
      </div>

      {/* QUICK SCAN */}
      <div className="px-4 mt-2">
        <QuickScanWidget />
      </div>
      {/* LATEST INSIGHTS */}
      <div className="px-4 mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">📰 Latest Insights</h2>
          <Link href="/blog" className="text-xs font-semibold text-green-700">View all →</Link>
        </div>
        <div className="space-y-3">
          {(blogs.data || []).map((b: any) => (
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
          {(tribes.data || []).map((t: any) => (
            <Link key={t.slug} href={`/communities/${t.slug}`} className="glass-card p-3 rounded-2xl w-36 flex-shrink-0 text-center">
              {t.image_url ? (
                <img src={t.image_url} alt={t.name} className="w-full h-20 object-cover rounded-xl mb-2" />
              ) : (
                <div className="w-full h-20 bg-forest-100 rounded-xl flex items-center justify-center text-3xl mb-2">{t.icon}</div>
              )}
              <p className="font-bold text-xs line-clamp-1">{t.name}</p>
              <p className="text-[10px] text-gray-500">👥 {t.member_count || 0}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* FRESH FROM MARKET */}
      <div className="px-4 mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">🐄 Fresh from Market</h2>
          <Link href="/market" className="text-xs font-semibold text-green-700">View all →</Link>        </div>
        <div className="grid grid-cols-2 gap-3">
          {(listings.data || []).map((l: any) => (
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
          {(leaders.data || []).slice(0, 3).map((u: any, i: number) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-lg">{["🥇", "🥈", ""][i]}</span>
              <div className="w-9 h-9 rounded-full bg-green-200 flex items-center justify-center font-bold text-green-800">
                {(u.full_name || "?")[0]}
              </div>
              <p className="flex-1 font-semibold text-sm truncate">{u.full_name || "Farmer"}</p>
              <span className="text-xs font-bold text-amber-600">{u.points} pts</span>
            </div>
          ))}
        </div>
      </div>

      {/* EBOOK TEASER */}
      {(ebooks.data || []).length > 0 && (
        <div className="px-4 mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">📚 Learn from E-books</h2>
            <Link href="/ebooks" className="text-xs font-semibold text-green-700">Store →</Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {(ebooks.data || []).map((b: any) => (
              <Link key={b.id} href="/ebooks" className="glass-card p-3 rounded-2xl w-32 flex-shrink-0">
                {b.cover_url ? (
                  <img src={b.cover_url} alt={b.title} className="w-full h-36 object-cover rounded-xl mb-2" />
                ) : (
                  <div className="w-full h-36 bg-forest-100 rounded-xl flex items-center justify-center text-3xl mb-2">📚</div>                )}
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
          <p className="text-lg font-bold mb-1">📲 Take us everywhere</p>
          <p className="text-xs text-green-100 mb-3">Install Farming Tech & Business on your phone — works like a real app, even offline.</p>
          <p className="text-[10px] text-green-200">Menu (⋮) → "Add to Home screen" / "Install app"</p>
        </div>
      </div>
    </div>
  );
}