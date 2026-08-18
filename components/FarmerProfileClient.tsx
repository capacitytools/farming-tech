"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import ProfileShare from "@/components/ProfileShare";
import { currencySymbol } from "@/lib/currency";

const RANK_ICONS: any = {
  "Beginner Star": "⭐",
  "Master Star": "🌟",
  "Premium Star": "💫",
  "Professional Star": "🏅",
  "Golden Star": "👑",
};

export default function FarmerProfileClient({ id }: { id: string }) {
  const [user, setUser] = useState<any>(null);
  const [farmer, setFarmer] = useState<any>(null);
  const [pts, setPts] = useState(0);
  const [rank, setRank] = useState("Beginner Star");
  const [followers, setFollowers] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [iFollow, setIFollow] = useState(false);
  const [tab, setTab] = useState("posts");
  const [posts, setPosts] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data: u } = await supabase.auth.getUser();
    setUser(u?.user || null);

    let f: any = null;
    const isUuid = /^[0-9a-fA-F-]{36}$/.test(id);
    if (isUuid) {
      const r = await supabase.from("profiles").select("*").eq("id", id).single();
      f = r.data;
    }
    if (!f) {
      const r = await supabase.from("profiles").select("*").eq("referral_code", id).single();
      f = r.data;
    }
    setFarmer(f);
    if (!f) { setLoaded(true); return; }

    if (f.referral_code && u?.user?.id !== f.id) {      localStorage.setItem("refCode", f.referral_code);
    }

    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.rpc("user_points", { uid: f.id }),
      supabase.rpc("user_rank", { uid: f.id }),
    ]);
    setPts(p || 0);
    setRank(r || "Beginner Star");
    const [{ count: fc }, { count: gc }, { data: mine }] = await Promise.all([
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", f.id),
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", f.id),
      u?.user ? supabase.from("follows").select("id").eq("follower_id", u.user.id).eq("following_id", f.id).single() : { data: null },
    ]);
    setFollowers(fc || 0);
    setFollowingCount(gc || 0);
    setIFollow(!!mine);
    const [{ data: po }, { data: vi }, { data: li }, { data: re }] = await Promise.all([
      supabase.from("feed_posts").select("*, ad:ad_campaigns(*)").eq("author_id", f.id).order("created_at", { ascending: false }).limit(20),
      supabase.from("videos").select("*").eq("author_id", f.id).order("created_at", { ascending: false }).limit(12),
      supabase.from("livestock_listings").select("*").eq("seller_id", f.id).eq("status", "active").limit(6),
      supabase.from("listing_reviews").select("*, profiles(full_name), listings(title)").eq("listings.seller_id", f.id).limit(10),
    ]);
    setPosts(po || []);
    setVideos(vi || []);
    setListings(li || []);
    setReviews(re || []);
    setLoaded(true);
  }

  useEffect(() => { load(); }, [id]);

  async function toggleFollow() {
    if (!user) return alert("Log in to follow farmers.");
    const supabase = createClient();
    if (iFollow) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", farmer.id);
      setFollowers(followers - 1);
      setIFollow(false);
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, following_id: farmer.id });
      setFollowers(followers + 1);
      setIFollow(true);
    }
  }

  if (!loaded) return <p className="text-center text-gray-500 py-10">Loading…</p>;
  if (!farmer) return <p className="text-center text-gray-500 py-10">Farmer not found.</p>;

  const media = posts.filter((p) => p.image_url);  const reels = videos.filter((v) => v.aspect === "portrait");
  const tabBtn = (t: string, label: string) => (
    <button onClick={() => setTab(t)} className={`flex-1 py-3 text-sm font-bold border-b-2 ${tab === t ? "border-green-600 text-green-700" : "border-transparent text-gray-500"}`}>{label}</button>
  );

  return (
    <div className="pb-24 max-w-2xl mx-auto">
      <div className="h-40">
        {farmer.cover_url ? (
          <img src={farmer.cover_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-forest-600 via-green-500 to-amber-400" />
        )}
      </div>

      <div className="px-4">
        <div className="flex items-end justify-between -mt-10">
          {farmer.avatar_url ? (
            <img src={farmer.avatar_url} alt={farmer.full_name} className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-green-200 border-4 border-white shadow-lg flex items-center justify-center text-4xl font-bold text-green-800">{(farmer.full_name || "?")[0]}</div>
          )}
          <div className="flex gap-2 pb-1">
            {user?.id !== farmer.id && (
              <button onClick={toggleFollow} className={`px-4 py-2 rounded-full text-sm font-bold ${iFollow ? "bg-gray-200 text-gray-700" : "bg-green-600 text-white"}`}>
                {iFollow ? "Following ✓" : "+ Follow"}
              </button>
            )}
            {farmer.whatsapp && (
              <a href={`https://wa.me/${farmer.whatsapp}`} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-full text-sm font-bold bg-green-100 text-green-700">💬 WhatsApp</a>
            )}
            <Link href={`/inbox?user=${farmer.id}`} className="px-4 py-2 rounded-full text-sm font-bold bg-forest-100 text-forest-700">✉️</Link>
          </div>
        </div>

        <h1 className="text-xl font-extrabold mt-2">
          {farmer.full_name || "Farmer"} {farmer.verified && <span className="text-sky-500">✅</span>}
        </h1>
        <p className="text-xs text-gray-500">@{(farmer.referral_code || farmer.id).slice(0, 8).toLowerCase()} · 📍 {farmer.location || "Nigeria"} · joined {new Date(farmer.created_at).toLocaleDateString("en-NG", { month: "short", year: "numeric" })}</p>
        {farmer.bio && <p className="text-sm text-gray-700 mt-1">{farmer.bio}</p>}
        {farmer.verified && <p className="text-[10px] font-bold text-sky-600 mt-1">✅ VERIFIED MEMBER — trusted by Farming Tech & Business</p>}

        <div className="flex gap-4 mt-3 text-sm flex-wrap">
          <span><b>{followingCount}</b> <span className="text-gray-500">Following</span></span>
          <span><b>{followers}</b> <span className="text-gray-500">Followers</span></span>
          <span><b className="text-amber-600">{pts}</b> <span className="text-gray-500">Points</span></span>
          <span className="text-amber-600 font-bold">{RANK_ICONS[rank]}</span>
        </div>

        <div className="mt-3">          <ProfileShare id={farmer.id} code={farmer.referral_code || ""} name={farmer.full_name || "this farmer"} />
        </div>
      </div>

      <div className="flex mt-4 border-b border-gray-200 px-2 bg-white/60 sticky top-14 z-30">
        {tabBtn("posts", "Posts")}
        {tabBtn("media", "Media")}
        {tabBtn("reels", "Reels")}
        {tabBtn("about", "Market & Reviews")}
      </div>

      <div className="p-4 space-y-4">
        {tab === "posts" && (
          <>
            {posts.map((p) => (
              <div key={p.id} className="glass-card p-4 rounded-2xl">
                <p className="text-sm text-gray-800 whitespace-pre-line">{p.content}</p>
                {p.image_url && <img src={p.image_url} alt="" className="mt-2 w-full h-64 object-cover rounded-xl" />}
                <p className="text-[10px] text-gray-400 mt-2">{new Date(p.created_at).toLocaleDateString()} · 👁️ {p.views_count || 0} · 🔁 {p.shares_count || 0}</p>
              </div>
            ))}
            {posts.length === 0 && <p className="text-sm text-gray-500 text-center py-6">No posts yet.</p>}
          </>
        )}

        {tab === "media" && (
          <div className="grid grid-cols-2 gap-2">
            {media.map((p) => (
              <img key={p.id} src={p.image_url} alt="" className="w-full h-40 object-cover rounded-xl" />
            ))}
            {media.length === 0 && <p className="text-sm text-gray-500 col-span-2 text-center py-6">No photos yet.</p>}
          </div>
        )}

        {tab === "reels" && (
          <div className="grid grid-cols-2 gap-2">
            {reels.map((v) => (
              <a key={v.id} href={`https://youtu.be/${v.youtube_id}`} target="_blank" rel="noopener noreferrer" className="relative rounded-xl overflow-hidden bg-black">
                <img src={`https://i.ytimg.com/vi/${v.youtube_id}/mqdefault.jpg`} alt="" className="w-full h-48 object-cover opacity-90" />
                <span className="absolute bottom-1 right-2 text-white text-lg">▶</span>
              </a>
            ))}
            {reels.length === 0 && <p className="text-sm text-gray-500 col-span-2 text-center py-6">No reels yet.</p>}
          </div>
        )}

        {tab === "about" && (
          <>
            <h2 className="font-bold">🐄 Active Listings</h2>
            <div className="grid grid-cols-2 gap-3">              {listings.map((l) => (
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
              {listings.length === 0 && <p className="text-sm text-gray-500 col-span-2">No active listings.</p>}
            </div>
            <h2 className="font-bold pt-2">⭐ Reviews</h2>
            <div className="space-y-2">
              {reviews.map((r) => (
                <div key={r.id} className="glass-card p-3 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{r.profiles?.full_name || "Buyer"}</p>
                    <span className="text-xs text-amber-500">{"⭐".repeat(Number(r.rating))}</span>
                  </div>
                  {r.comment && <p className="text-xs text-gray-700 mt-1">{r.comment}</p>}
                </div>
              ))}
              {reviews.length === 0 && <p className="text-sm text-gray-500">No reviews yet.</p>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}