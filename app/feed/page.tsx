"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import VideoCard from "@/components/VideoCard";
import VideoComposer from "@/components/VideoComposer";
import AdBar from "@/components/AdBar";
import AdBanner from "@/components/AdBanner";

export default function FeedPage() {
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [likes, setLikes] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [image, setImage] = useState("");
  const [busy, setBusy] = useState(false);
  const [openC, setOpenC] = useState("");
  const [cText, setCText] = useState("");
  const [showVideo, setShowVideo] = useState(false);
  const [loaded, setLoaded] = useState(false);

  async function load() {
    const supabase = createClient();
    const [p, l, c, v] = await Promise.all([
      supabase.from("feed_posts").select("*, profiles(full_name, avatar_url, referral_code, role, verified), ad:ad_campaigns(*)").order("created_at", { ascending: false }).limit(30),
      supabase.from("feed_likes").select("post_id, user_id"),
      supabase.from("feed_comments").select("*, profiles(full_name)").order("created_at", { ascending: true }),
      supabase.from("videos").select("*, profiles(full_name, avatar_url, verified, role, referral_code)").eq("context", "feed").order("created_at", { ascending: false }).limit(10),
    ]);
    setPosts(p.data || []);
    setLikes(l.data || []);
    setComments(c.data || []);
    setVideos(v.data || []);
    (p.data || []).slice(0, 10).forEach((post: any) => supabase.rpc("bump_feed_views", { pid: post.id }));
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

  async function uploadImage(e: any) {    const file = e.target.files?.[0];
    if (!file) return;
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `feed-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("blog-images").upload(path, file);
    if (!error) setImage(supabase.storage.from("blog-images").getPublicUrl(path).data.publicUrl);
  }

  async function publish(e: any) {
    e.preventDefault();
    if (!content.trim() || !user) return;
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

  async function deleteVideo(id: string) {
    if (!confirm("Delete this video?")) return;
    const supabase = createClient();    await supabase.from("videos").delete().eq("id", id);
    load();
  }

  function share(item: any, network: string) {
    const ref = item.profiles?.referral_code || "";
    const url = `${window.location.origin}/post/${item.id}?ref=${ref}`;
    const text = `${(item.content || item.title || "").slice(0, 120)} 🌾 Join, Learn, Grow, Connect & Earn on Farming Tech & Business!`;
    const en = encodeURIComponent;
    const media = item.image_url || "";
    const links: any = {
      wa: `https://wa.me/?text=${en(text + " " + url)}`,
      fb: `https://www.facebook.com/sharer/sharer.php?u=${en(url)}`,
      x: `https://twitter.com/intent/tweet?text=${en(text)}&url=${en(url)}`,
      pin: `https://pinterest.com/pin/create/button/?url=${en(url)}&media=${en(media)}&description=${en(text)}`,
    };
    if (network === "copy") navigator.clipboard.writeText(url);
    else if (network === "status") {
      navigator.clipboard.writeText(text + " " + url);
      window.open("https://wa.me/", "_blank");
    } else window.open(links[network], "_blank");
  }

  if (!loaded) return <p className="text-center text-gray-500 py-10">Loading…</p>;

  const timeline = [
    ...posts.map((p) => ({ ...p, kind: "post" })),
    ...videos.map((v) => ({ ...v, kind: "video" })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">📣 Farmer Timeline</h1>
      <p className="text-gray-600 text-xs mb-4">Posts · videos · likes · comments — every action earns points! ✅ = verified</p>

      {user && (
        <div className="mb-5 space-y-3">
          <form onSubmit={publish} className="glass-card p-4 rounded-2xl">
            <textarea className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" rows={2} placeholder="What's happening on your farm today?" value={content} onChange={(e) => setContent(e.target.value)} />
            <div className="flex items-center gap-3 mt-2">
              <label className="text-sm font-semibold text-green-700 cursor-pointer">📷 Photo<input type="file" accept="image/*" onChange={uploadImage} className="hidden" /></label>
              <button type="button" onClick={() => setShowVideo(!showVideo)} className="text-sm font-semibold text-forest-700">🎬 Video</button>
              {image && <img src={image} alt="" className="h-10 w-10 object-cover rounded-lg" />}
              <button className="ml-auto bg-green-600 text-white px-5 py-2 rounded-xl text-sm font-bold disabled:opacity-50" disabled={busy}>Post</button>
            </div>
          </form>
          {showVideo && <VideoComposer context="feed" onDone={() => { setShowVideo(false); load(); }} />}
        </div>
      )}
      <div className="space-y-4">
        {timeline.map((item: any, idx: number) => (
          <div key={`${item.kind}-${item.id}`}>
            {item.kind === "video" ? (
              <div>
                <VideoCard video={item} />
                {(user?.id === item.author_id || user?.role === "admin") && (
                  <button onClick={() => deleteVideo(item.id)} className="text-red-500 text-xs font-semibold mt-1">Delete video</button>
                )}
              </div>
            ) : (
              <div className="glass-card p-4 rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <Link href={`/farmer/${item.author_id}`}>
                    {item.profiles?.avatar_url ? (
                      <img src={item.profiles.avatar_url} className="w-10 h-10 rounded-full object-cover" alt="" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center font-bold text-green-800">{item.profiles?.full_name?.[0] || "?"}</div>
                    )}
                  </Link>
                  <div className="flex-1">
                    <p className="font-bold text-sm">
                      <Link href={`/farmer/${item.author_id}`} className="hover:underline">{item.profiles?.full_name || "Farmer"}</Link>
                      {item.profiles?.verified && <span className="ml-1 text-sky-500">✅</span>}
                      {item.profiles?.role === "admin" && <span className="ml-1 text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-bold">ADMIN</span>}
                    </p>
                    <p className="text-[10px] text-gray-400">{new Date(item.created_at).toLocaleDateString()} · 👁️ {item.views_count || 0}</p>
                  </div>
                  {user?.id === item.author_id && (
                    <button onClick={() => deletePost(item.id)} className="text-red-500 text-xs font-semibold">Delete</button>
                  )}
                </div>

                <p className="text-sm text-gray-800 whitespace-pre-line">{item.content}</p>
                {item.image_url && <img src={item.image_url} alt="" className="mt-2 w-full h-64 object-cover rounded-xl" />}

                {item.ad && (
                  <div className="mt-3 rounded-xl overflow-hidden border border-amber-300">
                    <AdBar ad={item.ad} />
                  </div>
                )}

                {(() => {
                  const postLikes = likes.filter((l) => l.post_id === item.id);
                  const myLike = user && postLikes.find((l) => l.user_id === user.id);
                  const postComments = comments.filter((c) => c.post_id === item.id);
                  return (
                    <>
                      <div className="flex items-center gap-3 mt-3 pt-2 border-t border-gray-100 text-xs font-bold text-gray-600 flex-wrap">
                        <button onClick={() => toggleLike(item.id)} className={myLike ? "text-red-600" : ""}>❤️ {postLikes.length}</button>                        <button onClick={() => setOpenC(openC === item.id ? "" : item.id)} className="text-green-700">💬 {postComments.length}</button>
                        <button onClick={() => share(item, "wa")} className="ml-auto" title="WhatsApp">📤</button>
                        <button onClick={() => share(item, "status")} title="WhatsApp Status (copies caption)">🟢</button>
                        <button onClick={() => share(item, "fb")} title="Facebook">f</button>
                        <button onClick={() => share(item, "x")} title="X / Twitter">𝕏</button>
                        <button onClick={() => share(item, "pin")} title="Pinterest">📌</button>
                        <button onClick={() => share(item, "copy")} title="Copy link">🔗</button>
                      </div>
                      {openC === item.id && (
                        <div className="mt-3 space-y-2">
                          {postComments.map((c) => (
                            <div key={c.id} className="bg-white/70 p-2 rounded-xl text-xs">
                              <span className="font-bold">{c.profiles?.full_name || "Farmer"}:</span> {c.content}
                            </div>
                          ))}
                          {user && (
                            <div className="flex gap-2">
                              <input className="flex-1 p-2 rounded-xl border border-gray-200 bg-white/70 text-xs" placeholder="Write a comment (+3 pts)..." value={cText} onChange={(e) => setCText(e.target.value)} />
                              <button onClick={() => addComment(item.id)} className="bg-green-600 text-white px-3 rounded-xl text-xs font-bold">Send</button>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            {/* SMALL ADSTERRA AD every 3rd post = revenue per scroll */}
            {(idx + 1) % 3 === 0 && (
              <div className="mt-4">
                <AdBanner type="native" />
              </div>
            )}
          </div>
        ))}
        {timeline.length === 0 && <p className="text-center text-gray-500 py-10">No posts yet — be the first to share! 🌾</p>}
      </div>
    </div>
  );
}