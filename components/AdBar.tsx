"use client";

export default function AdBar({ ad }: { ad: any }) {
  if (!ad) return null;
  const target = ad.link || (ad.ad_video ? `https://youtu.be/${ad.ad_video}` : "#");
  return (
    <a href={target} target="_blank" rel="noopener noreferrer" className="block bg-white border-t-2 border-amber-400 overflow-hidden">
      <div className="flex items-center gap-2 px-2 py-2">
        {ad.image_url && <img src={ad.image_url} alt="" className="h-8 w-8 rounded-lg object-cover flex-shrink-0" />}
        {ad.ad_video && <span className="h-8 w-8 rounded-lg bg-red-600 text-white flex items-center justify-center text-sm flex-shrink-0">▶</span>}
        <div className="flex-1 overflow-hidden">
          <p className="ftb-marquee text-xs font-bold text-forest-800">
            📢 {ad.business_name}: {ad.ad_text} — tap to {ad.ad_video ? "watch" : "visit"}!
          </p>
        </div>
        <span className="text-[8px] text-gray-400 font-bold flex-shrink-0">AD</span>
      </div>
    </a>
  );
}