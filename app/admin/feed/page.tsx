"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminFeed() {
  const [posts, setPosts] = useState<any[]>([]);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase
      .from("feed_posts")
      .select("*, profiles(full_name), feed_likes(id), feed_comments(id)")
      .order("created_at", { ascending: false })
      .limit(50);
    setPosts(data || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id: string) {
    if (!confirm("Delete this post (and its likes/comments)?")) return;
    const supabase = createClient();
    await supabase.from("feed_posts").delete().eq("id", id);
    load();
  }

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">📣 Moderate Timeline</h1>
      <p className="text-gray-600 text-xs mb-6">Remove spam, scams or inappropriate posts. Deleting a post also removes its likes & comments.</p>

      <div className="space-y-3">
        {posts.map((p) => (
          <div key={p.id} className="glass-card p-4 rounded-2xl">
            <div className="flex items-center justify-between mb-1">
              <p className="font-bold text-sm">{p.profiles?.full_name || "Farmer"}</p>
              <button onClick={() => remove(p.id)} className="text-red-600 text-sm font-semibold">Delete</button>
            </div>
            <p className="text-sm text-gray-800 whitespace-pre-line">{p.content}</p>
            {p.image_url && <img src={p.image_url} alt="" className="mt-2 h-24 w-24 object-cover rounded-xl" />}
            <p className="text-[10px] text-gray-400 mt-2">
              ❤️ {(p.feed_likes || []).length} · 💬 {(p.feed_comments || []).length} · 👁️ {p.views_count || 0} · {new Date(p.created_at).toLocaleDateString()}
            </p>
          </div>
        ))}
        {posts.length === 0 && <p className="text-gray-500 text-center py-10">No posts yet.</p>}
      </div>
    </div>
  );
}