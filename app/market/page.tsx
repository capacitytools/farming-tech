"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { uploadToCloudinary } from "@/lib/upload";
import { currencySymbol } from "@/lib/currency";

export default function MarketPage() {
  const [user, setUser] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", price: "", location: "" });
  const [images, setImages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [loaded, setLoaded] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data: { user: u } } = await supabase.auth.getUser();
    setUser(u);
    const { data } = await supabase.from("livestock_listings").select("*, profiles(full_name, avatar_url, verified)").eq("status", "active").order("created_at", { ascending: false });
    setListings(data || []);
    setLoaded(true);
  }

  useEffect(() => { load(); }, []);

  async function uploadImage(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadToCloudinary(file, "market");
      setImages((prev) => [...prev, url]);
    } catch (err: any) {
      alert("Upload failed: " + (err && err.message ? err.message : "check connection and try again"));
    }
  }

  async function publish(e: any) {
    e.preventDefault();
    if (!user) return alert("Log in to sell.");
    if (!form.title.trim() || !form.price) return alert("Add title and price.");
    setBusy(true);
    const supabase = createClient();
    await supabase.from("livestock_listings").insert({
      seller_id: user.id,
      title: form.title.trim(),
      description: form.description.trim(),      price: Number(form.price),
      currency: "NGN",
      location: form.location.trim() || null,
      images,
      status: "active",
    });
    setMsg("✅ Listing live! Buyers can see it now.");
    setForm({ title: "", description: "", price: "", location: "" });
    setImages([]);
    setShowForm(false);
    setTimeout(() => setMsg(""), 2500);
    await load();
    setBusy(false);
  }

  async function markSold(id: string) {
    const supabase = createClient();
    await supabase.from("livestock_listings").update({ status: "sold" }).eq("id", id);
    load();
  }

  async function removeListing(id: string) {
    if (!confirm("Remove this listing?")) return;
    const supabase = createClient();
    await supabase.from("livestock_listings").delete().eq("id", id);
    load();
  }

  if (!loaded) return <p className="text-center text-gray-500 py-10">Loading…</p>;

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-extrabold">🐄 Marketplace</h1>
        <button onClick={() => setShowForm(!showForm)} className="text-xs font-bold bg-forest-600 text-white px-3 py-2 rounded-full">➕ Sell Something</button>
      </div>
      <p className="text-xs text-gray-500 mb-4">Farm-fresh animals & goods directly from farmers. Tap any listing for full details & offers.</p>
      {msg && <p className="text-xs font-bold text-green-700 mb-3">{msg}</p>}

      {showForm && (
        <form onSubmit={publish} className="glass-card p-4 rounded-2xl space-y-2 mb-6 border-2 border-forest-300">
          <p className="text-sm font-bold text-forest-700">🏷️ New Listing</p>
          <input className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" placeholder="Title (e.g. 8-weeks broilers, 50 birds)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <textarea className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" rows={3} placeholder="Full details — breed, age, weight, health, quantity..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="flex gap-2">
            <input className="flex-1 p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" type="number" placeholder="Price (₦)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            <input className="flex-1 p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" placeholder="Location (e.g. Ibadan)" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <label className="block text-xs font-semibold text-green-700 cursor-pointer">📷 Add photos (tap multiple times for up to 5)
            <input type="file" accept="image/*" className="hidden" onChange={uploadImage} />          </label>
          {images.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {images.map((im, i) => <img key={i} src={im} alt="" className="w-14 h-14 object-cover rounded-lg" />)}
            </div>
          )}
          <button className="w-full bg-green-600 text-white py-2.5 rounded-xl text-sm font-bold disabled:opacity-50" disabled={busy}>🚀 Publish Listing</button>
        </form>
      )}

      <div className="grid grid-cols-2 gap-3">
        {listings.map((l: any) => (
          <div key={l.id} className="glass-card p-3 rounded-2xl flex flex-col">
            <Link href={`/market/${l.id}`} className="active:scale-[0.98]">
              {l.images && l.images[0] ? (
                <img src={l.images[0]} alt={l.title} className="w-full h-32 object-cover rounded-xl mb-2" />
              ) : (
                <div className="w-full h-32 bg-forest-100 rounded-xl flex items-center justify-center text-3xl mb-2">🐄</div>
              )}
              <p className="font-semibold text-xs line-clamp-2">{l.title}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{l.profiles?.full_name || "Farmer"} {l.profiles?.verified && "✅"}{l.location ? " · 📍 " + l.location : ""}</p>
              <p className="text-sm font-bold text-green-700 mt-1">{currencySymbol(l.currency || "NGN")}{Number(l.price).toLocaleString()}</p>
            </Link>
            {user?.id === l.seller_id && (
              <div className="flex gap-1 mt-2">
                <button onClick={() => markSold(l.id)} className="flex-1 bg-amber-100 text-amber-700 py-1.5 rounded-xl text-[10px] font-bold">✅ Mark Sold</button>
                <button onClick={() => removeListing(l.id)} className="flex-1 bg-red-100 text-red-600 py-1.5 rounded-xl text-[10px] font-bold">🗑 Remove</button>
              </div>
            )}
          </div>
        ))}
      </div>
      {listings.length === 0 && <p className="text-sm text-gray-500 text-center py-10">No live listings yet — be the first to sell! 🐄</p>}
    </div>
  );
}