"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { currencySymbol } from "@/lib/currency";

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<any>(null);
  const [searched, setSearched] = useState(false);
  const [busy, setBusy] = useState(false);

  async function doSearch(e?: any) {
    e?.preventDefault();
    const query = q.trim();
    if (!query) return;
    setBusy(true);
    const supabase = createClient();
    const like = `%${query}%`;
    const [blogs, listings, tribes, ebooks] = await Promise.all([
      supabase.from("blogs").select("title, slug, excerpt, cover_image_url, category").eq("status", "published").ilike("title", like).limit(5),
      supabase.from("livestock_listings").select("id, title, price, currency, images").eq("status", "active").ilike("title", like).limit(5),
      supabase.from("tribes").select("name, slug, icon, image_url, member_count").ilike("name", like).limit(5),
      supabase.from("ebooks").select("id, title, price, currency, cover_url").eq("is_active", true).ilike("title", like).limit(5),
    ]);
    setResults({ blogs: blogs.data || [], listings: listings.data || [], tribes: tribes.data || [], ebooks: ebooks.data || [] });
    setSearched(true);
    setBusy(false);
  }

  const total = results ? results.blogs.length + results.listings.length + results.tribes.length + results.ebooks.length : 0;

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🔍 Search</h1>
      <form onSubmit={doSearch} className="flex gap-2 mb-6">
        <input className="flex-1 p-3 rounded-xl border border-gray-200 bg-white/70" placeholder="Search blogs, livestock, tribes, e-books..." value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="bg-green-600 text-white px-4 rounded-xl font-semibold" disabled={busy}>{busy ? "..." : "Go"}</button>
      </form>

      {searched && total === 0 && <p className="text-center text-gray-500 py-10">No results for "{q}".</p>}

      {results && results.blogs.length > 0 && (
        <section className="mb-6">
          <h2 className="font-bold mb-2">📝 Blogs</h2>
          <div className="space-y-2">
            {results.blogs.map((b: any) => (
              <a key={b.slug} href={`/blog/${b.slug}`} className="glass-card p-3 rounded-xl flex gap-3 items-center">
                {b.cover_image_url && <img src={b.cover_image_url} alt="" className="w-12 h-12 object-cover rounded-lg" />}
                <div><p className="font-semibold text-sm">{b.title}</p><p className="text-xs text-gray-500">{b.category}</p></div>
              </a>
            ))}
          </div>
        </section>
      )}

      {results && results.listings.length > 0 && (
        <section className="mb-6">
          <h2 className="font-bold mb-2">🐄 Livestock & Goods</h2>
          <div className="space-y-2">
            {results.listings.map((l: any) => (
              <a key={l.id} href={`/market/${l.id}`} className="glass-card p-3 rounded-xl flex gap-3 items-center">
                {l.images?.[0] && <img src={l.images[0]} alt="" className="w-12 h-12 object-cover rounded-lg" />}
                <div><p className="font-semibold text-sm">{l.title}</p><p className="text-xs text-green-700 font-bold">{currencySymbol(l.currency)}{Number(l.price).toLocaleString()}</p></div>
              </a>
            ))}
          </div>
        </section>
      )}

      {results && results.tribes.length > 0 && (
        <section className="mb-6">
          <h2 className="font-bold mb-2">🌾 Tribes</h2>
          <div className="space-y-2">
            {results.tribes.map((t: any) => (
              <a key={t.slug} href={`/communities/${t.slug}`} className="glass-card p-3 rounded-xl flex gap-3 items-center">
                {t.image_url ? <img src={t.image_url} alt="" className="w-12 h-12 object-cover rounded-lg" /> : <span className="text-2xl">{t.icon}</span>}
                <div><p className="font-semibold text-sm">{t.name}</p><p className="text-xs text-gray-500">👥 {t.member_count} members</p></div>
              </a>
            ))}
          </div>
        </section>
      )}

      {results && results.ebooks.length > 0 && (
        <section className="mb-6">
          <h2 className="font-bold mb-2">📚 E-books</h2>
          <div className="space-y-2">
            {results.ebooks.map((b: any) => (
              <a key={b.id} href="/ebooks" className="glass-card p-3 rounded-xl flex gap-3 items-center">
                {b.cover_url && <img src={b.cover_url} alt="" className="w-10 h-12 object-cover rounded" />}
                <div><p className="font-semibold text-sm">{b.title}</p><p className="text-xs text-green-700 font-bold">{currencySymbol(b.currency)}{Number(b.price).toLocaleString()}</p></div>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}