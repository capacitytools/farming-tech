"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

const RANKS: any = {
  "Beginner Star": { icon: "⭐", next: 50 },
  "Master Star": { icon: "🌟", next: 150 },
  "Premium Star": { icon: "💫", next: 300 },
  "Professional Star": { icon: "🏅", next: 600 },
  "Golden Star": { icon: "👑", next: null },
};

export default function ProfileDashboard() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [scans, setScans] = useState<any[]>([]);
  const [myTribes, setMyTribes] = useState<any[]>([]);
  const [points, setPoints] = useState(0);
  const [rank, setRank] = useState("Beginner Star");
  const [unread, setUnread] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const router = useRouter();

  async function load() {
    const supabase = createClient();
    const { data: { user: u } } = await supabase.auth.getUser();
    setUser(u);
    if (u) {
      const { data: p } = await supabase.from("profiles").select("*").eq("id", u.id).single();
      setProfile(p);
      const { data: l } = await supabase.from("livestock_listings").select("*").eq("seller_id", u.id).order("created_at", { ascending: false });
      setListings(l || []);
      const { data: pur } = await supabase.from("ebook_purchases").select("*, ebooks(title, cover_url, file_url)").eq("user_id", u.id).eq("status", "paid");
      setPurchases(pur || []);
      const { data: s } = await supabase.from("ai_scans").select("*").eq("user_id", u.id).order("created_at", { ascending: false }).limit(6);
      setScans(s || []);
      const { data: t } = await supabase.from("tribe_members").select("*, tribes(name, icon, image_url, slug)").eq("user_id", u.id);
      setMyTribes(t || []);
      const { data: pts } = await supabase.rpc("user_points", { uid: u.id });
      setPoints(pts || 0);
      const { data: rk } = await supabase.rpc("user_rank", { uid: u.id });
      setRank(rk || "Beginner Star");
      const { count } = await supabase.from("direct_messages").select("*", { count: "exact", head: true }).eq("receiver_id", u.id).eq("read", false);
      setUnread(count || 0);
    }    setLoaded(true);
  }

  useEffect(() => {
    load();
  }, []);

  async function changeAvatar(e: any) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `avatar-${user.id}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (!error) {
      const url = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
      load();
    }
  }

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  if (!loaded) return <p className="text-center text-gray-500 py-10">Loading…</p>;

  if (!user) {
    return (
      <div className="p-8 text-center">
        <div className="text-6xl mb-4">👤</div>
        <h1 className="text-2xl font-bold mb-2">Your Dashboard</h1>
        <p className="text-gray-500 mb-6">Log in to see your listings, purchases, scans and tribes.</p>
        <a href="/login" className="inline-block bg-green-600 text-white px-6 py-3 rounded-xl font-semibold">Log in / Sign up</a>
      </div>
    );
  }

  const isAdmin = profile?.role === "admin";
  const rankInfo = RANKS[rank] || RANKS["Beginner Star"];
  const statusColor: any = { active: "bg-green-100 text-green-700", pending: "bg-yellow-100 text-yellow-700", rejected: "bg-red-100 text-red-700", sold: "bg-gray-200 text-gray-700" };

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <div className="glass-card p-5 rounded-2xl flex items-center gap-4 mb-4">
        <label className="relative cursor-pointer">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="avatar" className="w-16 h-16 rounded-full object-cover" />          ) : (
            <div className="w-16 h-16 rounded-full bg-green-200 flex items-center justify-center text-2xl font-bold text-green-800">
              {(profile?.full_name || user.email)?.[0]?.toUpperCase()}
            </div>
          )}
          <span className="absolute bottom-0 right-0 bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">📷</span>
          <input type="file" accept="image/*" onChange={changeAvatar} className="hidden" />
        </label>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{profile?.full_name || "Farmer"}</h1>
          <p className="text-xs text-gray-500">{user.email}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{rankInfo.icon} {rank} · {points} pts</span>
            <span className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${isAdmin ? "bg-purple-100 text-purple-700" : "bg-forest-100 text-forest-700"}`}>
              {profile?.role || "member"}
            </span>
          </div>
          {rankInfo.next && <p className="text-[10px] text-gray-400 mt-1">{rankInfo.next - points} pts to next rank — post, sell & scan to grow! 🚀</p>}
        </div>
        <button onClick={logout} className="text-red-600 text-sm font-semibold">Logout</button>
      </div>

      <Link href="/inbox" className="glass-card p-4 rounded-2xl mb-4 flex items-center justify-between">
        <span className="font-bold">💬 Inbox</span>
        {unread > 0 ? (
          <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1">{unread} new message{unread > 1 ? "s" : ""}</span>
        ) : (
          <span className="text-xs text-gray-500">No new messages</span>
        )}
      </Link>

      {isAdmin && (
        <div className="glass-card p-5 rounded-2xl mb-6 border-2 border-purple-300">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-purple-700">🛠️ Admin Workspace</h2>
            <Link href="/admin" className="text-sm font-semibold text-purple-700">Open full dashboard →</Link>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            <Link href="/admin/analytics" className="bg-white/70 p-2 rounded-xl"><span className="text-xl">📊</span><p className="text-[10px] font-semibold">Analytics</p></Link>
            <Link href="/admin/notifications" className="bg-white/70 p-2 rounded-xl"><span className="text-xl">🔔</span><p className="text-[10px] font-semibold">Announce</p></Link>
            <Link href="/admin/blogs" className="bg-white/70 p-2 rounded-xl"><span className="text-xl">📝</span><p className="text-[10px] font-semibold">Blogs</p></Link>
            <Link href="/admin/listings" className="bg-white/70 p-2 rounded-xl"><span className="text-xl">🐄</span><p className="text-[10px] font-semibold">Listings</p></Link>
            <Link href="/admin/ebooks" className="bg-white/70 p-2 rounded-xl"><span className="text-xl">📚</span><p className="text-[10px] font-semibold">E-books</p></Link>
            <Link href="/admin/tribes" className="bg-white/70 p-2 rounded-xl"><span className="text-xl">🌾</span><p className="text-[10px] font-semibold">Tribes</p></Link>
            <Link href="/admin/ads" className="bg-white/70 p-2 rounded-xl"><span className="text-xl">💰</span><p className="text-[10px] font-semibold">Ads</p></Link>
            <Link href="/admin/notes" className="bg-white/70 p-2 rounded-xl"><span className="text-xl">🗒️</span><p className="text-[10px] font-semibold">Notepad</p></Link>
          </div>
        </div>
      )}
      <div className="grid grid-cols-4 gap-2 mb-6 text-center">
        <div className="glass-card p-3 rounded-xl"><p className="text-lg font-bold">{listings.length}</p><p className="text-[10px] text-gray-500">Listings</p></div>
        <div className="glass-card p-3 rounded-xl"><p className="text-lg font-bold">{purchases.length}</p><p className="text-[10px] text-gray-500">E-books</p></div>
        <div className="glass-card p-3 rounded-xl"><p className="text-lg font-bold">{scans.length}</p><p className="text-[10px] text-gray-500">Scans</p></div>
        <div className="glass-card p-3 rounded-xl"><p className="text-lg font-bold">{myTribes.length}</p><p className="text-[10px] text-gray-500">Tribes</p></div>
      </div>

      <h2 className="font-bold mb-3">🐄 My Listings</h2>
      <div className="space-y-2 mb-6">
        {listings.length ? listings.map((l) => (
          <div key={l.id} className="glass-card p-3 rounded-xl flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">{l.title}</p>
              <p className="text-xs text-gray-500">₦{Number(l.price).toLocaleString()} · Qty {l.quantity}</p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${statusColor[l.status]}`}>{l.status}</span>
          </div>
        )) : <p className="text-sm text-gray-500">No listings yet. <a href="/market/new" className="text-green-600 font-semibold">Sell now</a></p>}
      </div>

      <h2 className="font-bold mb-3">📚 My E-books</h2>
      <div className="space-y-2 mb-6">
        {purchases.length ? purchases.map((p) => (
          <div key={p.id} className="glass-card p-3 rounded-xl flex items-center gap-3">
            {p.ebooks?.cover_url && <img src={p.ebooks.cover_url} alt="" className="w-10 h-12 object-cover rounded" />}
            <p className="flex-1 font-semibold text-sm">{p.ebooks?.title}</p>
            <a href={p.ebooks?.file_url || "#"} target="_blank" rel="noopener noreferrer" className="text-green-600 text-sm font-semibold">⬇️</a>
          </div>
        )) : <p className="text-sm text-gray-500">No e-books yet. <a href="/ebooks" className="text-green-600 font-semibold">Browse store</a></p>}
      </div>

      <h2 className="font-bold mb-3">🩺 My AI Scans</h2>
      <div className="space-y-2 mb-6">
        {scans.length ? scans.map((s) => (
          <div key={s.id} className="glass-card p-3 rounded-xl flex items-center gap-3">
            {s.image_url && <img src={s.image_url} alt="" className="w-12 h-12 object-cover rounded-lg" />}
            <div>
              <p className="font-semibold text-sm">{s.diagnosis}</p>
              <p className="text-xs text-gray-500">{new Date(s.created_at).toLocaleDateString()} · {s.severity}</p>
            </div>
          </div>
        )) : <p className="text-sm text-gray-500">No scans yet. <a href="/scanner" className="text-green-600 font-semibold">Scan now</a></p>}
      </div>

      <h2 className="font-bold mb-3">🌾 My Tribes</h2>
      <div className="space-y-2">
        {myTribes.length ? myTribes.map((t) => (
          <a key={t.id} href={`/communities/${t.tribes?.slug}`} className="glass-card p-3 rounded-xl flex items-center gap-3">
            {t.tribes?.image_url ? <img src={t.tribes.image_url} alt="" className="w-10 h-10 object-cover rounded-lg" /> : <span className="text-2xl">{t.tribes?.icon}</span>}
            <p className="font-semibold text-sm">{t.tribes?.name}</p>          </a>
        )) : <p className="text-sm text-gray-500">Not in any tribe yet. <a href="/communities" className="text-green-600 font-semibold">Join one</a></p>}
      </div>
    </div>
  );
}