"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminFeatured() {
  const [requests, setRequests] = useState<any[]>([]);
  const [featured, setFeatured] = useState<any[]>([]);

  async function load() {
    const supabase = createClient();
    const { data: r } = await supabase.from("livestock_listings").select("*, profiles(full_name)").eq("featured_requested", true).order("created_at", { ascending: false });
    const { data: f } = await supabase.from("livestock_listings").select("*, profiles(full_name)").eq("is_featured", true).order("created_at", { ascending: false });
    setRequests(r || []);
    setFeatured(f || []);
  }
  useEffect(() => {
    load();
  }, []);

  async function approve(id: string) {
    const supabase = createClient();
    const until = new Date();
    until.setDate(until.getDate() + 7);
    await supabase.from("livestock_listings").update({ is_featured: true, featured_requested: false, featured_until: until.toISOString() }).eq("id", id);
    load();
  }

  async function unfeature(id: string) {
    const supabase = createClient();
    await supabase.from("livestock_listings").update({ is_featured: false, featured_until: null }).eq("id", id);
    load();
  }

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">⭐ Featured Listings</h1>

      <h2 className="font-bold mb-3 text-amber-700">Pending requests ({requests.length})</h2>
      <div className="space-y-2 mb-8">
        {requests.map((l) => (
          <div key={l.id} className="glass-card p-3 rounded-2xl flex items-center gap-3 border-2 border-amber-300">
            {l.images?.[0] && <img src={l.images[0]} alt="" className="w-12 h-12 object-cover rounded-xl" />}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">⭐ {l.title}</p>
              <p className="text-[10px] text-gray-500">{l.profiles?.full_name} · ₦{Number(l.price).toLocaleString()} — confirm ₦300 payment first!</p>
            </div>
            <button onClick={() => approve(l.id)} className="text-xs font-bold px-3 py-2 rounded-full bg-green-600 text-white">Approve 7d</button>
          </div>
        ))}
        {requests.length === 0 && <p className="text-sm text-gray-500">No pending requests.</p>}
      </div>

      <h2 className="font-bold mb-3">Currently featured ({featured.length})</h2>
      <div className="space-y-2">
        {featured.map((l) => (
          <div key={l.id} className="glass-card p-3 rounded-2xl flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">⭐ {l.title}</p>
              <p className="text-[10px] text-gray-500">until {l.featured_until ? new Date(l.featured_until).toLocaleDateString() : "—"}</p>
            </div>
            <button onClick={() => unfeature(l.id)} className="text-xs font-bold px-3 py-2 rounded-full bg-gray-200 text-gray-700">Remove</button>
          </div>
        ))}
        {featured.length === 0 && <p className="text-sm text-gray-500">Nothing featured yet.</p>}
      </div>
    </div>
  );
}