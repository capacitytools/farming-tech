"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const CATS = ["Animal", "Plants", "Business", "Tech", "Training", "Other"];

function toSec(v: string) {
  if (!v) return 0;
  if (/^\d+$/.test(v)) return Number(v);
  const m = v.match(/^(\d+):([0-5]?\d)$/);
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  return 0;
}

export default function VideoComposer({ context, tribeId, onDone }: { context: string; tribeId?: string; onDone: () => void }) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [category, setCategory] = useState("Animal");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [msg, setMsg] = useState("");

  function ytId(u: string) {
    const m = u.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
  }

  async function submit(e: any) {
    e.preventDefault();
    setMsg("");
    const id = ytId(url);
    if (!id) return setMsg("Paste a valid YouTube link (watch, share or shorts link).");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setMsg("Log in first.");
    const { error } = await supabase.from("videos").insert({
      youtube_id: id, title, description, tags, category,
      start_sec: toSec(start), end_sec: toSec(end),
      author_id: user.id, context, tribe_id: tribeId || null,
    });
    if (error) setMsg("Error: " + error.message);
    else onDone();
  }

  const input = "w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm";

  return (
    <form onSubmit={submit} className="glass-card p-4 rounded-2xl space-y-2 border-2 border-forest-300">
      <p className="text-xs font-bold text-forest-700">🎬 Post a YouTube video (or just the best moment of it!)</p>
      <input className={input} placeholder="YouTube link *" required value={url} onChange={(e) => setUrl(e.target.value)} />
      <input className={input} placeholder="Video title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea className={input} rows={2} placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
      <div className="grid grid-cols-2 gap-2">
        <input className={input} placeholder="Start time e.g. 1:30 (optional)" value={start} onChange={(e) => setStart(e.target.value)} />
        <input className={input} placeholder="End time e.g. 2:45 (optional)" value={end} onChange={(e) => setEnd(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input className={input} placeholder="Tags (rabbit, health)" value={tags} onChange={(e) => setTags(e.target.value)} />
        <select className={input} value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATS.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      {msg && <p className="text-xs text-red-600">{msg}</p>}
      <button className="w-full bg-forest-600 text-white py-2 rounded-xl text-sm font-bold">🎬 Publish Video</button>
    </form>
  );
}