"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function FeedPage() {
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [likes, setLikes] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [image, setImage] = useState("");
  const [busy, setBusy] = useState(false);
  const [openC, setOpenC] = useState("");
  const [cText, setCText] = useState("");
  const [loaded, setLoaded] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data: p } = await supabase.from("feed_posts").select("*, profiles(full_name, avatar_url, referral_code, role)").order("created_at", { ascending: false }).limit(30);
    const { data: l } = await supabase.from("feed_likes").select("post_id, user_id");
    const { data: c } = await supabase.from("feed_comments").select("*, profiles(full_name)").order("created_at", { ascending: true });
    setPosts(p || []);
    setLikes(l || []);
    setComments(c || []);
    (p || []).slice(0, 10).forEach((post: any) => supabase.rpc("bump_feed_views", { pid: post.id }));
    setLoaded(true);
  }

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user: u } } = await supabase.auth.getUser();
      setUser(u);
      await load();
    })();
  }, []);

  async function uploadImage(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `feed-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("blog-images").upload(path, file);
    if (!error) setImage(supabase.storage.from("blog-images").getPublicUrl(path).data.publicUrl);
  }

  async function publish(e: any) {
    e.preventDefault();    if (!content.trim() || !user) return;
    setBusy(true);
    const supabase = createClient();
    await supabase.from("feed_posts").insert({ author_id: user.id, content: content.trim(), image_url: image || null });
    setContent("");
    setImage("");
    await load();
    setBusy(false);
  }

  async function toggleLike(postId: string) {
    if (!user) return;
    const supabase = createClient();
    const mine = likes.find((l) => l.post_id === postId && l.user_id === user.id);
    if (mine) await supabase.from("feed_likes").delete().eq("id", mine.id);
    else await supabase.from("feed_likes").insert({ post_id: postId, user_id: user.id });
    const { data: l } = await supabase.from("feed_likes").select("post_id, user_id");
    setLikes(l || []);
  }

  async function addComment(postId: string) {
    if (!cText.trim() || !user) return;
    const supabase = createClient();
    await supabase.from("feed_comments").insert({ post_id: postId, user_id: user.id, content: cText.trim() });
    setCText("");
    const { data: c } = await supabase.from("feed_comments").select("*, profiles(full_name)").order("created_at", { ascending: true });
    setComments(c || []);
  }

  async function deletePost(id: string) {
    if (!confirm("Delete this post?")) return;
    const supabase = createClient();
    await supabase.from("feed_posts").delete().eq("id", id);
    load();
  }

  function share(post: any, network: string) {
    const ref = post.profiles?.referral_code || "";
    const url = `${window.location.origin}/feed?ref=${ref}`;
    const text = `"${post.content.slice(0, 100)}" — join me on Farming Tech & Business 🌾`;
    const e = encodeURIComponent;
    const links: any = {
      wa: `https://wa.me/?text=${e(text + " " + url)}`,
      fb: `https://www.facebook.com/sharer/sharer.php?u=${e(url)}`,
      x: `https://twitter.com/intent/tweet?text=${e(text)}&url=${e(url)}`,
    };
    if (network === "copy") navigator.clipboard.writeText(url);
    else window.open(links[network], "_blank");
  }
  if (!loaded) return <p className="text-center text-gray-500 py-10">Loading…</p>;

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">📣 Farmer Timeline</h1>
      <p className="text-gray-600 text-xs mb-4">Share updates · like & comment · every action earns points! Sharing brings you referrals 🎁</p>

      {user ? (
        <form onSubmit={publish} className="glass-card p-4 rounded-2xl mb-5">
          <textarea className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" rows={2} placeholder="What's happening on your farm today?" value={content} onChange={(e) => setContent(e.target.value)} />
          <div className="flex items-center gap-3 mt-2">
            <label className="text-sm font-semibold text-green-700 cursor-pointer">📷 Photo<input type="file" accept="image/*" onChange={uploadImage} className="hidden" /></label>
            {image && <img src={image} alt="" className="h-10 w-10 object-cover rounded-lg" />}
            <button className="ml-auto bg-green-600 text-white px-5 py-2 rounded-xl text-sm font-bold disabled:opacity-50" disabled={busy}>Post</button>
          </div>
        </form>
      ) : (
        <p className="glass-card p-4 rounded-2xl mb-5 text-sm text-gray-600"><a href="/login" className="text-green-700 font-bold">Log in</a> to post, like & comment.</p>
      )}

      <div className="space-y-4">
        {posts.map((post) => {
          const postLikes = likes.filter((l) => l.post_id === post.id);
          const myLike = user && postLikes.find((l) => l.user_id === user.id);
          const postComments = comments.filter((c) => c.post_id === post.id);
          return (
            <div key={post.id} className="glass-card p-4 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                {post.profiles?.avatar_url ? (
                  <img src={post.profiles.avatar_url} className="w-10 h-10 rounded-full object-cover" alt="" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center font-bold text-green-800">{post.profiles?.full_name?.[0] || "?"}</div>
                )}
                <div className="flex-1">
                  <p className="font-bold text-sm">{post.profiles?.full_name || "Farmer"} {post.profiles?.role === "admin" && <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-bold">ADMIN</span>}</p>
                  <p className="text-[10px] text-gray-400">{new Date(post.created_at).toLocaleDateString()} · 👁️ {post.views_count || 0}</p>
                </div>
                {(user?.id === post.author_id || user?.role === "admin") && (
                  <button onClick={() => deletePost(post.id)} className="text-red-500 text-xs font-semibold">Delete</button>
                )}
              </div>

              <p className="text-sm text-gray-800 whitespace-pre-line">{post.content}</p>
              {post.image_url && <img src={post.image_url} alt="" className="mt-2 w-full h-64 object-cover rounded-xl" />}

              <div className="flex items-center gap-4 mt-3 pt-2 border-t border-gray-100 text-xs font-bold text-gray-600">
                <button onClick={() => toggleLike(post.id)} className={myLike ? "text-red-600" : ""}>❤️ {postLikes.length}</button>
                <button onClick={() => setOpenC(openC === post.id ? "" : post.id)} className="text-green-700">💬 {postComments.length}</button>
                <button onClick={() => share(post, "wa")} className="ml-auto">📤</button>
                <button onClick={() => share(post, "fb")}>f</button>                <button onClick={() => share(post, "x")}>𝕏</button>
                <button onClick={() => share(post, "copy")}>🔗</button>
              </div>

              {openC === post.id && (
                <div className="mt-3 space-y-2">
                  {postComments.map((c) => (
                    <div key={c.id} className="bg-white/70 p-2 rounded-xl text-xs">
                      <span className="font-bold">{c.profiles?.full_name || "Farmer"}:</span> {c.content}
                    </div>
                  ))}
                  {user && (
                    <div className="flex gap-2">
                      <input className="flex-1 p-2 rounded-xl border border-gray-200 bg-white/70 text-xs" placeholder="Write a comment (+3 pts)..." value={cText} onChange={(e) => setCText(e.target.value)} />
                      <button onClick={() => addComment(post.id)} className="bg-green-600 text-white px-3 rounded-xl text-xs font-bold">Send</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {posts.length === 0 && <p className="text-center text-gray-500 py-10">No posts yet — be the first to share! 🌾</p>}
      </div>
    </div>
  );
}