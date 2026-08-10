"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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

  const filtered = filter === "All" ? blogs : blogs.filter((b) => b.category === filter);

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">📝 Manage Blog Posts</h1>
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap ${filter === cat ? "bg-green-600 text-white" : "bg-gray-200"}`}
          >
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
                  <p className="text-xs text-gray-500 mt-1">{b.category || "Uncategorized"} · {b.status}</p>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{b.excerpt}</p>
                  <div className="flex gap-2 mt-2">
                    <a href={`/admin/blogs/edit?id=${b.id}`} className="text-blue-600 text-sm font-semibold">Edit</a>
                    <button onClick={() => deleteBlog(b.id)} className="text-red-600 text-sm font-semibold">Delete</button>
                    <button onClick={() => copyLink(b.slug)} className="text-green-600 text-sm font-semibold">Copy Link</button>
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
