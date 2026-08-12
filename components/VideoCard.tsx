"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AdBar from "@/components/AdBar";
import AdBanner from "@/components/AdBanner";

function renderText(text: string) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return parts.map((p, i) =>
    p.match(/^https?:\/\//) ? (
      <a key={i} href={p} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all">{p}</a>
    ) : (
      <span key={i}>{p}</span>
    )
  );
}

export default function VideoCard({ video }: { video: any }) {
  const [ad, setAd] = useState<any>(null);
  const [vComments, setVComments] = useState<any[]>([]);
  const [vLikes, setVLikes] = useState(0);
  const [myVLike, setMyVLike] = useState(false);
  const [cText, setCText] = useState("");
  const [openC, setOpenC] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      if (video.ad_id) {
        const { data } = await supabase.from("ad_campaigns").select("*").eq("id", video.ad_id).eq("status", "approved").single();
        setAd(data);
      }
      const { count } = await supabase.from("video_likes").select("*", { count: "exact", head: true }).eq("video_id", video.id);
      setVLikes(count || 0);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: mine } = await supabase.from("video_likes").select("id").eq("video_id", video.id).eq("user_id", user.id).single();
        setMyVLike(!!mine);
      }
      const { data } = await supabase.from("feed_comments").select("*, profiles(full_name, avatar_url)").eq("video_id", video.id).order("created_at", { ascending: true });
      setVComments(data || []);
    })();
  }, [video.id]);

  async function toggleVLike() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Log in to like videos.");
    if (myVLike) {      await supabase.from("video_likes").delete().eq("video_id", video.id).eq("user_id", user.id);
      setVLikes(vLikes - 1);
      setMyVLike(false);
    } else {
      await supabase.from("video_likes").insert({ video_id: video.id, user_id: user.id });
      setVLikes(vLikes + 1);
      setMyVLike(true);
    }
  }

  async function addComment() {
    if (!cText.trim()) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Log in to comment.");
    await supabase.from("feed_comments").insert({ video_id: video.id, user_id: user.id, content: cText.trim() });
    setCText("");
    const { data } = await supabase.from("feed_comments").select("*, profiles(full_name, avatar_url)").eq("video_id", video.id).order("created_at", { ascending: true });
    setVComments(data || []);
  }

  const s = Number(video.start_sec || 0);
  const e = Number(video.end_sec || 0);
  let src = `https://www.youtube.com/embed/${video.youtube_id}`;
  if (s > 0 || e > s) src += `?start=${s}${e > s ? `&end=${e}` : ""}`;
  const portrait = video.aspect === "portrait";

  function shareTo(net: string) {
    const ref = video.profiles?.referral_code || "";
    const url = `${window.location.origin}/post/${video.id}?ref=${ref}`;
    const text = `🎬 ${video.title || "Watch this"} — ${video.profiles?.full_name || "a farmer"} on Farming Tech & Business. 🌾 Join, Learn, Grow, Connect & Earn!`;
    const en = encodeURIComponent;
    const media = `https://i.ytimg.com/vi/${video.youtube_id}/hqdefault.jpg`;
    const links: any = {
      wa: `https://wa.me/?text=${en(text + " " + url)}`,
      fb: `https://www.facebook.com/sharer/sharer.php?u=${en(url)}`,
      x: `https://twitter.com/intent/tweet?text=${en(text)}&url=${en(url)}`,
      pin: `https://pinterest.com/pin/create/button/?url=${en(url)}&media=${en(media)}&description=${en(text)}`,
    };
    if (net === "copy") navigator.clipboard.writeText(url);
    else if (net === "status") {
      navigator.clipboard.writeText(text + " " + url);
      window.open("https://wa.me/", "_blank");
    } else window.open(links[net], "_blank");
  }

  return (
    <div className="rounded-2xl overflow-hidden border-2 border-forest-600 shadow-lg bg-white">
      <div className="bg-forest-700 text-white px-3 py-2 flex items-center gap-2">
        <span className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center text-sm">🌾</span>        <p className="text-xs font-extrabold tracking-wide">FARMING TECH & BUSINESS</p>
        <span className="ml-auto text-[9px] bg-amber-400 text-forest-900 px-2 py-0.5 rounded-full font-bold uppercase">{portrait ? "📱 REEL" : video.category || "Video"}</span>
      </div>

      {portrait ? (
        <div className="flex justify-center bg-black">
          <iframe src={src} title={video.title || "reel"} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full aspect-[9/16] max-h-[72vh]" />
        </div>
      ) : (
        <iframe src={src} title={video.title || "video"} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full aspect-video bg-black" />
      )}

      {ad ? (
        <AdBar ad={ad} />
      ) : (
        <a href="/ads/submit" className="block bg-black overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2.5">
            <span className="text-amber-400 text-sm flex-shrink-0">📢</span>
            <div className="flex-1 overflow-hidden">
              <p className="ftb-marquee text-xs font-bold text-white">YOUR BUSINESS HERE — advertise on every video & post! Tap to book this bar →</p>
            </div>
            <span className="text-[8px] text-gray-400 font-bold flex-shrink-0">AD SPACE</span>
          </div>
        </a>
      )}

      {s > 0 && <p className="text-[9px] text-center bg-forest-50 text-forest-600 font-bold py-1">⏱️ Clip: plays {fmt(s)}{e > s ? ` → ${fmt(e)}` : " → end"}</p>}

      <div className="p-3 bg-forest-50">
        <div className="flex items-center gap-2 mb-1">
          {video.profiles?.avatar_url ? (
            <img src={video.profiles.avatar_url} className="w-6 h-6 rounded-full object-cover" alt="" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-green-200 flex items-center justify-center text-[10px] font-bold text-green-800">{video.profiles?.full_name?.[0] || "?"}</div>
          )}
          <p className="text-xs font-bold text-forest-800">{video.profiles?.full_name || "Farmer"} {video.profiles?.verified && "✅"}</p>
        </div>
        {video.title && <h3 className="font-bold text-sm text-forest-900">{video.title}</h3>}
        {video.description && <p className="text-xs text-gray-600 mt-1">{video.description}</p>}
        {video.tags && (
          <div className="flex gap-1 flex-wrap mt-2">
            {video.tags.split(",").map((t: string, i: number) => (
              <span key={i} className="text-[9px] font-bold text-forest-700 bg-forest-100 px-2 py-0.5 rounded-full">#{t.trim()}</span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 mt-3 pt-2 border-t border-forest-100 text-xs font-bold text-gray-600">
          <button onClick={toggleVLike} className={myVLike ? "text-red-600" : ""}>❤️ {vLikes}</button>
          <button onClick={() => setOpenC(!openC)} className="text-green-700">💬 {vComments.length}</button>          <span className="ml-auto text-[9px] text-gray-400">Share:</span>
          <button onClick={() => shareTo("wa")} title="WhatsApp">📤</button>
          <button onClick={() => shareTo("status")} title="WhatsApp Status">🟢</button>
          <button onClick={() => shareTo("fb")} title="Facebook">f</button>
          <button onClick={() => shareTo("x")} title="X / Twitter">𝕏</button>
          <button onClick={() => shareTo("pin")} title="Pinterest">📌</button>
          <button onClick={() => shareTo("copy")} title="Copy link">🔗</button>
        </div>

        {openC && (
          <div className="mt-3 space-y-2">
            <AdBanner type="native" />
            {vComments.map((c) => (
              <div key={c.id} className="bg-white/80 p-2 rounded-xl text-xs">
                <span className="font-bold">{c.profiles?.full_name || "Farmer"}:</span>{" "}
                {renderText(c.content)}
              </div>
            ))}
            {vComments.length === 0 && <p className="text-[10px] text-gray-400 text-center">No comments yet — start the discussion!</p>}
            <div className="flex gap-2">
              <input className="flex-1 p-2 rounded-xl border border-gray-200 bg-white/70 text-xs" placeholder="Share your opinion or paste a link (+3 pts)..." value={cText} onChange={(ev) => setCText(ev.target.value)} />
              <button onClick={addComment} className="bg-green-600 text-white px-3 rounded-xl text-xs font-bold">Send</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const ss = sec % 60;
  return `${m}:${String(ss).padStart(2, "0")}`;
}