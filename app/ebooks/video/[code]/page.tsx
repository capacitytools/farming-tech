"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function EbookVideoPage(props: any) {
  const code = props.params.code;
  const [video, setVideo] = useState<any>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [pw, setPw] = useState("");
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.from("ebook_videos").select("*").eq("code", code).single();
      if (!data) { setNotFound(true); return; }
      setVideo(data);
      supabase.from("ebook_videos").update({ views: (data.views || 0) + 1 }).eq("id", data.id);
      if (!data.password) setUnlocked(true);
      else setUnlocked(sessionStorage.getItem("ev-" + data.id) === "1");
    })();
  }, [code]);

  function unlock() {
    if (!video) return;
    if (pw === video.password) {
      sessionStorage.setItem("ev-" + video.id, "1");
      setUnlocked(true);
    } else alert("Wrong password. Check the message from the seller.");
  }

  if (notFound) {
    return (
      <div className="p-10 text-center">
        <p className="text-4xl mb-2">🔒</p>
        <p className="font-bold">This video is private.</p>
        <p className="text-xs text-gray-500 mt-1">Ask the seller for your personal access link.</p>
      </div>
    );
  }
  if (!video) return <p className="text-center text-gray-500 py-10">Loading…</p>;

  return (
    <div className="pb-24 max-w-2xl mx-auto">
      {!unlocked ? (
        <div className="p-6 max-w-sm mx-auto pt-20">
          <div className="glass-card p-6 rounded-2xl text-center space-y-3">
            <p className="text-4xl">🔑</p>
            <p className="font-extrabold text-lg">{video.title}</p>
            <p className="text-xs text-gray-500">This premium video is password protected. Enter the password you received with your ebook.</p>
            <input className="w-full p-3 rounded-xl border border-gray-200 bg-white/70 text-sm" type="password" placeholder="Video password" value={pw} onChange={(e) => setPw(e.target.value)} />
            <button onClick={unlock} className="w-full bg-forest-600 text-white py-3 rounded-xl font-bold">▶ Unlock Video</button>
          </div>
        </div>
      ) : (
        <div>
          <div className="rounded-b-2xl overflow-hidden border-2 border-forest-600 shadow-lg bg-white mx-4 mt-4">
            <div className="bg-forest-700 text-white px-3 py-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center text-sm">🌾</span>
              <p className="text-xs font-extrabold tracking-wide">FARMING TECH & BUSINESS</p>
              <span className="ml-auto text-[9px] bg-amber-400 text-forest-900 px-2 py-0.5 rounded-full font-bold uppercase">PREMIUM</span>
            </div>
            <iframe
              src={`https://www.youtube.com/embed/${video.youtube_id}`}
              title={video.title || "premium video"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full aspect-video bg-black"
            />
            <div className="p-4 bg-forest-50">
              <h1 className="font-extrabold text-forest-900">{video.title}</h1>
              {video.description && <p className="text-sm text-gray-700 mt-2 whitespace-pre-line">{video.description}</p>}
              <p className="text-[9px] text-gray-400 mt-3">© Farming Tech & Business — premium member content. Do not share your link or password.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}