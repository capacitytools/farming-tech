"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import AdBanner from "@/components/AdBanner";

export default function ReelsPage() {
  const [user, setUser] = useState<any>(null);
  const [reels, setReels] = useState<any[]>([]);
  const [likes, setLikes] = useState<any[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data: { user: u } } = await supabase.auth.getUser();
    setUser(u);
    const { data } = await supabase.rpc("ranked_reels", { uid: u?.id || null });
    setReels(data || []);
    if (u) {
      const { data: l } = await supabase.from("video_likes").select("id, video_id").eq("user_id", u.id);
      setLikes(l || []);
      const { data: f } = await supabase.from("follows").select("following_id").eq("follower_id", u.id);
      setFollowing((f || []).map((x: any) => x.following_id));
    }
    setLoaded(true);
  }
  useEffect(() => {
    load();
  }, []);

  async function toggleLike(id: string) {
    if (!user) return alert("Log in to like reels.");
    const supabase = createClient();
    const mine = likes.find((l) => l.video_id === id);
    if (mine) await supabase.from("video_likes").delete().eq("id", mine.id);
    else await supabase.from("video_likes").insert({ video_id: id, user_id: user.id });
    load();
  }

  async function toggleFollow(id: string) {
    if (!user) return alert("Log in to follow farmers.");
    const supabase = createClient();
    if (following.includes(id)) await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", id);
    else await supabase.from("follows").insert({ follower_id: user.id, following_id: id });
    load();
  }

  if (!loaded) return <p className="text-center text-gray-500 py-10">Loading reels…</p>;
  return (
    <div className="p-4 pb-24 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-1">🎬 Reels</h1>
      <p className="text-gray-600 text-xs mb-4">Vertical farm videos · TikTok-style ranking · scroll & discover!</p>

      <div className="space-y-4">
        {reels.map((r, idx) => {
          const myLike = likes.find((l) => l.video_id === r.id);
          const iFollow = following.includes(r.author_id);
          return (
            <div key={r.id}>
              <div className="rounded-2xl overflow-hidden border-2 border-forest-600 bg-black">
                <div className="bg-forest-700 text-white px-3 py-1.5 flex items-center gap-2">
                  <span className="text-xs">🌾</span>
                  <p className="text-[10px] font-extrabold tracking-wide">FARMING TECH & BUSINESS · REELS</p>
                </div>
                <div className="flex justify-center bg-black">
                  <iframe
                    src={`https://www.youtube.com/embed/${r.youtube_id}`}
                    title={r.title || "reel"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full aspect-[9/16] max-h-[72vh]"
                  />
                </div>
                <div className="bg-gradient-to-t from-black to-forest-900 p-3 text-white">
                  <div className="flex items-center gap-2">
                    <Link href={`/farmer/${r.author_id}`}>
                      {r.author_avatar ? (
                        <img src={r.author_avatar} className="w-9 h-9 rounded-full object-cover border-2 border-white" alt="" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center font-bold">{(r.author_name || "?")[0]}</div>
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/farmer/${r.author_id}`} className="font-bold text-sm hover:underline">{r.author_name || "Farmer"}</Link>
                      {r.author_verified && <span className="ml-1 text-sky-400 text-xs">✅</span>}
                    </div>
                    <button onClick={() => toggleFollow(r.author_id)} className={`text-xs font-bold px-3 py-1.5 rounded-full ${iFollow ? "bg-gray-600" : "bg-green-500 text-black"}`}>
                      {iFollow ? "Following" : "+ Follow"}
                    </button>
                  </div>
                  {r.title && <p className="text-xs text-gray-200 mt-2 line-clamp-2">{r.title}</p>}
                  <div className="flex items-center gap-4 mt-2 text-xs font-bold">
                    <button onClick={() => toggleLike(r.id)} className={myLike ? "text-red-500" : "text-white"}>❤️ {r.likes}</button>
                    <span className="text-white">💬 {r.comments}</span>
                    <Link href="/ads/submit" className="ml-auto text-amber-400 text-[9px]">📢 Advertise here</Link>
                  </div>
                </div>              </div>
              {idx % 2 === 1 && (
                <div className="mt-4">
                  <AdBanner type="native" />
                </div>
              )}
            </div>
          );
        })}
        {reels.length === 0 && (
          <p className="text-center text-gray-500 py-10">No reels yet — post a YouTube Shorts link as 9:16 and be the first! 🎬</p>
        )}
      </div>
    </div>
  );
}