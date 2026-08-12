"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import TrainingRoom from "@/components/TrainingRoom";

export default function TribePage(props: any) {
  const slug = props.params.slug;
  const [tribe, setTribe] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [member, setMember] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [replies, setReplies] = useState<any[]>([]);
  const [trainings, setTrainings] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [image, setImage] = useState("");
  const [replyText, setReplyText] = useState<any>({});
  const [openReplies, setOpenReplies] = useState("");
  const [showStart, setShowStart] = useState(false);
  const [tTitle, setTTitle] = useState("");
  const [tDur, setTDur] = useState(15);
  const [tRec, setTRec] = useState(true);
  const [room, setRoom] = useState<any>(null);
  const [notice, setNotice] = useState("");
  const [loaded, setLoaded] = useState(false);

  const isMaster = member?.role === "master" || profile?.role === "admin";
  const canHost = profile?.role === "admin" || member?.role === "master" || profile?.can_host_training;

  async function load() {
    const supabase = createClient();
    const { data: t } = await supabase.from("tribes").select("*").eq("slug", slug).single();
    setTribe(t);
    const { data: { user: u } } = await supabase.auth.getUser();
    setUser(u);
    if (u) {
      const { data: pr } = await supabase.from("profiles").select("role, can_host_training, trainer_requested").eq("id", u.id).single();
      setProfile(pr);
      if (t) {
        const { data: m } = await supabase.from("tribe_members").select("*").eq("tribe_id", t.id).eq("user_id", u.id).single();
        setMember(m);
      }
    }
    if (t) {
      const { data: p } = await supabase.from("tribe_posts").select("*, profiles(full_name, avatar_url, role)").eq("tribe_id", t.id).is("parent_id", null).order("created_at", { ascending: false }).limit(30);
      const { data: r } = await supabase.from("tribe_posts").select("*, profiles(full_name, avatar_url)").eq("tribe_id", t.id).not("parent_id", "is", null).order("created_at", { ascending: true });
      const { data: tr } = await supabase.from("tribe_trainings").select("*, profiles(full_name)").eq("tribe_id", t.id).order("created_at", { ascending: false }).limit(10);
      setPosts(p || []);
      setReplies(r || []);      setTrainings(tr || []);
    }
    setLoaded(true);
  }

  useEffect(() => {
    load();
  }, [slug]);

  async function join() {
    const supabase = createClient();
    const { error } = await supabase.from("tribe_members").insert({ tribe_id: tribe.id, user_id: user.id, role: "member" });
    if (error) alert(error.message);
    load();
  }

  async function leave() {
    const supabase = createClient();
    await supabase.from("tribe_members").delete().eq("tribe_id", tribe.id).eq("user_id", user.id);
    setMember(null);
    load();
  }

  async function uploadImage(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `tribe-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("blog-images").upload(path, file);
    if (!error) setImage(supabase.storage.from("blog-images").getPublicUrl(path).data.publicUrl);
  }

  async function addPost(e: any) {
    e.preventDefault();
    if (!content.trim()) return;
    const supabase = createClient();
    await supabase.from("tribe_posts").insert({ tribe_id: tribe.id, author_id: user.id, content: content.trim(), image_url: image || null });
    setContent("");
    setImage("");
    load();
  }

  async function addReply(postId: string) {
    const text = (replyText[postId] || "").trim();
    if (!text) return;
    const supabase = createClient();
    await supabase.from("tribe_posts").insert({ tribe_id: tribe.id, author_id: user.id, content: text, parent_id: postId });
    setReplyText({ ...replyText, [postId]: "" });
    load();  }

  async function deletePost(id: string) {
    if (!confirm("Delete this post?")) return;
    const supabase = createClient();
    await supabase.from("tribe_posts").delete().eq("id", id);
    load();
  }

  async function kick(userId: string) {
    if (!confirm("Remove this member from the tribe?")) return;
    const supabase = createClient();
    await supabase.from("tribe_members").delete().eq("tribe_id", tribe.id).eq("user_id", userId);
    load();
  }

  async function requestTrainer() {
    setNotice("");
    if (!user) return setNotice("Log in first to request trainer access. 🔓");
    if (profile?.trainer_requested) return setNotice("⏳ Your request is pending — admin will approve soon!");
    const supabase = createClient();
    await supabase.from("profiles").update({ trainer_requested: true }).eq("id", user.id);
    setNotice("✅ Request sent! Admin will approve you in /admin/trainers.");
    load();
  }

  function onStartClick() {
    if (canHost) {
      setShowStart(true);
    } else {
      requestTrainer();
    }
  }

  async function startTraining(e: any) {
    e.preventDefault();
    const supabase = createClient();
    const roomName = `FTB-${tribe.slug}-${Date.now()}`;
    const { data, error } = await supabase.from("tribe_trainings").insert({ tribe_id: tribe.id, title: tTitle || "Live Training", room: roomName, duration_min: tDur, record: tRec, started_by: user.id, status: "live" }).select().single();
    if (error) return alert(error.message);
    setShowStart(false);
    setRoom({ ...data, isHost: true });
  }

  const liveTraining = trainings.find((t) => t.status === "live");
  const ended = trainings.filter((t) => t.status === "ended" && t.audio_url);

  if (!loaded) return <p className="text-center text-gray-500 py-10">Loading…</p>;
  if (!tribe) return <p className="text-center text-gray-500 py-10">Tribe not found.</p>;
  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      {room && (
        <TrainingRoom room={room.room} isHost={room.isHost} record={room.record} durationMin={room.duration_min} tribeId={tribe.id} trainingId={room.id} onEnd={() => { setRoom(null); load(); }} />
      )}

      <div className="glass-card p-5 rounded-2xl mb-4">
        <div className="flex items-center gap-3">
          {tribe.image_url ? (
            <img src={tribe.image_url} alt={tribe.name} className="w-14 h-14 object-cover rounded-2xl" />
          ) : (
            <div className="w-14 h-14 bg-forest-100 rounded-2xl flex items-center justify-center text-3xl">{tribe.icon}</div>
          )}
          <div className="flex-1">
            <h1 className="text-xl font-bold">{tribe.name} {tribe.verified_only && "🔒"}</h1>
            <p className="text-xs text-gray-500">👥 {tribe.member_count || 0} members {isMaster && "· 👑 you're a leader"}</p>
          </div>
          {user && (member ? (
            <button onClick={leave} className="text-red-600 text-xs font-bold">Leave</button>
          ) : (
            <button onClick={join} className="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold">Join</button>
          ))}
        </div>
        {tribe.description && <p className="text-sm text-gray-600 mt-3">{tribe.description}</p>}
      </div>

      {/* START TRAINING — visible to EVERYONE, works only for approved hosts */}
      {!showStart && (
        <button
          onClick={onStartClick}
          className={`w-full py-3 rounded-2xl font-bold mb-3 ${canHost ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white" : "bg-purple-100 text-purple-700 border-2 border-purple-300"}`}
        >
          🎙️ Start Live Training {canHost ? "" : profile?.trainer_requested ? "· ⏳ pending approval" : "· 🔒 tap to request access"}
        </button>
      )}

      {notice && <p className="text-sm text-center text-purple-700 mb-3">{notice}</p>}

      {showStart && (
        <form onSubmit={startTraining} className="glass-card p-4 rounded-2xl mb-4 space-y-3 border-2 border-purple-300">
          <input className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" placeholder="Training title (e.g. Rabbit Mite Treatment)" value={tTitle} onChange={(e) => setTTitle(e.target.value)} />
          <div>
            <p className="text-xs font-bold text-gray-600 mb-1">⏱️ Duration</p>
            <div className="flex gap-2 flex-wrap">
              {[5, 10, 15, 20, 30].map((d) => (
                <button type="button" key={d} onClick={() => setTDur(d)} className={`px-3 py-1 rounded-full text-xs font-bold ${tDur === d ? "bg-purple-600 text-white" : "bg-gray-200"}`}>{d} min</button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold">            <input type="checkbox" checked={tRec} onChange={(e) => setTRec(e.target.checked)} /> 🔴 Record & save as MP3 to tribe library
          </label>
          <div className="flex gap-2">
            <button className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-bold">🔴 Go LIVE</button>
            <button type="button" onClick={() => setShowStart(false)} className="px-4 bg-gray-200 rounded-xl font-bold">Cancel</button>
          </div>
        </form>
      )}

      {liveTraining && !room && (
        <button onClick={() => setRoom({ ...liveTraining, isHost: liveTraining.started_by === user?.id })} className="w-full bg-red-600 text-white py-3 rounded-2xl font-bold mb-3 animate-pulse">
          🔴 LIVE NOW: {liveTraining.title} — TAP TO JOIN & LISTEN
        </button>
      )}

      {/* TRAINING LIBRARY */}
      {ended.length > 0 && (
        <div className="mb-6">
          <h2 className="font-bold mb-2">🎧 Training Library</h2>
          <div className="space-y-2">
            {ended.map((t) => (
              <div key={t.id} className="glass-card p-3 rounded-2xl">
                <p className="font-semibold text-sm">{t.title} <span className="text-[10px] text-gray-400">· {t.duration_min} min · by {t.profiles?.full_name}</span></p>
                <audio controls src={t.audio_url} className="w-full mt-2" style={{ height: 36 }} />
                <a href={t.audio_url} download className="text-xs font-bold text-green-700">⬇️ Download MP3</a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* POSTS */}
      {member && !member.is_banned && (
        <form onSubmit={addPost} className="glass-card p-4 rounded-2xl mb-4">
          <textarea className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" rows={2} placeholder={`Share with ${tribe.name}...`} value={content} onChange={(e) => setContent(e.target.value)} />
          <div className="flex items-center gap-3 mt-2">
            <label className="text-sm font-semibold text-green-700 cursor-pointer">📷 Photo<input type="file" accept="image/*" onChange={uploadImage} className="hidden" /></label>
            {image && <img src={image} alt="" className="h-10 w-10 object-cover rounded-lg" />}
            <button className="ml-auto bg-green-600 text-white px-5 py-2 rounded-xl text-sm font-bold">Post</button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {posts.map((p) => {
          const postReplies = replies.filter((r) => r.parent_id === p.id);
          return (
            <div key={p.id} className="glass-card p-4 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                {p.profiles?.avatar_url ? (                  <img src={p.profiles.avatar_url} className="w-9 h-9 rounded-full object-cover" alt="" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-green-200 flex items-center justify-center font-bold text-green-800">{p.profiles?.full_name?.[0] || "?"}</div>
                )}
                <div className="flex-1">
                  <p className="font-bold text-sm">{p.profiles?.full_name || "Member"}</p>
                  <p className="text-[10px] text-gray-400">{new Date(p.created_at).toLocaleDateString()}</p>
                </div>
                {(isMaster || user?.id === p.author_id) && (
                  <button onClick={() => deletePost(p.id)} className="text-red-500 text-xs font-semibold">Delete</button>
                )}
                {isMaster && user?.id !== p.author_id && (
                  <button onClick={() => kick(p.author_id)} className="text-red-500 text-xs font-semibold">Kick</button>
                )}
              </div>
              <p className="text-sm text-gray-800 whitespace-pre-line">{p.content}</p>
              {p.image_url && <img src={p.image_url} alt="" className="mt-2 w-full h-64 object-cover rounded-xl" />}
              <button onClick={() => setOpenReplies(openReplies === p.id ? "" : p.id)} className="text-xs font-bold text-green-700 mt-2">💬 {postReplies.length} replies</button>
              {openReplies === p.id && (
                <div className="mt-2 space-y-2">
                  {postReplies.map((r) => (
                    <div key={r.id} className="bg-white/70 p-2 rounded-xl text-xs">
                      <span className="font-bold">{r.profiles?.full_name || "Member"}:</span> {r.content}
                    </div>
                  ))}
                  {member && (
                    <div className="flex gap-2">
                      <input className="flex-1 p-2 rounded-xl border border-gray-200 bg-white/70 text-xs" placeholder="Reply..." value={replyText[p.id] || ""} onChange={(e) => setReplyText({ ...replyText, [p.id]: e.target.value })} />
                      <button onClick={() => addReply(p.id)} className="bg-green-600 text-white px-3 rounded-xl text-xs font-bold">Send</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {posts.length === 0 && <p className="text-center text-gray-500 py-6">No posts yet — start the conversation!</p>}
      </div>
    </div>
  );
}