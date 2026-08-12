"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminVideos() {
  const [videos, setVideos] = useState<any[]>([]);
  const [codes, setCodes] = useState<any>({});

  async function load() {
    const supabase = createClient();
    const { data } = await supabase.from("videos").select("*, profiles(full_name), ad_campaigns(code, business_name)").order("created_at", { ascending: false }).limit(30);
    setVideos(data || []);
  }
  useEffect(() => {
    load();
  }, []);

  async function attach(videoId: string) {
    const code = (codes[videoId] || "").trim().toUpperCase();
    if (!code) return;
    const supabase = createClient();
    const { data: camp } = await supabase.from("ad_campaigns").select("id, status").eq("code", code).single();
    if (!camp) return alert("No ad found with that code.");
    if (camp.status !== "approved") return alert("That ad is not approved yet.");
    await supabase.from("videos").update({ ad_id: camp.id }).eq("id", videoId);
    load();
  }

  async function detach(videoId: string) {
    const supabase = createClient();
    await supabase.from("videos").update({ ad_id: null }).eq("id", videoId);
    load();
  }

  async function remove(videoId: string) {
    if (!confirm("Delete this video?")) return;
    const supabase = createClient();
    await supabase.from("videos").delete().eq("id", videoId);
    load();
  }

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">🎬 Videos & Ad Slots</h1>
      <p className="text-xs text-gray-500 mb-6">Paste an approved ad CODE under any video → the ad scrolls under it while it plays. 💰</p>

      <div className="space-y-3">
        {videos.map((v) => (
          <div key={v.id} className="glass-card p-4 rounded-2xl">
            <div className="flex items-center justify-between">
              <p className="font-bold text-sm">🎬 {v.title || "Untitled video"}</p>
              <button onClick={() => remove(v.id)} className="text-red-600 text-xs font-semibold">Delete</button>
            </div>
            <p className="text-[10px] text-gray-500">by {v.profiles?.full_name} · {v.context}{v.tribe_id ? " tribe" : ""} · {new Date(v.created_at).toLocaleDateString()}</p>
            <div className="mt-2">
              {v.ad_campaigns ? (
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-green-700">📢 Playing: {v.ad_campaigns.business_name} ({v.ad_campaigns.code})</p>
                  <button onClick={() => detach(v.id)} className="text-xs text-red-600 font-semibold">Remove ad</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input className="flex-1 p-2 rounded-xl border border-gray-200 bg-white/70 text-xs" placeholder="Paste ad code (AD-XXXXXX)" value={codes[v.id] || ""} onChange={(e) => setCodes({ ...codes, [v.id]: e.target.value })} />
                  <button onClick={() => attach(v.id)} className="bg-amber-500 text-white px-3 rounded-xl text-xs font-bold">Slot Ad</button>
                </div>
              )}
            </div>
          </div>
        ))}
        {videos.length === 0 && <p className="text-gray-500 text-center py-10">No videos yet.</p>}
      </div>
    </div>
  );
}