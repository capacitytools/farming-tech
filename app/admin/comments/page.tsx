"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminComments() {
  const [comments, setComments] = useState<any[]>([]);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase
      .from("blog_comments")
      .select("*, profiles(full_name), blogs(title, slug)")
      .order("created_at", { ascending: false })
      .limit(50);
    setComments(data || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id: string) {
    if (!confirm("Delete this comment?")) return;
    const supabase = createClient();
    await supabase.from("blog_comments").delete().eq("id", id);
    load();
  }

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">💬 Moderate Comments</h1>
      <div className="space-y-3">
        {comments.length ? (
          comments.map((c) => (
            <div key={c.id} className="glass-card p-4 rounded-2xl">
              <div className="flex items-center justify-between mb-1">
                <p className="font-bold text-sm">{c.profiles?.full_name || "User"}</p>
                <button onClick={() => remove(c.id)} className="text-red-600 text-sm font-semibold">Delete</button>
              </div>
              <p className="text-sm text-gray-700">{c.content}</p>
              <p className="text-[10px] text-gray-400 mt-2">
                on <b>{c.blogs?.title || "deleted post"}</b> · {new Date(c.created_at).toLocaleDateString()}
              </p>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-10">No comments yet.</p>
        )}
      </div>
    </div>
  );
}