"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function VideoCard({ video }: { video: any }) {
  const [ad, setAd] = useState<any>(null);

  useEffect(() => {
    (async () => {
      if (video.ad_id) {
        const supabase = createClient();
        const { data } = await supabase.from("ad_campaigns").select("*").eq("id", video.ad_id).eq("status", "approved").single();
        setAd(data);
      }
    })();
  }, [video.ad_id]);

  return (
    <div className="rounded-2xl overflow-hidden border-2 border-forest-600 shadow-lg bg-white">
      {/* BRAND HEADER */}
      <div className="bg-forest-700 text-white px-3 py-2 flex items-center gap-2">
        <span className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center text-sm">🌾</span>
        <p className="text-xs font-extrabold tracking-wide">FARMING TECH & BUSINESS</p>
        <span className="ml-auto text-[9px] bg-amber-400 text-forest-900 px-2 py-0.5 rounded-full font-bold uppercase">{video.category || "Video"}</span>
      </div>

      {/* PLAYER */}
      <iframe
        src={`https://www.youtube.com/embed/${video.youtube_id}`}
        title={video.title || "video"}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full aspect-video bg-black"
      />

      {/* TITLE / DESCRIPTION / TAGS */}
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
      </div>

      {/* WHITE AD BAR — scrolling ad plays even while video plays */}
      {ad && (
        <a href={ad.link || "#"} target="_blank" rel="noopener noreferrer" className="block bg-white border-t-2 border-amber-400 overflow-hidden">
          <div className="flex items-center gap-2 px-2 py-2">
            {ad.image_url && <img src={ad.image_url} alt="" className="h-8 w-8 rounded-lg object-cover flex-shrink-0" />}
            <div className="flex-1 overflow-hidden">
              <p className="ftb-marquee text-xs font-bold text-forest-800">
                📢 {ad.business_name}: {ad.ad_text} {ad.link ? "— tap to visit!" : ""}
              </p>
            </div>
            <span className="text-[8px] text-gray-400 font-bold flex-shrink-0">AD</span>
          </div>
        </a>
      )}
    </div>
  );
}