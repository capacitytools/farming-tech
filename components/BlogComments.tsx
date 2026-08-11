"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function BlogComments({ postId }: { postId: string }) {
  const [comments, setComments] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase
      .from("blog_comments")
      .select("*, profiles(full_name, avatar_url)")
      .eq("blog_id", postId)
      .order("created_at", { ascending: false });
    setComments(data || []);
    const { data: { user: u } } = await supabase.auth.getUser();
    setUser(u);
  }

  useEffect(() => {
    load();
  }, [postId]);

  async function submit(e: any) {
    e.preventDefault();
    if (!content.trim() || !user) return;
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.from("blog_comments").insert({ blog_id: postId, user_id: user.id, content: content.trim() });
    if (!error) {
      setContent("");
      load();
    }
    setBusy(false);
  }

  async function remove(id: string) {
    if (!confirm("Delete this comment?")) return;
    const supabase = createClient();
    await supabase.from("blog_comments").delete().eq("id", id);
    load();
  }

  return (
    <div className="mt-8 pt-6 border-t border-gray-200">
      <h2 className="text-xl font-bold mb-4">💬 Comments ({comments.length})</h2>

      {user ? (
        <form onSubmit={submit} className="glass-card p-4 rounded-2xl mb-4">
          <textarea className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" rows={2} placeholder="Share your thoughts or ask a question..." value={content} onChange={(e) => setContent(e.target.value)} />
          <button className="mt-2 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50" disabled={busy}>
            Post Comment
          </button>
        </form>
      ) : (
        <p className="text-sm text-gray-500 mb-4">
          <a href="/login" className="text-green-600 font-semibold">Log in</a> to join the discussion.
        </p>
      )}

      <div className="space-y-3">
        {comments.map((c) => (
          <div key={c.id} className="glass-card p-3 rounded-2xl">
            <div className="flex items-center gap-2 mb-1">
              {c.profiles?.avatar_url ? (
                <img src={c.profiles.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center text-xs font-bold text-green-800">
                  {c.profiles?.full_name?.[0] || "?"}
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm font-semibold">{c.profiles?.full_name || "Farmer"}</p>
                <p className="text-[10px] text-gray-400">{new Date(c.created_at).toLocaleDateString()}</p>
              </div>
              {c.user_id === user?.id && (
                <button onClick={() => remove(c.id)} className="text-red-500 text-xs font-semibold">Delete</button>
              )}
            </div>
            <p className="text-sm text-gray-800">{c.content}</p>
          </div>
        ))}
        {comments.length === 0 && <p className="text-sm text-gray-500">No comments yet — start the discussion!</p>}
      </div>
    </div>
  );
}