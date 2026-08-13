"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import VideoCard from "@/components/VideoCard";
import VideoComposer from "@/components/VideoComposer";
import TrainingRoom from "@/components/TrainingRoom";

function renderText(text: string) {
  const parts = (text || "").split(/(https?:\/\/[^\s]+)/g);
  return parts.map((p, i) =>
    p.match(/^https?:\/\//) ? (
      <a key={i} href={p} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all">{p}</a>
    ) : (
      <span key={i}>{p}</span>
    )
  );
}

export default function TribePage(props: any) {
  const slug = props.params.slug;
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [tribe, setTribe] = useState<any>(null);
  const [member, setMember] = useState<any>(null);
  const [tab, setTab] = useState("posts");
  const [posts, setPosts] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [trainings, setTrainings] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [image, setImage] = useState("");
  const [replyFor, setReplyFor] = useState("");
  const [replyText, setReplyText] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [loaded, setLoaded] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data: { user: u } } = await supabase.auth.getUser();
    setUser(u);
    const { data: t } = await supabase.from("tribes").select("*").eq("slug", slug).single();
    setTribe(t);
    if (!t) { setLoaded(true); return; }
    let pr: any = null, mem: any = null;
    if (u) {
      const [{ data: p }, { data: m }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", u.id).single(),
        supabase.from("tribe_members").select("*").eq("user_id", u.id).eq("tribe_id", t.id).single(),
      ]);      pr = p; mem = m;
      setProfile(p); setMember(m);
    }
    const gated = t.verified_only && !mem && !(pr?.verified) && pr?.role !== "admin";
    if (!gated) {
      const [{ data: po }, { data: vi }, { data: tr }] = await Promise.all([
        supabase.from("tribe_posts").select("*, profiles(full_name, avatar_url, role)").eq("tribe_id", t.id).is("parent_id", null).order("created_at", { ascending: false }).limit(30),
        supabase.from("videos").select("*, profiles(full_name, avatar_url, verified, referral_code)").eq("context", "tribe").eq("tribe_id", t.id).order("created_at", { ascending: false }).limit(10),
        supabase.from("tribe_trainings").select("*").eq("tribe_id", t.id).order("created_at", { ascending: false }).limit(10),
      ]);
      let withReplies = po || [];
      if (po && po.length) {
        const ids = po.map((p: any) => p.id);
        const { data: rp } = await supabase.from("tribe_posts").select("*, profiles(full_name)").in("parent_id", ids).order("created_at", { ascending: true });
        withReplies = po.map((p: any) => ({ ...p, replies: (rp || []).filter((r: any) => r.parent_id === p.id) }));
      }
      setPosts(withReplies);
      setVideos(vi || []);
      setTrainings(tr || []);
    }
    setLoaded(true);
  }

  useEffect(() => {
    load();
  }, [slug]);

  async function join() {
    if (!user) return alert("Log in to join tribes.");
    const supabase = createClient();
    await supabase.from("tribe_members").insert({ user_id: user.id, tribe_id: tribe.id, role: "member" });
    await supabase.from("tribes").update({ member_count: (tribe.member_count || 0) + 1 }).eq("id", tribe.id);
    load();
  }

  async function leave() {
    const supabase = createClient();
    await supabase.from("tribe_members").delete().eq("user_id", user.id).eq("tribe_id", tribe.id);
    await supabase.from("tribes").update({ member_count: Math.max(0, (tribe.member_count || 0) - 1) }).eq("id", tribe.id);
    load();
  }

  async function uploadImage(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `tribe-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("blog-images").upload(path, file);
    if (!error) setImage(supabase.storage.from("blog-images").getPublicUrl(path).data.publicUrl);  }

  async function publish(e: any) {
    e.preventDefault();
    if (!content.trim() || !user) return;
    const supabase = createClient();
    await supabase.from("tribe_posts").insert({ tribe_id: tribe.id, author_id: user.id, content: content.trim(), image_url: image || null });
    setContent(""); setImage("");
    load();
  }

  async function reply(postId: string) {
    if (!replyText.trim() || !user) return;
    const supabase = createClient();
    await supabase.from("tribe_posts").insert({ tribe_id: tribe.id, author_id: user.id, content: replyText.trim(), parent_id: postId });
    setReplyText(""); setReplyFor("");
    load();
  }

  async function deletePost(id: string) {
    if (!confirm("Delete?")) return;
    const supabase = createClient();
    await supabase.from("tribe_posts").delete().eq("id", id);
    load();
  }

  async function shareToTimeline(v: any) {
    if (!user) return alert("Log in to share.");
    const supabase = createClient();
    await supabase.from("videos").insert({
      youtube_id: v.youtube_id,
      title: (v.title || "Video") + " 🌾 from " + tribe.name,
      description: v.description, tags: v.tags, category: v.category,
      start_sec: v.start_sec, end_sec: v.end_sec, aspect: v.aspect,
      author_id: user.id, context: "feed",
    });
    alert("✅ Shared to the Farmer Timeline — every user can now see & reshare it!");
  }

  async function startTraining() {
    if (!user) return;
    const supabase = createClient();
    const room = "ftb-" + tribe.id.slice(0, 6) + "-" + Date.now();
    await supabase.from("tribe_trainings").insert({ tribe_id: tribe.id, started_by: user.id, room, duration_min: 30, record: true, status: "live" });
    load();
  }

  if (!loaded) return <p className="text-center text-gray-500 py-10">Loading…</p>;
  if (!tribe) return <p className="text-center text-gray-500 py-10">Tribe not found.</p>;
  const gated = tribe.verified_only && !member && !(profile?.verified) && profile?.role !== "admin";
  const canPost = user && (member || profile?.role === "admin");
  const canHost = profile?.role === "admin" || profile?.can_host_training || member?.role === "master";
  const live = trainings.find((t) => t.status === "live");
  const tabBtn = (t: string, label: string) => (
    <button onClick={() => setTab(t)} className={`flex-1 py-3 text-sm font-bold border-b-2 ${tab === t ? "border-green-600 text-green-700" : "border-transparent text-gray-500"}`}>{label}</button>
  );

  return (
    <div className="pb-24 max-w-2xl mx-auto">
      <div className="h-24 bg-gradient-to-r from-forest-700 to-green-500" />
      <div className="px-4">
        <div className="flex items-end justify-between -mt-8">
          <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center text-3xl border-4 border-white">
            {tribe.image_url ? <img src={tribe.image_url} className="w-full h-full object-cover rounded-xl" alt="" /> : tribe.icon || "🌾"}
          </div>
          {user && (member ? (
            <button onClick={leave} className="px-4 py-2 rounded-full text-sm font-bold bg-gray-200 text-gray-700">Joined ✓</button>
          ) : (
            <button onClick={join} className="px-4 py-2 rounded-full text-sm font-bold bg-green-600 text-white">+ Join Tribe</button>
          ))}
        </div>
        <h1 className="text-xl font-extrabold mt-2">{tribe.name} {tribe.verified_only && "🔒"}</h1>
        <p className="text-xs text-gray-500">👥 {tribe.member_count || 0} members · {tribe.verified_only ? "Verified members only" : "Open to all farmers"}</p>
        {tribe.description && <p className="text-xs text-gray-600 mt-1">{tribe.description}</p>}
      </div>

      {gated ? (
        <div className="p-4">
          <div className="glass-card p-6 rounded-2xl text-center border-2 border-sky-300">
            <p className="text-3xl mb-2">🔒</p>
            <p className="font-bold">This is a VERIFIED-only tribe</p>
            <p className="text-xs text-gray-500 mt-1">Get your ✅ Verified badge (₦1,000/month) to unlock premium tribes, monetization & +10% points.</p>
            <Link href="/wallet" className="inline-block mt-3 bg-sky-600 text-white px-5 py-2 rounded-xl text-sm font-bold">Get Verified →</Link>
          </div>
        </div>
      ) : (
        <>
          <div className="flex mt-4 border-b border-gray-200 px-2 bg-white/60 sticky top-14 z-30">
            {tabBtn("posts", "💬 Posts")}
            {tabBtn("videos", "🎬 Videos")}
            {tabBtn("trainings", "🎙️ Trainings")}
          </div>

          <div className="p-4 space-y-4">
            {tab === "posts" && (
              <>
                {canPost && (
                  <form onSubmit={publish} className="glass-card p-3 rounded-2xl">
                    <textarea className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" rows={2} placeholder={`Share with ${tribe.name}... links become clickable!`} value={content} onChange={(e) => setContent(e.target.value)} />                    <div className="flex items-center gap-3 mt-2">
                      <label className="text-xs font-semibold text-green-700 cursor-pointer">📷 Photo<input type="file" accept="image/*" onChange={uploadImage} className="hidden" /></label>
                      {image && <img src={image} alt="" className="h-8 w-8 object-cover rounded" />}
                      <button className="ml-auto bg-green-600 text-white px-4 py-1.5 rounded-xl text-xs font-bold">Post (+15 pts)</button>
                    </div>
                  </form>
                )}
                {posts.map((p) => (
                  <div key={p.id} className="glass-card p-4 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      {p.profiles?.avatar_url ? <img src={p.profiles.avatar_url} className="w-8 h-8 rounded-full object-cover" alt="" /> : <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center text-xs font-bold text-green-800">{p.profiles?.full_name?.[0] || "?"}</div>}
                      <p className="font-bold text-xs">{p.profiles?.full_name || "Farmer"} {p.profiles?.role === "admin" && "🛡️"}</p>
                      {(user?.id === p.author_id || profile?.role === "admin") && (
                        <button onClick={() => deletePost(p.id)} className="ml-auto text-red-500 text-[10px] font-bold">Delete</button>
                      )}
                    </div>
                    <p className="text-sm text-gray-800 whitespace-pre-line">{renderText(p.content)}</p>
                    {p.image_url && <img src={p.image_url} alt="" className="mt-2 w-full h-56 object-cover rounded-xl" />}
                    <button onClick={() => setReplyFor(replyFor === p.id ? "" : p.id)} className="text-xs font-bold text-green-700 mt-2">💬 Replies ({(p.replies || []).length})</button>
                    {replyFor === p.id && (
                      <div className="mt-2 space-y-2">
                        {(p.replies || []).map((r: any) => (
                          <div key={r.id} className="bg-white/70 p-2 rounded-xl text-xs"><span className="font-bold">{r.profiles?.full_name}:</span> {renderText(r.content)}</div>
                        ))}
                        {user && (
                          <div className="flex gap-2">
                            <input className="flex-1 p-2 rounded-xl border border-gray-200 bg-white/70 text-xs" placeholder="Reply (+5 pts)..." value={replyText} onChange={(e) => setReplyText(e.target.value)} />
                            <button onClick={() => reply(p.id)} className="bg-green-600 text-white px-3 rounded-xl text-xs font-bold">Send</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {posts.length === 0 && <p className="text-sm text-gray-500 text-center py-6">No posts yet — start the conversation!</p>}
              </>
            )}

            {tab === "videos" && (
              <>
                {canPost && (
                  <div>
                    <button onClick={() => setShowComposer(!showComposer)} className="w-full bg-forest-600 text-white py-2 rounded-xl text-sm font-bold">🎬 Post YouTube Video / Reel to {tribe.name}</button>
                    {showComposer && <div className="mt-2"><VideoComposer context="tribe" tribeId={tribe.id} onDone={() => { setShowComposer(false); load(); }} /></div>}
                  </div>
                )}
                {videos.map((v) => (
                  <div key={v.id}>
                    <VideoCard video={v} />
                    <div className="flex gap-2 mt-1">                      <button onClick={() => shareToTimeline(v)} className="text-green-700 text-xs font-bold">📣 Share to Timeline</button>
                      {(user?.id === v.author_id || profile?.role === "admin") && (
                        <button onClick={async () => { if (confirm("Delete?")) { const s = createClient(); await s.from("videos").delete().eq("id", v.id); load(); } }} className="text-red-500 text-xs font-bold">Delete</button>
                      )}
                    </div>
                  </div>
                ))}
                {videos.length === 0 && <p className="text-sm text-gray-500 text-center py-6">No tribe videos yet — post the first one! 🎬</p>}
              </>
            )}

            {tab === "trainings" && (
              <>
                {canHost && !live && (
                  <button onClick={startTraining} className="w-full bg-red-600 text-white py-3 rounded-xl text-sm font-bold">🔴 Start Live Training (records MP3)</button>
                )}
                {live && <TrainingRoom training={live} onDone={load} />}
                <h3 className="font-bold pt-2">🎧 Training Library</h3>
                {trainings.filter((t) => t.audio_url).map((t) => (
                  <div key={t.id} className="glass-card p-3 rounded-2xl">
                    <p className="text-xs font-bold">🎙️ {tribe.name} Training · {new Date(t.created_at).toLocaleDateString()}</p>
                    <audio controls src={t.audio_url} className="w-full mt-2" />
                  </div>
                ))}
                {trainings.filter((t) => t.audio_url).length === 0 && <p className="text-sm text-gray-500">No recordings yet.</p>}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}