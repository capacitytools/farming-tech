"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function TribeDetailPage() {
  const [slug, setSlug] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [tribe, setTribe] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [joined, setJoined] = useState(false);
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data: t } = await supabase.from("tribes").select("*").eq("slug", slug).single();
    setTribe(t);
    if (t) {
      const { data: p } = await supabase
        .from("tribe_posts")
        .select("*, profiles(full_name, avatar_url)")
        .eq("tribe_id", t.id)
        .order("created_at", { ascending: false });
      setPosts(p || []);
      const { data: { user: u } } = await supabase.auth.getUser();
      setUser(u);
      if (u) {
        const { data: mem } = await supabase
          .from("tribe_members")
          .select("id")
          .eq("tribe_id", t.id)
          .eq("user_id", u.id)
          .maybeSingle();
        setJoined(!!mem);
      }
    }
    setLoaded(true);
  }

  useEffect(() => {
    setSlug(decodeURIComponent(window.location.pathname.split("/").pop() || ""));
  }, []);

  useEffect(() => {
    if (slug) load();
  }, [slug]);

  async function toggleJoin() {    if (!user) return;
    setBusy(true);
    const supabase = createClient();
    if (joined) await supabase.rpc("leave_tribe", { t_id: tribe.id });
    else await supabase.rpc("join_tribe", { t_id: tribe.id });
    await load();
    setBusy(false);
  }

  async function submitPost(e: any) {
    e.preventDefault();
    if (!content.trim() || !user) return;
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.from("tribe_posts").insert({
      tribe_id: tribe.id,
      author_id: user.id,
      content: content.trim(),
    });
    if (!error) setContent("");
    await load();
    setBusy(false);
  }

  if (!loaded) return <p className="text-center text-gray-500 py-10">Loading…</p>;
  if (!tribe) return <div className="p-8 text-center text-gray-500">Tribe not found</div>;

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <div className="glass-card p-5 rounded-2xl shadow-lg text-center mb-6">
        <span className="text-6xl">{tribe.icon}</span>
        <h1 className="text-2xl font-bold mt-2">{tribe.name}</h1>
        <p className="text-gray-600 text-sm mt-1">{tribe.description}</p>
        <p className="text-sm text-green-600 font-semibold mt-2">👥 {tribe.member_count} members</p>
        {user ? (
          <button
            onClick={toggleJoin}
            disabled={busy}
            className={`mt-4 px-6 py-2 rounded-xl font-semibold text-white ${joined ? "bg-gray-500" : "bg-green-600"}`}
          >
            {joined ? "✅ Joined — tap to leave" : "➕ Join this tribe"}
          </button>
        ) : (
          <a href="/login" className="inline-block mt-4 bg-green-600 text-white px-6 py-2 rounded-xl font-semibold">
            Log in to join & post
          </a>
        )}
      </div>

      {user && joined && (        <form onSubmit={submitPost} className="glass-card p-4 rounded-2xl mb-6">
          <textarea
            className="w-full p-3 rounded-xl border border-gray-200 bg-white/70"
            rows={3}
            placeholder={`Share something with ${tribe.name}...`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <button className="w-full mt-3 bg-green-600 text-white py-2 rounded-xl font-semibold disabled:opacity-50" disabled={busy}>
            📣 Post to tribe
          </button>
        </form>
      )}

      {user && !joined && (
        <p className="text-center text-sm text-gray-500 mb-6">Join this tribe to post. 👆</p>
      )}

      <h2 className="text-xl font-bold mb-4">💬 Recent Discussions</h2>
      <div className="space-y-4">
        {posts.length > 0 ? (
          posts.map((post) => (
            <div key={post.id} className="glass-card p-4 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center font-bold text-green-800">
                  {post.profiles?.full_name?.[0] || "?"}
                </div>
                <div>
                  <span className="font-semibold text-sm">{post.profiles?.full_name || "Farmer"}</span>
                  <p className="text-[10px] text-gray-400">{new Date(post.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <p className="text-gray-800 text-sm">{post.content}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-4">No posts yet. Be the first!</p>
        )}
      </div>
    </div>
  );
}