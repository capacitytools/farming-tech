"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const CATEGORIES = ["All", "Animal", "Plants", "Business", "Tech", "Poultry", "Rabbits", "Goats", "Pigs", "Fish", "Crops"];

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [filter, setFilter] = useState("All");
  const [message, setMessage] = useState("");

  async function load() {
    const supabase = createClient();
    const { data } = await supabase.from("blogs").select("*").order("created_at", { ascending: false });
    setBlogs(data || []);
  }
  useEffect(() => {
    load();
  }, []);

  async function deleteBlog(id: string) {
    if (!confirm("Delete this blog?")) return;
    const supabase = createClient();
    await supabase.from("blogs").delete().eq("id", id);
    load();
  }

  function copyLink(slug: string) {
    const url = `https://farming-tech.vercel.app/blog/${slug}`;
    navigator.clipboard.writeText(url);
    setMessage("Link copied! ✅");
    setTimeout(() => setMessage(""), 2000);
  }

  function shareBlog(b: any, net: string) {
    const url = `https://farming-tech.vercel.app/blog/${b.slug}`;
    const caption = `🌾 ${b.title} — read free on Farming Tech & Business! 👨‍🌾 Practical tips for Nigerian farmers.`;
    const e = encodeURIComponent;
    if (net === "wa") window.open(`https://wa.me/?text=${e(caption + " " + url)}`);
    else window.open(`https://www.facebook.com/sharer/sharer.php?u=${e(url)}`);
  }

  const filtered = filter === "All" ? blogs : blogs.filter((b) => b.category === filter);

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4 gap-2">
        <h1 className="text-2xl font-bold">📝 Manage Blogs</h1>
        <div className="flex gap-2">
          <Link href="/admin/blogs/ai-writer" className="bg-purple-600 text-white px-3 py-2 rounded-xl font-semibold text-sm whitespace-nowrap">🤖 AI Writer</Link>
          <Link href="/admin/blogs/new" className="bg-green-600 text-white px-3 py-2 rounded-xl font-semibold text-sm whitespace-nowrap">✍️ Write New</Link>
        </div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {CATEGORIES.map((cat) => (
          <button key={cat} onClick={() => setFilter(cat)} className={`px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap ${filter === cat ? "bg-green-600 text-white" : "bg-gray-200"}`}>
            {cat}
          </button>
        ))}
      </div>

      {message && <p className="text-sm text-center text-green-700 mb-4">{message}</p>}

      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map((b) => (
            <div key={b.id} className="glass-card p-4 rounded-2xl">
              <div className="flex gap-3">
                {b.cover_image_url && <img src={b.cover_image_url} alt={b.title} className="w-20 h-20 object-cover rounded-lg" />}
                <div className="flex-1">
                  <h3 className="font-bold text-sm">{b.title}</h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                    <span>{b.category || "Uncategorized"}</span>
                    <span>·</span>
                    <span className={b.status === "published" ? "text-green-600 font-bold" : "text-yellow-600 font-bold"}>{b.status}</span>
                    <span>·</span>
                    <span className="font-semibold">👁️ {b.views_count || 0} views</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{b.excerpt}</p>
                  <div className="flex gap-3 mt-2 flex-wrap">
                    <a href={`/admin/blogs/edit?id=${b.id}`} className="text-blue-600 text-sm font-semibold">Edit</a>
                    <button onClick={() => deleteBlog(b.id)} className="text-red-600 text-sm font-semibold">Delete</button>
                    <button onClick={() => copyLink(b.slug)} className="text-green-600 text-sm font-semibold">Copy Link</button>
                    <button onClick={() => shareBlog(b, "wa")} className="text-green-700 text-sm font-semibold">📤 WhatsApp</button>
                    <button onClick={() => shareBlog(b, "fb")} className="text-blue-700 text-sm font-semibold">📘 Facebook</button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-10">No blogs in this category.</p>
        )}
      </div>
    </div>
  );
}