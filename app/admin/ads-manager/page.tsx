"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminAdsManager() {
  const [tab, setTab] = useState("requests");
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [codes, setCodes] = useState<any>({});

  async function load() {
    const supabase = createClient();
    const [c, v, p] = await Promise.all([
      supabase.from("ad_campaigns").select("*, profiles(full_name)").order("created_at", { ascending: false }).limit(50),
      supabase.from("videos").select("id, title, context, created_at, ad_campaigns(code, business_name)").order("created_at", { ascending: false }).limit(30),
      supabase.from("feed_posts").select("id, content, created_at, profiles(full_name), ad_campaigns(code, business_name)").order("created_at", { ascending: false }).limit(30),
    ]);
    setCampaigns(c.data || []);
    setVideos(v.data || []);
    setPosts(p.data || []);
  }
  useEffect(() => {
    load();
  }, []);

  async function setStatus(id: string, status: string) {
    const supabase = createClient();
    await supabase.from("ad_campaigns").update({ status }).eq("id", id);
    load();
  }

  async function attach(kind: "videos" | "feed_posts", targetId: string) {
    const code = (codes[`${kind}-${targetId}`] || "").trim().toUpperCase();
    if (!code) return;
    const supabase = createClient();
    const { data: camp } = await supabase.from("ad_campaigns").select("id, status").eq("code", code).single();
    if (!camp) return alert("No ad found with that code.");
    if (camp.status !== "approved") return alert("That ad is not approved yet.");
    await supabase.from(kind).update({ ad_id: camp.id }).eq("id", targetId);
    load();
  }

  async function detach(kind: "videos" | "feed_posts", targetId: string) {
    const supabase = createClient();
    await supabase.from(kind).update({ ad_id: null }).eq("id", targetId);
    load();
  }
  const pending = campaigns.filter((c) => c.status === "pending");
  const approved = campaigns.filter((c) => c.status === "approved");

  const tabBtn = (t: string, label: string) => (
    <button onClick={() => setTab(t)} className={`px-3 py-2 rounded-xl text-xs font-bold ${tab === t ? "bg-forest-600 text-white" : "bg-gray-200 text-gray-700"}`}>{label}</button>
  );

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">📢 Ads Command Center</h1>

      <div className="flex gap-2 mb-6">
        {tabBtn("requests", `📨 Requests (${pending.length})`)}
        {tabBtn("approved", `✅ Approved (${approved.length})`)}
        {tabBtn("assign", "🎬 Assign to Videos/Posts")}
      </div>

      {tab === "requests" && (
        <div className="space-y-3">
          {pending.map((a) => (
            <div key={a.id} className="glass-card p-4 rounded-2xl border-2 border-yellow-300">
              <div className="flex items-center justify-between">
                <p className="font-bold text-sm">{a.business_name}</p>
                <span className="text-[10px] font-bold text-purple-700">code: {a.code}</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">📜 {a.ad_text}</p>
              <p className="text-[10px] text-gray-400 mt-1">by {a.profiles?.full_name} · {a.ad_video ? "🎬 video ad" : a.image_url ? "🖼️ image ad" : "📝 text ad"}</p>
              <div className="flex gap-2 mt-2">
                {a.image_url && <img src={a.image_url} alt="" className="h-10 w-10 object-cover rounded-lg" />}
                {a.ad_video && <a href={`https://youtu.be/${a.ad_video}`} target="_blank" rel="noopener noreferrer" className="h-10 px-2 bg-red-600 text-white rounded-lg text-xs font-bold flex items-center">▶ preview</a>}
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => setStatus(a.id, "approved")} className="flex-1 bg-green-600 text-white py-2 rounded-xl text-xs font-bold">✅ Approve</button>
                <button onClick={() => setStatus(a.id, "rejected")} className="flex-1 bg-red-500 text-white py-2 rounded-xl text-xs font-bold">Reject</button>
              </div>
            </div>
          ))}
          {pending.length === 0 && <p className="text-gray-500 text-center py-10">No pending requests.</p>}
        </div>
      )}

      {tab === "approved" && (
        <div className="space-y-2">
          {approved.map((a) => (
            <div key={a.id} className="glass-card p-3 rounded-2xl flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{a.business_name}</p>
                <p className="text-[10px] text-gray-500 truncate">{a.ad_text}</p>
              </div>
              <span className="text-xs font-extrabold text-purple-700">{a.code}</span>              <button onClick={() => setStatus(a.id, "rejected")} className="text-[10px] text-red-600 font-bold">Revoke</button>
            </div>
          ))}
          {approved.length === 0 && <p className="text-gray-500 text-center py-10">No approved ads yet.</p>}
        </div>
      )}

      {tab === "assign" && (
        <div className="space-y-6">
          <div>
            <h2 className="font-bold mb-2">🎬 Videos</h2>
            <div className="space-y-2">
              {videos.map((v) => (
                <div key={v.id} className="glass-card p-3 rounded-2xl">
                  <p className="font-semibold text-sm truncate">🎬 {v.title || "Untitled"} <span className="text-[10px] text-gray-400">· {v.context}</span></p>
                  {v.ad_campaigns ? (
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs font-bold text-green-700">📢 {v.ad_campaigns.business_name} ({v.ad_campaigns.code})</p>
                      <button onClick={() => detach("videos", v.id)} className="text-[10px] text-red-600 font-bold">Remove</button>
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-2">
                      <input className="flex-1 p-2 rounded-xl border border-gray-200 bg-white/70 text-xs" placeholder="Ad code" value={codes[`videos-${v.id}`] || ""} onChange={(e) => setCodes({ ...codes, [`videos-${v.id}`]: e.target.value })} />
                      <button onClick={() => attach("videos", v.id)} className="bg-amber-500 text-white px-3 rounded-xl text-xs font-bold">Slot</button>
                    </div>
                  )}
                </div>
              ))}
              {videos.length === 0 && <p className="text-xs text-gray-500">No videos yet.</p>}
            </div>
          </div>

          <div>
            <h2 className="font-bold mb-2">📣 Timeline Posts</h2>
            <div className="space-y-2">
              {posts.map((p) => (
                <div key={p.id} className="glass-card p-3 rounded-2xl">
                  <p className="text-xs text-gray-700 line-clamp-1">📣 {p.content} <span className="text-[10px] text-gray-400">· {p.profiles?.full_name}</span></p>
                  {p.ad_campaigns ? (
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs font-bold text-green-700">📢 {p.ad_campaigns.business_name} ({p.ad_campaigns.code})</p>
                      <button onClick={() => detach("feed_posts", p.id)} className="text-[10px] text-red-600 font-bold">Remove</button>
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-2">
                      <input className="flex-1 p-2 rounded-xl border border-gray-200 bg-white/70 text-xs" placeholder="Ad code" value={codes[`feed_posts-${p.id}`] || ""} onChange={(e) => setCodes({ ...codes, [`feed_posts-${p.id}`]: e.target.value })} />
                      <button onClick={() => attach("feed_posts", p.id)} className="bg-amber-500 text-white px-3 rounded-xl text-xs font-bold">Slot</button>
                    </div>
                  )}
                </div>              ))}
              {posts.length === 0 && <p className="text-xs text-gray-500">No posts yet.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}