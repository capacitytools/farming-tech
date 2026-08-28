"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import VideoCard from "@/components/VideoCard";
import VideoComposer from "@/components/VideoComposer";
import AdBar from "@/components/AdBar";
import AdBanner from "@/components/AdBanner";

const PAYSTACK_PUBLIC_KEY = "pk_live_00573ba36a45a7fa73d358fee60ae30f5ce1dd49";

const REACTIONS = [
  { key: "like", e: "👍", label: "Like" },
  { key: "love", e: "❤️", label: "Love" },
  { key: "haha", e: "😂", label: "Haha" },
  { key: "wow", e: "😮", label: "Wow" },
  { key: "sad", e: "😢", label: "Sad" },
  { key: "angry", e: "😡", label: "Angry" },
];

function renderText(text: string) {
  const parts = (text || "").split(/(https?:\/\/[^\s]+|#[\w-]+|@[\w-]+)/g);
  return parts.map((p, i) => {
    if (p.match(/^https?:\/\//)) {
      return <a key={i} href={p} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all">{p}</a>;
    }
    if (p.startsWith("#")) {
      return <a key={i} href={"/search?q=" + encodeURIComponent(p)} className="text-green-700 font-bold hover:underline">{p}</a>;
    }
    if (p.startsWith("@")) {
      return <a key={i} href={"/search?q=" + encodeURIComponent(p.slice(1))} className="text-forest-700 font-bold hover:underline">{p}</a>;
    }
    return <span key={i}>{p}</span>;
  });
}

function loadScript(src: string) {
  return new Promise((res, rej) => {
    if ((window as any).PaystackPop) return res(true);
    const s = document.createElement("script");
    const t = setTimeout(() => rej(new Error("Paystack script timed out")), 10000);
    s.src = src;
    s.onload = () => { clearTimeout(t); res(true); };
    s.onerror = () => { clearTimeout(t); rej(new Error("Paystack script blocked or failed to load")); };
    document.body.appendChild(s);
  });
}

export default function FeedPage() {  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState("foryou");
  const [posts, setPosts] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [likes, setLikes] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [content, setContent] = useState("");
  const [image, setImage] = useState("");
  const [busy, setBusy] = useState(false);
  const [openC, setOpenC] = useState("");
  const [cText, setCText] = useState("");
  const [videoMode, setVideoMode] = useState<"" | "reel" | "video">("");
  const [pickerFor, setPickerFor] = useState("");
  const [reactorsFor, setReactorsFor] = useState("");
  const [reactors, setReactors] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  let holdTimer: any = null;

  async function load() {
    const supabase = createClient();
    const { data: { user: u } } = await supabase.auth.getUser();
    setUser(u);

    let fIds: string[] = [];
    if (u) {
      const { data: f } = await supabase.from("follows").select("following_id").eq("follower_id", u.id);
      fIds = (f || []).map((x: any) => x.following_id);
      setFollowingIds(fIds);
    }

    const [ranked, l, c, v] = await Promise.all([
      supabase.rpc("ranked_feed", { uid: u?.id || null }),
      supabase.from("feed_likes").select("id, post_id, user_id, reaction"),
      supabase.from("feed_comments").select("*, profiles(full_name)").order("created_at", { ascending: true }),
      supabase.from("videos").select("*, profiles(full_name, avatar_url, verified, role, referral_code)").eq("context", "feed").order("created_at", { ascending: false }).limit(10),
    ]);

    (ranked.data || []).slice(0, 10).forEach((post: any) => {
      const key = "viewed-" + post.id;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        supabase.rpc("bump_feed_views", { pid: post.id });
      }
    });

    let mapped = (ranked.data || []).map((r: any) => ({
      ...r,
      kind: "post",      profiles: { full_name: r.author_name, avatar_url: r.author_avatar, verified: r.author_verified },
    }));

    if (tab === "following" && u) {
      mapped = mapped.filter((p: any) => fIds.includes(p.author_id) || p.author_id === u.id);
    }

    setPosts(mapped);
    setLikes(l.data || []);
    setComments(c.data || []);
    setVideos(tab === "following" && u ? (v.data || []).filter((x: any) => fIds.includes(x.author_id) || x.author_id === u.id) : v.data || []);
    setLoaded(true);
  }

  useEffect(() => {
    load();
  }, [tab]);

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

  async function react(postId: string, reaction: string) {
    if (!user) return alert("Log in to react.");
    const supabase = createClient();
    const mine = likes.find((l) => l.post_id === postId && l.user_id === user.id);
    if (mine) {
      if (mine.reaction === reaction) await supabase.from("feed_likes").delete().eq("id", mine.id);
      else await supabase.from("feed_likes").update({ reaction }).eq("id", mine.id);
    } else {
      await supabase.from("feed_likes").insert({ post_id: postId, user_id: user.id, reaction });
    }    const { data: l } = await supabase.from("feed_likes").select("id, post_id, user_id, reaction");
    setLikes(l || []);
  }

  function startHold(id: string) {
    holdTimer = setTimeout(() => setPickerFor(id), 450);
  }
  function cancelHold() {
    if (holdTimer) clearTimeout(holdTimer);
  }

  async function openReactors(item: any) {
    const supabase = createClient();
    const { data } = await supabase.from("feed_likes").select("*, profiles(full_name, avatar_url)").eq("post_id", item.id).order("created_at", { ascending: false });
    setReactors(data || []);
    setReactorsFor(item.id);
  }

  async function boost(item: any) {
    if (!user) return alert("Log in first.");
    try {
      await loadScript("https://js.paystack.co/v1/inline.js");
      const pop = (window as any).PaystackPop;
      if (!pop || !pop.setup) throw new Error("PaystackPop not available on this browser");
      const handler = pop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: user.email,
        amount: 20000,
        ref: "boost-" + Date.now(),
        callback: function (resp: any) {
          (async () => {
            const supabase = createClient();
            await supabase.from("feed_posts").update({
              boosted_until: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
              boost_ref: resp.reference,
            }).eq("id", item.id);
            alert("🚀 Boosted! Your post sits on top of For You for 24 hours.");
            load();
          })();
        },
      });
      handler.openIframe();
    } catch (err: any) {
      alert("Payment error: " + (err && err.message ? err.message : "unknown error — screenshot this and send to admin"));
    }
  }

  async function reportPost(postId: string) {
    if (!user) return alert("Log in to report.");
    const reason = prompt("Why are you reporting this post? (e.g. spam, fake, abuse)");    if (!reason) return;
    const supabase = createClient();
    await supabase.from("reports").insert({ reporter_id: user.id, target_type: "post", target_id: postId, reason });
    alert("Reported. Our admin team will review it.");
  }

  async function addComment(postId: string) {
    if (!cText.trim() || !user) return;
    const supabase = createClient();
    await supabase.from("feed_comments").insert({ post_id: postId, user_id: user.id, content: cText.trim() });
    setCText("");
    const { data: c } = await supabase.from("feed_comments").select("*, profiles(full_name)").order("created_at", { ascending: true });
    setComments(c || []);
  }

  async function repost(item: any) {
    if (!user) return alert("Log in to share.");
    const supabase = createClient();
    await supabase.from("feed_posts").insert({
      author_id: user.id,
      content: "🔁 Shared from " + (item.profiles?.full_name || "a farmer") + ":\n\n" + (item.content || ""),
      image_url: item.image_url,
      shared_from: item.id,
    });
    await supabase.from("feed_posts").update({ shares_count: (item.shares_count || 0) + 1 }).eq("id", item.id);
    alert("✅ Shared to your timeline!");
    load();
  }

  async function deletePost(id: string) {
    if (!confirm("Delete this post?")) return;
    const supabase = createClient();
    await supabase.from("feed_posts").delete().eq("id", id);
    load();
  }

  async function deleteVideo(id: string) {
    if (!confirm("Delete this video?")) return;
    const supabase = createClient();
    await supabase.from("videos").delete().eq("id", id);
    load();
  }

  function share(item: any, network: string) {
    const ref = item.profiles?.referral_code || "";
    const url = `${window.location.origin}/post/${item.id}?ref=${ref}`;
    const text = `${(item.content || item.title || "").slice(0, 120)} 🌾 Join, Learn, Grow, Connect & Earn on Farming Tech & Business!`;
    const en = encodeURIComponent;
    const media = item.image_url || "";
    const links: any = {      wa: `https://wa.me/?text=${en(text + " " + url)}`,
      fb: `https://www.facebook.com/sharer/sharer.php?u=${en(url)}`,
      x: `https://twitter.com/intent/tweet?text=${en(text)}&url=${en(url)}`,
      pin: `https://pinterest.com/pin/create/button/?url=${en(url)}&media=${en(media)}&description=${en(text)}`,
    };
    const supabase = createClient();
    supabase.from("feed_posts").update({ shares_count: (item.shares_count || 0) + 1 }).eq("id", item.id);
    if (network === "copy") navigator.clipboard.writeText(url);
    else if (network === "status") {
      navigator.clipboard.writeText(text + " " + url);
      window.open("https://wa.me/", "_blank");
    } else window.open(links[network], "_blank");
  }

  if (!loaded) return <p className="text-center text-gray-500 py-10">Loading…</p>;

  const timeline: any[] = [];
  let vi = 0;
  posts.forEach((p, i) => {
    timeline.push(p);
    if ((i + 1) % 4 === 0 && vi < videos.length) timeline.push({ ...videos[vi++], kind: "video" });
  });
  while (vi < videos.length) timeline.push({ ...videos[vi++], kind: "video" });

  const reactorItem = timeline.find((t) => t.id === reactorsFor);

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">📣 Farmer Timeline</h1>

      <div className="flex mb-4 border-b border-gray-200">
        <button onClick={() => setTab("foryou")} className={`flex-1 py-2 text-sm font-bold border-b-2 ${tab === "foryou" ? "border-green-600 text-green-700" : "border-transparent text-gray-500"}`}>✨ For You</button>
        <button onClick={() => setTab("following")} className={`flex-1 py-2 text-sm font-bold border-b-2 ${tab === "following" ? "border-green-600 text-green-700" : "border-transparent text-gray-500"}`}>👥 Following</button>
      </div>

      {user && (
        <div className="mb-5 space-y-3">
          <form onSubmit={publish} className="glass-card p-4 rounded-2xl">
            <textarea className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" rows={2} placeholder="What's happening on your farm today? Links & #hashtags become clickable!" value={content} onChange={(e) => setContent(e.target.value)} />
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <label className="text-sm font-semibold text-green-700 cursor-pointer">📷 Photo<input type="file" accept="image/*" onChange={uploadImage} className="hidden" /></label>
              <button type="button" onClick={() => setVideoMode(videoMode === "reel" ? "" : "reel")} className={`text-sm font-semibold ${videoMode === "reel" ? "text-purple-700 underline" : "text-purple-600"}`}>📱 Reel</button>
              <button type="button" onClick={() => setVideoMode(videoMode === "video" ? "" : "video")} className={`text-sm font-semibold ${videoMode === "video" ? "text-forest-700 underline" : "text-forest-600"}`}>🎬 Video</button>
              {image && <img src={image} alt="" className="h-10 w-10 object-cover rounded-lg" />}
              <button className="ml-auto bg-green-600 text-white px-5 py-2 rounded-xl text-sm font-bold disabled:opacity-50" disabled={busy}>Post</button>
            </div>
          </form>
          {videoMode && (
            <VideoComposer
              context="feed"              initialAspect={videoMode === "reel" ? "portrait" : "landscape"}
              onDone={() => { setVideoMode(""); load(); }}
            />
          )}
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
              <div className={`glass-card p-4 rounded-2xl ${item.boosted_until && new Date(item.boosted_until) > new Date() ? "border-2 border-amber-400" : ""}`}>
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
                      {item.boosted_until && new Date(item.boosted_until) > new Date() && <span className="ml-1 text-[9px] bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full font-extrabold">🚀 BOOSTED</span>}
                    </p>
                    <p className="text-[10px] text-gray-400">{new Date(item.created_at).toLocaleDateString()} · 👁️ {item.views_count || 0} impressions</p>
                  </div>
                  {user?.id === item.author_id ? (
                    <button onClick={() => deletePost(item.id)} className="text-red-500 text-xs font-semibold">Delete</button>
                  ) : (
                    <button onClick={() => reportPost(item.id)} className="text-gray-400 text-xs font-semibold">🚩</button>
                  )}
                </div>

                <p className="text-sm text-gray-800 whitespace-pre-line">{renderText(item.content)}</p>
                {item.image_url && <img src={item.image_url} alt="" className="mt-2 w-full h-64 object-cover rounded-xl" />}

                {item.ad && (
                  <div className="mt-3 rounded-xl overflow-hidden border border-amber-300">
                    <AdBar ad={item.ad} />
                  </div>
                )}
                {(() => {
                  const postLikes = likes.filter((l) => l.post_id === item.id);
                  const mine = user && postLikes.find((l) => l.user_id === user.id);
                  const myEmoji = mine ? REACTIONS.find((r) => r.key === mine.reaction)?.e || "👍" : null;
                  const counts: any = {};
                  postLikes.forEach((l) => { counts[l.reaction] = (counts[l.reaction] || 0) + 1; });
                  const summary = REACTIONS.filter((r) => counts[r.key]).map((r) => r.e).join("");
                  const postComments = comments.filter((c) => c.post_id === item.id);
                  const isBoosted = item.boosted_until && new Date(item.boosted_until) > new Date();
                  return (
                    <>
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 text-[10px] text-gray-500 font-semibold">
                        <button onClick={() => openReactors(item)} className="flex items-center gap-1">
                          {summary && <span className="text-sm">{summary}</span>} {postLikes.length} reactions
                        </button>
                        <button onClick={() => setOpenC(openC === item.id ? "" : item.id)} className="text-gray-500">💬 {postComments.length} comments · 🔁 {item.shares_count || 0} shares</button>
                      </div>

                      {pickerFor === item.id && (
                        <div className="flex gap-1 bg-white rounded-full shadow-xl p-1.5 mt-2 w-max border border-gray-200">
                          {REACTIONS.map((r) => (
                            <button key={r.key} onClick={() => { react(item.id, r.key); setPickerFor(""); }} className="text-2xl px-1 active:scale-125 transition-transform" title={r.label}>{r.e}</button>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-2 text-xs font-bold text-gray-600 flex-wrap">
                        <button
                          onPointerDown={() => startHold(item.id)}
                          onPointerUp={cancelHold}
                          onPointerLeave={cancelHold}
                          onClick={() => { if (pickerFor !== item.id) react(item.id, "like"); }}
                          className={`flex-1 py-1.5 rounded-lg ${mine ? "text-blue-700 bg-blue-50" : "active:bg-gray-100"}`}
                        >
                          {myEmoji || "👍"} {myEmoji ? REACTIONS.find((r) => r.key === mine?.reaction)?.label : "Like"}
                        </button>
                        <button onClick={() => setOpenC(openC === item.id ? "" : item.id)} className="flex-1 py-1.5 rounded-lg active:bg-gray-100 text-green-700">💬 Comment</button>
                        <button onClick={() => repost(item)} className="flex-1 py-1.5 rounded-lg active:bg-gray-100 text-amber-700">🔁 Share</button>
                        {user?.id === item.author_id && !isBoosted && (
                          <button onClick={() => boost(item)} className="flex-1 py-1.5 rounded-lg bg-amber-100 text-amber-800 font-extrabold">🚀 Boost ₦200</button>
                        )}
                      </div>

                      {user?.id === item.author_id && (
                        <button onClick={() => openReactors(item)} className="w-full mt-2 bg-forest-50 rounded-xl p-2 text-[10px] font-bold text-forest-700 flex justify-around">
                          <span>📊 ENGAGEMENT</span>
                          <span>👁️ {item.views_count || 0}</span>
                          <span>🎭 {postLikes.length}</span>
                          <span>💬 {postComments.length}</span>                          <span>🔁 {item.shares_count || 0}</span>
                        </button>
                      )}

                      <div className="flex items-center gap-3 mt-2 text-xs font-bold text-gray-600 flex-wrap">
                        <span className="text-[9px] text-gray-400">Share via:</span>
                        <button onClick={() => share(item, "wa")} title="WhatsApp">📤</button>
                        <button onClick={() => share(item, "status")} title="WhatsApp Status">🟢</button>
                        <button onClick={() => share(item, "fb")} title="Facebook">f</button>
                        <button onClick={() => share(item, "x")} title="X / Twitter">𝕏</button>
                        <button onClick={() => share(item, "pin")} title="Pinterest">📌</button>
                        <button onClick={() => share(item, "copy")} title="Copy link">🔗</button>
                      </div>
                      {openC === item.id && (
                        <div className="mt-3 space-y-2">
                          <AdBanner slot="post_comments" />
                          {postComments.map((c) => (
                            <div key={c.id} className="bg-white/70 p-2 rounded-xl text-xs">
                              <Link href={`/farmer/${c.user_id}`} className="font-bold hover:underline">{c.profiles?.full_name || "Farmer"}</Link>: {renderText(c.content)}
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

            {(idx + 1) % 3 === 0 && (
              <div className="mt-4">
                <AdBanner slot="timeline" />
              </div>
            )}
          </div>
        ))}
        {timeline.length === 0 && (
          <p className="text-center text-gray-500 py-10">
            {tab === "following" ? "Follow farmers to see their posts here! 👥" : "No posts yet — be the first to share! 🌾"}
          </p>
        )}
      </div>

      {reactorsFor && (        <div className="fixed inset-0 z-50 bg-black/70 flex items-end" onClick={() => setReactorsFor("")}>
          <div className="bg-white w-full max-w-md mx-auto rounded-t-3xl p-4 max-h-[75vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <p className="font-extrabold">📊 Post Engagement</p>
              <button onClick={() => setReactorsFor("")} className="text-gray-400 font-bold">✕</button>
            </div>
            {reactorItem && (
              <div className="grid grid-cols-4 gap-2 text-center mb-4">
                <div className="bg-gray-50 rounded-xl p-2"><p className="font-extrabold">{reactorItem.views_count || 0}</p><p className="text-[9px] text-gray-500">👁️ Views</p></div>
                <div className="bg-gray-50 rounded-xl p-2"><p className="font-extrabold">{reactors.length}</p><p className="text-[9px] text-gray-500">🎭 Reactions</p></div>
                <div className="bg-gray-50 rounded-xl p-2"><p className="font-extrabold">{comments.filter((c) => c.post_id === reactorsFor).length}</p><p className="text-[9px] text-gray-500">💬 Comments</p></div>
                <div className="bg-gray-50 rounded-xl p-2"><p className="font-extrabold">{reactorItem.shares_count || 0}</p><p className="text-[9px] text-gray-500">🔁 Shares</p></div>
              </div>
            )}
            <p className="text-xs font-bold text-gray-500 mb-2">REACTED BY</p>
            <div className="space-y-2">
              {reactors.map((r) => (
                <div key={r.id} className="flex items-center gap-2">
                  {r.profiles?.avatar_url ? (
                    <img src={r.profiles.avatar_url} className="w-8 h-8 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center text-xs font-bold text-green-800">{r.profiles?.full_name?.[0] || "?"}</div>
                  )}
                  <Link href={`/farmer/${r.user_id}`} className="flex-1 text-sm font-bold hover:underline">{r.profiles?.full_name || "Farmer"}</Link>
                  <span className="text-xl">{REACTIONS.find((x) => x.key === r.reaction)?.e || "👍"}</span>
                </div>
              ))}
              {reactors.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No reactions yet.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}