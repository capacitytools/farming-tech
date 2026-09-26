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
  { href: "/admin/blogs", icon: "📰", label: "Blog Control Room" },
  { href: "/admin/ads", icon: "📣", label: "Ad Switch Manager" },
  { href: "/admin/bills", icon: "🧾", label: "Bills Fulfilment Desk" },
  { href: "/admin/moderation", icon: "🚩", label: "Reports & Moderation" },
  { href: "/admin/payouts", icon: "💰", label: "Payouts & Points" },
  { href: "/leaderboard", icon: "🏆", label: "Leaderboard Control" },
];

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [view, setView] = useState<"member" | "admin">("member");
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 });
  const [adminStats, setAdminStats] = useState<any>(null);
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
      if (p) {
        setForm({ full_name: p.full_name || "", bio: p.bio || "", whatsapp: p.whatsapp || "" });
        if (p.role === "admin" && localStorage.getItem("ftb_adminview") === "admin") setView("admin");
      }
      setStats({ posts: pc || 0, followers: fc || 0, following: gc || 0 });
      if (p?.role === "admin") {
        const [m, fp, eb, ll, rp, pu] = await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("feed_posts").select("*", { count: "exact", head: true }),
          supabase.from("ebooks").select("*", { count: "exact", head: true }),
          supabase.from("livestock_listings").select("*", { count: "exact", head: true }),
          supabase.from("reports").select("*", { count: "exact", head: true }),
          supabase.from("ebook_purchases").select("*", { count: "exact", head: true }),
        ]);
        setAdminStats({ members: m.count || 0, posts: fp.count || 0, ebooks: eb.count || 0, listings: ll.count || 0, reports: rp.count || 0, sales: pu.count || 0 });
      }
    }
    setLoaded(true);
  }

  useEffect(() => { load(); }, []);

  function switchView(v: "member" | "admin") {
    setView(v);
    localStorage.setItem("ftb_adminview", v);
  }

  async function uploadAvatar(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;
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
    const supabase = createClient();    await supabase.from("profiles").update({
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
      <div className="p-6 pb-24 max-w-md mx-auto text-center">
        <div className="glass-card p-6 rounded-2xl">
          <p className="text-4xl mb-2">🔐</p>
          <h1 className="text-xl font-extrabold mb-1">My Dashboard</h1>
          <p className="text-sm text-gray-500 mb-4">Log in to see your points, posts and profile tools.</p>
          <Link href="/login" className="block bg-green-600 text-white py-3 rounded-xl font-extrabold">🔓 Log In / Register Free</Link>
        </div>
      </div>
    );
  }

  const isAdmin = profile?.role === "admin";

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
              <img src={avatar || profile.avatar_url} alt="" className="w-20 h-20 rounded-full object-cover border-4 border-white" />            ) : (
              <div className="w-20 h-20 rounded-full bg-green-200 border-4 border-white flex items-center justify-center text-2xl font-extrabold text-green-800">{(profile?.full_name || "?")[0]}</div>
            )}
            <label className="absolute -bottom-1 -right-1 bg-green-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs cursor-pointer">📷
              <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
            </label>
          </div>
          <div className="flex-1 pb-1">
            <h1 className="text-lg font-extrabold">{profile?.full_name || "Farmer"} {profile?.verified && "✅"}</h1>
            <p className="text-[10px] text-gray-500">@{profile?.referral_code || "—"} · {isAdmin ? "🛡️ Admin" : "🌾 Member"}</p>
          </div>
          <button onClick={logout} className="text-[10px] font-bold text-red-500 pb-1">Log out</button>
        </div>
      </div>

      {isAdmin && (
        <div className="px-4 mt-4">
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button onClick={() => switchView("member")} className={`flex-1 py-2.5 rounded-lg text-sm font-extrabold ${view === "member" ? "bg-white shadow text-forest-700" : "text-gray-500"}`}>🌾 Member View</button>
            <button onClick={() => switchView("admin")} className={`flex-1 py-2.5 rounded-lg text-sm font-extrabold ${view === "admin" ? "bg-amber-400 shadow text-amber-900" : "text-gray-500"}`}>🛡️ Admin View</button>
          </div>
        </div>
      )}

      {isAdmin && view === "admin" ? (
        <div className="px-4 mt-4 space-y-4">
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-4 rounded-2xl">
            <p className="text-sm font-extrabold">🛡️ ADMIN CONTROL ROOM</p>
            <p className="text-[10px] text-amber-100 mt-0.5">Full command over the platform — content, money, people and traffic.</p>
          </div>

          {adminStats && (
            <div className="grid grid-cols-3 gap-2">
              <div className="glass-card p-2 rounded-2xl text-center"><p className="text-lg font-extrabold text-forest-800">{adminStats.members}</p><p className="text-[8px] text-gray-500 font-bold">👥 Members</p></div>
              <div className="glass-card p-2 rounded-2xl text-center"><p className="text-lg font-extrabold text-forest-800">{adminStats.posts}</p><p className="text-[8px] text-gray-500 font-bold">📣 Posts</p></div>
              <div className="glass-card p-2 rounded-2xl text-center"><p className="text-lg font-extrabold text-green-700">{adminStats.sales}</p><p className="text-[8px] text-gray-500 font-bold">📚 Book Sales</p></div>
              <div className="glass-card p-2 rounded-2xl text-center"><p className="text-lg font-extrabold text-forest-800">{adminStats.ebooks}</p><p className="text-[8px] text-gray-500 font-bold">📚 Ebooks</p></div>
              <div className="glass-card p-2 rounded-2xl text-center"><p className="text-lg font-extrabold text-forest-800">{adminStats.listings}</p><p className="text-[8px] text-gray-500 font-bold">🐄 Listings</p></div>
              <div className="glass-card p-2 rounded-2xl text-center"><p className="text-lg font-extrabold text-red-500">{adminStats.reports}</p><p className="text-[8px] text-gray-500 font-bold">🚩 Reports</p></div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {ADMIN_TOOLS.map((t) => (
              <Link key={t.href} href={t.href} className="glass-card p-3 rounded-2xl text-center border-2 border-amber-300 active:scale-95 transition-transform">
                <p className="text-2xl">{t.icon}</p>
                <p className="text-[10px] font-extrabold text-amber-800 mt-1">{t.label}</p>
              </Link>
            ))}
          </div>
          <div className="glass-card p-3 rounded-2xl">
            <p className="text-[10px] text-gray-500">🛡️ Admin View is visible only to accounts with the admin role. Members always see the Member View only.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 px-4 mt-4">
            <div className="glass-card p-3 rounded-2xl text-center"><p className="text-lg font-extrabold text-forest-800">{profile?.points || 0}</p><p className="text-[9px] text-gray-500 font-bold">💎 Points</p></div>
            <div className="glass-card p-3 rounded-2xl text-center"><p className="text-lg font-extrabold text-forest-800">{stats.posts}</p><p className="text-[9px] text-gray-500 font-bold">📣 Posts</p></div>
            <div className="glass-card p-3 rounded-2xl text-center"><p className="text-lg font-extrabold text-forest-800">{stats.followers}</p><p className="text-[9px] text-gray-500 font-bold">👥 Followers</p></div>
          </div>

          <div className="px-4 mt-4 grid grid-cols-2 gap-2">
            <Link href="/wallet" className="glass-card p-3 rounded-2xl text-center text-xs font-bold text-forest-700">💰 Wallet & Verification</Link>
            <Link href="/achievements" className="glass-card p-3 rounded-2xl text-center text-xs font-bold text-forest-700">🏅 Achievements</Link>
            <Link href="/inbox" className="glass-card p-3 rounded-2xl text-center text-xs font-bold text-forest-700">📬 Inbox</Link>
            <Link href={`/farmer/${user.id}`} className="glass-card p-3 rounded-2xl text-center text-xs font-bold text-forest-700">👀 Public Page</Link>
          </div>
        </>
      )}

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