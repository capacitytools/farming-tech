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

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [me, setMe] = useState<any>(null);
  const [pts, setPts] = useState(0);
  const [rank, setRank] = useState("Beginner Star");
  const [followers, setFollowers] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [tab, setTab] = useState("posts");
  const [posts, setPosts] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [loaded, setLoaded] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data: { user: u } } = await supabase.auth.getUser();
    setUser(u);
    if (!u) { setLoaded(true); return; }
    const [{ data: m }, { data: p }, { data: r }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", u.id).single(),
      supabase.rpc("user_points", { uid: u.id }),
      supabase.rpc("user_rank", { uid: u.id }),
    ]);
    setMe(m);
    setForm({ full_name: m?.full_name || "", bio: m?.bio || "", location: m?.location || "", whatsapp: m?.whatsapp || "" });
    setPts(p || 0);
    setRank(r || "Beginner Star");
    const [{ count: fc }, { count: gc }, { data: po }, { data: vi }, { data: li }, { data: re }] = await Promise.all([
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", u.id),
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", u.id),
      supabase.from("feed_posts").select("*").eq("author_id", u.id).order("created_at", { ascending: false }).limit(20),      supabase.from("videos").select("*").eq("author_id", u.id).order("created_at", { ascending: false }).limit(12),
      supabase.from("livestock_listings").select("*").eq("seller_id", u.id).eq("status", "active").limit(6),
      supabase.from("listing_reviews").select("*, profiles(full_name), listings(title)").eq("listings.seller_id", u.id).limit(10),
    ]);
    setFollowers(fc || 0);
    setFollowingCount(gc || 0);
    setPosts(po || []);
    setVideos(vi || []);
    setListings(li || []);
    setReviews(re || []);
    setLoaded(true);
  }

  useEffect(() => { load(); }, []);

  async function upload(kind: "avatar" | "cover", e: any) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${kind}-${user.id}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("blog-images").upload(path, file);
    if (error) return alert("Upload failed: " + error.message);
    const url = supabase.storage.from("blog-images").getPublicUrl(path).data.publicUrl;
    await supabase.from("profiles").update(kind === "avatar" ? { avatar_url: url } : { cover_url: url }).eq("id", user.id);
    load();
  }

  async function saveEdit() {
    if (!user) return;
    const supabase = createClient();
    await supabase.from("profiles").update({
      full_name: form.full_name,
      bio: form.bio,
      location: form.location,
      whatsapp: form.whatsapp,
    }).eq("id", user.id);
    setEditing(false);
    load();
  }

  if (!loaded) return <p className="text-center text-gray-500 py-10">Loading…</p>;
  if (!user) return (
    <div className="p-10 text-center">
      <p className="font-bold mb-3">Log in to see your profile</p>
      <Link href="/login" className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold">Log In</Link>
    </div>
  );

  const media = posts.filter((p) => p.image_url);  const reels = videos.filter((v) => v.aspect === "portrait");
  const tabBtn = (t: string, label: string) => (
    <button onClick={() => setTab(t)} className={`flex-1 py-3 text-sm font-bold border-b-2 ${tab === t ? "border-green-600 text-green-700" : "border-transparent text-gray-500"}`}>{label}</button>
  );
  const input = "w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm";

  return (
    <div className="pb-24 max-w-2xl mx-auto">
      {/* FACEBOOK-STYLE COVER */}
      <div className="relative h-40">
        {me?.cover_url ? (
          <img src={me.cover_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-forest-600 via-green-500 to-amber-400" />
        )}
        <label className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-bold px-3 py-1.5 rounded-full cursor-pointer">
          📷 Change Cover
          <input type="file" accept="image/*" className="hidden" onChange={(e) => upload("cover", e)} />
        </label>
      </div>

      <div className="px-4">
        <div className="flex items-end justify-between -mt-10">
          <div className="relative">
            {me?.avatar_url ? (
              <img src={me.avatar_url} alt="" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-green-200 border-4 border-white shadow-lg flex items-center justify-center text-4xl font-bold text-green-800">{(me?.full_name || "?")[0]}</div>
            )}
            <label className="absolute bottom-0 right-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center cursor-pointer border-2 border-white">
              📷
              <input type="file" accept="image/*" className="hidden" onChange={(e) => upload("avatar", e)} />
            </label>
          </div>
          <div className="flex gap-2 pb-1">
            <button onClick={() => setEditing(!editing)} className="px-4 py-2 rounded-full text-sm font-bold bg-forest-100 text-forest-700">✏️ Edit Profile</button>
          </div>
        </div>

        <h1 className="text-xl font-extrabold mt-2">{me?.full_name || "Farmer"} {me?.verified && <span className="text-sky-500">✅</span>}</h1>
        <p className="text-xs text-gray-500">@{(me?.referral_code || user.id).slice(0, 8).toLowerCase()} · 📍 {me?.location || "Nigeria"}</p>
        {me?.bio && <p className="text-sm text-gray-700 mt-1">{me.bio}</p>}

        <div className="flex gap-4 mt-3 text-sm flex-wrap">
          <span><b>{followingCount}</b> <span className="text-gray-500">Following</span></span>
          <span><b>{followers}</b> <span className="text-gray-500">Followers</span></span>
          <span><b className="text-amber-600">{pts}</b> <span className="text-gray-500">Points</span></span>
          <span className="text-amber-600 font-bold">{RANK_ICONS[rank]} {rank}</span>
        </div>
        <div className="flex gap-2 mt-3 flex-wrap">
          <ProfileShare id={user.id} code={me?.referral_code || ""} name={me?.full_name || "my profile"} />
          <Link href={`/farmer/${user.id}`} className="text-xs font-bold bg-green-600 text-white px-3 py-2 rounded-full">👁️ View Public Page</Link>
          <Link href="/wallet" className="text-xs font-bold bg-amber-100 text-amber-700 px-3 py-2 rounded-full">💵 Wallet</Link>
          <Link href="/achievements" className="text-xs font-bold bg-purple-100 text-purple-700 px-3 py-2 rounded-full">🏅 Badges</Link>
        </div>

        {editing && (
          <div className="glass-card p-4 rounded-2xl mt-4 space-y-2 border-2 border-forest-300">
            <p className="text-sm font-bold text-forest-700">✏️ Edit your details</p>
            <input className={input} placeholder="Full name" value={form.full_name || ""} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            <textarea className={input} rows={2} placeholder="Bio — tell farmers about you & your farm (e.g. Rabbit farmer in Ibadan, 5 years experience)" value={form.bio || ""} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
            <input className={input} placeholder="Location (e.g. Ibadan, Oyo State)" value={form.location || ""} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            <input className={input} placeholder="WhatsApp number (e.g. 2348012345678)" value={form.whatsapp || ""} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
            <button onClick={saveEdit} className="w-full bg-green-600 text-white py-2 rounded-xl text-sm font-bold">💾 Save Changes</button>
          </div>
        )}
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
            {posts.length === 0 && <p className="text-sm text-gray-500 text-center py-6">You haven't posted yet. Share your first farm update!</p>}
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

        {tab === "reels" && (          <div className="grid grid-cols-2 gap-2">
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
            <h2 className="font-bold">🐄 My Active Listings</h2>
            <div className="grid grid-cols-2 gap-3">
              {listings.map((l) => (
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
              {listings.length === 0 && <p className="text-sm text-gray-500 col-span-2">No active listings. <Link href="/market/new" className="text-green-700 font-bold underline">Sell now →</Link></p>}
            </div>
            <h2 className="font-bold pt-2">⭐ Buyer Reviews</h2>
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