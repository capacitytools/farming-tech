"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { uploadToCloudinary } from "@/lib/upload";

const ADMIN_TOOLS = [
  { href: "/admin/analytics", icon: "📊", label: "Analytics & Visitors" },
  { href: "/admin/traffic", icon: "🛰️", label: "Traffic Intelligence" },
  { href: "/admin/customers", icon: "📇", label: "Customer Spreadsheet" },
  { href: "/admin/megaphone", icon: "📢", label: "The Megaphone" },
  { href: "/admin/blogs", icon: "📰", label: "Blog Manager" },
  { href: "/admin/bills", icon: "🧾", label: "Bills Fulfilment Desk" },
  { href: "/admin/ads", icon: "📣", label: "Ad Switch Manager" },
];

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 });
  const [form, setForm] = useState({ full_name: "", bio: "", whatsapp: "" });
  const [avatar, setAvatar] = useState("");
  const [cover, setCover] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [loaded, setLoaded] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data: { user: u } } = await supabase.auth.getUser();
    setUser(u);
    if (u) {
      const [{ data: p }, { count: pc }, { count: fc }, { count: gc }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", u.id).single(),
        supabase.from("feed_posts").select("*", { count: "exact", head: true }).eq("author_id", u.id),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", u.id),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", u.id),
      ]);
      setProfile(p);
      if (p) setForm({ full_name: p.full_name || "", bio: p.bio || "", whatsapp: p.whatsapp || "" });
      setStats({ posts: pc || 0, followers: fc || 0, following: gc || 0 });
    }
    setLoaded(true);
  }

  useEffect(() => { load(); }, []);

  async function uploadAvatar(e: any) {
    const file = e.target.files?.[0];    if (!file) return;
    try {
      const url = await uploadToCloudinary(file, "avatars");
      setAvatar(url);
    } catch (err: any) {
      alert("Upload failed: " + (err && err.message ? err.message : "check connection and try again"));
    }
  }

  async function uploadCover(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadToCloudinary(file, "covers");
      setCover(url);
    } catch (err: any) {
      alert("Upload failed: " + (err && err.message ? err.message : "check connection and try again"));
    }
  }

  async function save(e: any) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const supabase = createClient();
    await supabase.from("profiles").update({
      full_name: form.full_name.trim(),
      bio: form.bio.trim(),
      whatsapp: form.whatsapp.trim(),
      avatar_url: avatar || profile?.avatar_url || null,
      cover_url: cover || profile?.cover_url || null,
    }).eq("id", user.id);
    setMsg("✅ Profile updated!");
    setAvatar(""); setCover("");
    setTimeout(() => setMsg(""), 2500);
    await load();
    setBusy(false);
  }

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (!loaded) return <p className="text-center text-gray-500 py-10">Loading…</p>;

  if (!user) {
    return (
      <div className="p-6 pb-24 max-w-md mx-auto text-center">        <div className="glass-card p-6 rounded-2xl">
          <p className="text-4xl mb-2">🔐</p>
          <h1 className="text-xl font-extrabold mb-1">My Dashboard</h1>
          <p className="text-sm text-gray-500 mb-4">Log in to see your points, posts and profile tools.</p>
          <Link href="/login" className="block bg-green-600 text-white py-3 rounded-xl font-extrabold">🔓 Log In / Register Free</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 max-w-2xl mx-auto">
      <div className="relative h-36 bg-forest-700">
        {(cover || profile?.cover_url) && <img src={cover || profile.cover_url} alt="" className="w-full h-36 object-cover" />}
        <label className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-bold px-3 py-1.5 rounded-full cursor-pointer">📷 Change cover
          <input type="file" accept="image/*" className="hidden" onChange={uploadCover} />
        </label>
      </div>
      <div className="px-4 -mt-8">
        <div className="flex items-end gap-3">
          <div className="relative">
            {profile?.avatar_url || avatar ? (
              <img src={avatar || profile.avatar_url} alt="" className="w-20 h-20 rounded-full object-cover border-4 border-white" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-green-200 border-4 border-white flex items-center justify-center text-2xl font-extrabold text-green-800">{(profile?.full_name || "?")[0]}</div>
            )}
            <label className="absolute -bottom-1 -right-1 bg-green-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs cursor-pointer">📷
              <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
            </label>
          </div>
          <div className="flex-1 pb-1">
            <h1 className="text-lg font-extrabold">{profile?.full_name || "Farmer"} {profile?.verified && "✅"}</h1>
            <p className="text-[10px] text-gray-500">@{profile?.referral_code || "—"} · {profile?.role === "admin" ? "🛡️ Admin" : "🌾 Member"}</p>
          </div>
          <button onClick={logout} className="text-[10px] font-bold text-red-500 pb-1">Log out</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 px-4 mt-4">
        <div className="glass-card p-3 rounded-2xl text-center"><p className="text-lg font-extrabold text-forest-800">{profile?.points || 0}</p><p className="text-[9px] text-gray-500 font-bold">💎 Points</p></div>
        <div className="glass-card p-3 rounded-2xl text-center"><p className="text-lg font-extrabold text-forest-800">{stats.posts}</p><p className="text-[9px] text-gray-500 font-bold">📣 Posts</p></div>
        <div className="glass-card p-3 rounded-2xl text-center"><p className="text-lg font-extrabold text-forest-800">{stats.followers}</p><p className="text-[9px] text-gray-500 font-bold">👥 Followers</p></div>
      </div>

      {profile?.role === "admin" && (
        <div className="px-4 mt-4">
          <div className="glass-card p-3 rounded-2xl border-2 border-amber-400">
            <p className="text-sm font-extrabold text-amber-700 mb-2">🛡️ ADMIN CONTROL ROOM</p>
            <div className="grid grid-cols-2 gap-2">
              {ADMIN_TOOLS.map((t) => (                <Link key={t.href} href={t.href} className="bg-amber-50 hover:bg-amber-100 p-3 rounded-xl text-center active:scale-95 transition-transform">
                  <p className="text-xl">{t.icon}</p>
                  <p className="text-[10px] font-bold text-amber-800 mt-1">{t.label}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="px-4 mt-4 grid grid-cols-2 gap-2">
        <Link href="/wallet" className="glass-card p-3 rounded-2xl text-center text-xs font-bold text-forest-700">💰 Wallet & Verification</Link>
        <Link href="/achievements" className="glass-card p-3 rounded-2xl text-center text-xs font-bold text-forest-700">🏅 Achievements</Link>
        <Link href="/inbox" className="glass-card p-3 rounded-2xl text-center text-xs font-bold text-forest-700">📬 Inbox</Link>
        <Link href={`/farmer/${user.id}`} className="glass-card p-3 rounded-2xl text-center text-xs font-bold text-forest-700">👀 Public Page</Link>
      </div>

      <form onSubmit={save} className="px-4 mt-4 space-y-2">
        <p className="text-sm font-bold">✏️ Edit Profile</p>
        {msg && <p className="text-xs font-bold text-green-700">{msg}</p>}
        <input className="w-full p-3 rounded-xl border border-gray-200 bg-white/70 text-sm" placeholder="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        <textarea className="w-full p-3 rounded-xl border border-gray-200 bg-white/70 text-sm" rows={3} placeholder="Bio — what do you farm or build?" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        <input className="w-full p-3 rounded-xl border border-gray-200 bg-white/70 text-sm" placeholder="WhatsApp number (for customer sheet & deliveries)" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
        <button className="w-full bg-green-600 text-white py-3 rounded-xl font-extrabold disabled:opacity-50" disabled={busy}>{busy ? "Saving..." : "💾 Save Changes"}</button>
      </form>
    </div>
  );
}