"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function parseYouTube(url: string): string {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([\w-]{11})/);
  return m ? m[1] : "";
}

export default function DrivePage() {
  const [authed, setAuthed] = useState(false);
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [creds, setCreds] = useState({ user: "admin", pass: "farmtech2024" });
  const [videos, setVideos] = useState<any[]>([]);
  const [form, setForm] = useState({ url: "", title: "", desc: "", pass: "" });
  const [newCreds, setNewCreds] = useState({ user: "", pass: "" });
  const [msg, setMsg] = useState("");

  async function loadCreds() {
    const supabase = createClient();
    const { data } = await supabase.from("settings").select("key, value").in("key", ["drive_user", "drive_pass"]);
    const next = { user: "admin", pass: "farmtech2024" };
    (data || []).forEach((r: any) => {
      if (r.key === "drive_user" && r.value) next.user = r.value;
      if (r.key === "drive_pass" && r.value) next.pass = r.value;
    });
    setCreds(next);
    setNewCreds(next);
  }

  async function loadVideos() {
    const supabase = createClient();
    const { data } = await supabase.from("ebook_videos").select("*").order("created_at", { ascending: false });
    setVideos(data || []);
  }

  useEffect(() => {
    loadCreds();
    if (localStorage.getItem("drive_auth") === "1") { setAuthed(true); loadVideos(); }
  }, []);

  function login() {
    if (u === creds.user && p === creds.pass) {
      localStorage.setItem("drive_auth", "1");
      setAuthed(true);
      loadVideos();
    } else alert("Wrong username or password.");
  }
  async function addVideo() {
    const yid = parseYouTube(form.url);
    if (!yid) return alert("Paste a valid YouTube link.");
    if (!form.title.trim()) return alert("Give the video a title.");
    const code = Math.random().toString(36).slice(2, 8);
    const supabase = createClient();
    await supabase.from("ebook_videos").insert({ youtube_id: yid, title: form.title.trim(), description: form.desc.trim(), code, password: form.pass.trim() || null });
    setForm({ url: "", title: "", desc: "", pass: "" });
    setMsg("✅ Video added to the drive.");
    setTimeout(() => setMsg(""), 2500);
    loadVideos();
  }

  async function del(id: string) {
    if (!confirm("Remove this video from the drive?")) return;
    const supabase = createClient();
    await supabase.from("ebook_videos").delete().eq("id", id);
    loadVideos();
  }

  async function saveCreds() {
    const supabase = createClient();
    await supabase.from("settings").upsert({ key: "drive_user", value: newCreds.user });
    await supabase.from("settings").upsert({ key: "drive_pass", value: newCreds.pass });
    setCreds(newCreds);
    setMsg("✅ Drive login updated.");
    setTimeout(() => setMsg(""), 2500);
  }

  function copyLink(code: string) {
    navigator.clipboard.writeText(`${window.location.origin}/ebooks/video/${code}`);
    setMsg("✅ Smart link copied — send it to the buyer on WhatsApp.");
    setTimeout(() => setMsg(""), 2500);
  }

  if (!authed) {
    return (
      <div className="p-6 max-w-sm mx-auto pt-20">
        <div className="glass-card p-6 rounded-2xl text-center space-y-3">
          <p className="text-4xl">🔐</p>
          <p className="font-extrabold text-lg">Ebook Video Drive</p>
          <p className="text-xs text-gray-500">Admin access only. Enter the store username and password.</p>
          <input className="w-full p-3 rounded-xl border border-gray-200 bg-white/70 text-sm" placeholder="Username" value={u} onChange={(e) => setU(e.target.value)} />
          <input className="w-full p-3 rounded-xl border border-gray-200 bg-white/70 text-sm" type="password" placeholder="Password" value={p} onChange={(e) => setP(e.target.value)} />
          <button onClick={login} className="w-full bg-forest-600 text-white py-3 rounded-xl font-bold">🔓 Open Drive</button>
        </div>
      </div>
    );
  }
  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-extrabold">🎬 Ebook Video Drive</h1>
        <button onClick={() => { localStorage.removeItem("drive_auth"); setAuthed(false); }} className="text-xs font-bold text-red-600">Lock 🔒</button>
      </div>
      <p className="text-xs text-gray-500 mb-4">Private videos for your paid ebook members. Only the smart link you share can open a video. Nobody else can see them.</p>
      {msg && <p className="text-xs font-bold text-green-700 mb-3">{msg}</p>}

      <div className="glass-card p-4 rounded-2xl space-y-2 mb-6 border-2 border-forest-300">
        <p className="text-sm font-bold text-forest-700">➕ Add a YouTube video to the drive</p>
        <input className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" placeholder="Paste YouTube link..." value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
        <input className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" placeholder="Video title (e.g. Rabbit Housing Masterclass)..." value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <textarea className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" rows={2} placeholder="Details / description for the buyer..." value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} />
        <input className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" placeholder="Password for this video (optional — leave empty for link-only access)" value={form.pass} onChange={(e) => setForm({ ...form, pass: e.target.value })} />
        <button onClick={addVideo} className="w-full bg-green-600 text-white py-2.5 rounded-xl text-sm font-bold">🎬 Add to Drive</button>
      </div>

      <div className="space-y-3">
        {videos.map((v) => (
          <div key={v.id} className="glass-card p-3 rounded-2xl">
            <div className="flex items-center gap-2">
              <img src={`https://i.ytimg.com/vi/${v.youtube_id}/default.jpg`} alt="" className="w-14 h-10 object-cover rounded-lg" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{v.title}</p>
                <p className="text-[10px] text-gray-500">👁️ {v.views} views {v.password ? "· 🔑 password protected" : "· 🔗 link-only access"}</p>
              </div>
              <button onClick={() => del(v.id)} className="text-red-500 text-xs font-bold">Delete</button>
            </div>
            {v.description && <p className="text-xs text-gray-600 mt-1 line-clamp-2">{v.description}</p>}
            <div className="flex gap-2 mt-2">
              <button onClick={() => copyLink(v.code)} className="flex-1 bg-forest-600 text-white py-2 rounded-xl text-xs font-bold">🔗 Copy Smart Link</button>
              <a href={`/ebooks/video/${v.code}`} target="_blank" className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl text-xs font-bold text-center">▶ Preview</a>
            </div>
          </div>
        ))}
        {videos.length === 0 && <p className="text-sm text-gray-500 text-center py-6">No videos in the drive yet. Add your first one above.</p>}
      </div>

      <div className="glass-card p-4 rounded-2xl mt-6 space-y-2">
        <p className="text-sm font-bold text-forest-700">🔑 Change drive username & password</p>
        <input className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" placeholder="New username" value={newCreds.user} onChange={(e) => setNewCreds({ ...newCreds, user: e.target.value })} />
        <input className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" placeholder="New password" value={newCreds.pass} onChange={(e) => setNewCreds({ ...newCreds, pass: e.target.value })} />
        <button onClick={saveCreds} className="w-full bg-amber-500 text-white py-2 rounded-xl text-sm font-bold">💾 Save Login</button>
      </div>
    </div>
  );
}