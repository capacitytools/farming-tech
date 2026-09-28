"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { uploadToCloudinary } from "@/lib/upload";

function slugify(t: string) {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function AdminBlogsPage() {
  const [admin, setAdmin] = useState(false);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", category: "Farming", content: "" });
  const [cover, setCover] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [loaded, setLoaded] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: p } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      setAdmin(p?.role === "admin");
    }
    const { data } = await supabase.from("blogs").select("*").order("created_at", { ascending: false });
    setBlogs(data || []);
    setLoaded(true);
  }

  useEffect(() => { load(); }, []);

  async function uploadCoverFn(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadToCloudinary(file, "blog-covers");
      setCover(url);
    } catch (err: any) {
      alert("Upload failed: " + (err && err.message ? err.message : "check connection and try again"));
    }
  }

  async function save(e: any) {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return alert("Title and content are required.");    setBusy(true);
    const supabase = createClient();
    const payload = {
      title: form.title.trim(),
      category: form.category.trim() || "Farming",
      content: form.content,
      cover_image_url: cover || null,
      slug: slugify(form.title) + (editId ? "" : "-" + Date.now().toString().slice(-4)),
    };
    if (editId) await supabase.from("blogs").update(payload).eq("id", editId);
    else await supabase.from("blogs").insert(payload);
    setMsg(editId ? "✅ Post updated!" : "✅ Published! It also flows to your Facebook page via the RSS feed.");
    setForm({ title: "", category: "Farming", content: "" });
    setCover("");
    setEditId(null);
    setShowForm(false);
    setTimeout(() => setMsg(""), 3000);
    await load();
    setBusy(false);
  }

  async function blastPost(b: any) {
    const supabase = createClient();
    try {
      await supabase.from("announcements").insert({
        title: "📰 " + b.title,
        body: (b.content || "").slice(0, 120) + "...",
        link: "/blog/" + b.slug,
        emoji: "📰",
      });
      alert("📢 Blasted! Every member now sees this post at the top of every page.");
    } catch {
      alert("Megaphone table not ready yet — run the Megaphone SQL first.");
    }
  }

  function startEdit(b: any) {
    setEditId(b.id);
    setForm({ title: b.title, category: b.category || "Farming", content: b.content });
    setCover(b.cover_image_url || "");
    setShowForm(true);
    window.scrollTo({ top: 0 });
  }

  async function remove(id: string) {
    if (!confirm("Delete this blog post forever?")) return;
    const supabase = createClient();
    await supabase.from("blogs").delete().eq("id", id);
    load();
  }
  if (!loaded) return <p className="text-center text-gray-500 py-10">Loading…</p>;
  if (!admin) return <p className="text-center text-gray-500 py-10">🛡️ Admin access only.</p>;

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-extrabold">📰 Blog Control Room</h1>
        <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ title: "", category: "Farming", content: "" }); setCover(""); }} className="text-xs font-bold bg-forest-600 text-white px-3 py-2 rounded-full">➕ Quick Post</button>
      </div>
      <p className="text-xs text-gray-500 mb-3">Publish, edit, blast and delete. Every post auto-joins the RSS feed → your Facebook page.</p>

      <Link href="/admin/article-engine" className="block bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-2xl font-extrabold text-center mb-4 active:scale-[0.98]">
        🧠 OPEN THE AI ARTICLE & SEO ENGINE →
        <span className="block text-[10px] font-semibold text-purple-200">intent · keywords · schema · audit · social pack</span>
      </Link>

      {msg && <p className="text-xs font-bold text-green-700 mb-3">{msg}</p>}

      {showForm && (
        <form onSubmit={save} className="glass-card p-4 rounded-2xl space-y-2 mb-6 border-2 border-forest-300">
          <p className="text-sm font-bold text-forest-700">{editId ? "✏️ Edit Post" : "📝 Quick Blog Post"}</p>
          <input className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" placeholder="Title (catchy!)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" placeholder="Category (Farming / Tech / Business)" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <label className="block text-xs font-semibold text-green-700 cursor-pointer">🖼️ Cover image
            <input type="file" accept="image/*" className="hidden" onChange={uploadCoverFn} />
          </label>
          {cover && <img src={cover} alt="" className="h-20 w-full object-cover rounded-xl" />}
          <textarea className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" rows={10} placeholder="Write the full article here... (blank lines between paragraphs)" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          <button className="w-full bg-green-600 text-white py-2.5 rounded-xl text-sm font-bold disabled:opacity-50" disabled={busy}>{busy ? "Saving..." : "🚀 Publish"}</button>
        </form>
      )}

      <div className="space-y-2">
        {blogs.map((b) => (
          <div key={b.id} className="glass-card p-3 rounded-2xl flex items-center gap-2">
            {b.cover_image_url ? <img src={b.cover_image_url} alt="" className="w-12 h-12 object-cover rounded-lg" /> : <div className="w-12 h-12 bg-forest-100 rounded-lg flex items-center justify-center">📰</div>}
            <div className="flex-1 min-w-0">
              <Link href={"/blog/" + b.slug} className="text-sm font-bold line-clamp-1 hover:underline">{b.title}</Link>
              <p className="text-[10px] text-gray-500">{b.category} · 👁️ {b.views_count || 0} · {b.status || "published"} · {new Date(b.created_at).toLocaleDateString()}</p>
            </div>
            <button onClick={() => blastPost(b)} title="Blast to all members" className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-2 rounded-xl">📢</button>
            <button onClick={() => startEdit(b)} className="text-xs font-bold text-forest-700 bg-forest-50 px-2 py-2 rounded-xl">✏️</button>
            <button onClick={() => remove(b.id)} className="text-xs font-bold text-red-500 bg-red-50 px-2 py-2 rounded-xl">🗑</button>
          </div>
        ))}
        {blogs.length === 0 && <p className="text-sm text-gray-500 text-center py-8">No posts yet — publish your first insight!</p>}
      </div>
    </div>
  );}