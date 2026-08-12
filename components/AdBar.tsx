"use client";

export default function AdBar({ ad }: { ad: any }) {
  if (!ad) return null;
  const target = ad.link || (ad.ad_video ? `https://youtu.be/${ad.ad_video}` : "#");
  return (
    <a href={target} target="_blank" rel="noopener noreferrer" className="block bg-white border-y-2 border-amber-400 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5">
        {ad.image_url && <img src={ad.image_url} alt="" className="h-9 w-9 rounded-lg object-cover flex-shrink-0 border border-gray-200" />}
        {ad.ad_video && <span className="h-9 w-9 rounded-lg bg-red-600 text-white flex items-center justify-center text-sm flex-shrink-0">▶</span>}
        <div className="flex-1 overflow-hidden">
          <p className="ftb-marquee text-xs font-extrabold text-black">
            📢 {ad.business_name}: {ad.ad_text} — TAP TO VISIT!
          </p>
        </div>
        <span className="text-[8px] text-white bg-black px-1.5 py-0.5 rounded font-bold flex-shrink-0">AD</span>
      </div>
    </a>
  );
}