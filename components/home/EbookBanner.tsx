"use client";

import Link from "next/link";

export default function EbookBanner({ count }: { count: number }) {
  return (
    <Link href="/ebooks" className="block mx-4 mt-6 relative overflow-hidden rounded-2xl border-2 border-amber-400 shadow-xl active:scale-[0.98]">
      <style>{`
        @keyframes ftbShine { 0% { transform: translateX(-100%);} 100% { transform: translateX(200%);} }
        @keyframes ftbScroll { 0% { transform: translateX(0);} 100% { transform: translateX(-50%);} }
        @keyframes ftbBlink { 0%,100% { opacity: 1;} 50% { opacity: .25;} }
      `}</style>
      <div className="bg-gradient-to-r from-forest-800 via-forest-600 to-forest-800 p-3 relative">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,.35) 50%, transparent 60%)", animation: "ftbShine 2.5s infinite" }} />
        <div className="flex justify-between px-1 mb-1">
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} className="w-1.5 h-1.5 rounded-full bg-amber-300" style={{ animation: "ftbBlink 1s infinite", animationDelay: `${i * 0.12}s` }} />
          ))}
        </div>
        <div className="overflow-hidden">
          <div className="flex whitespace-nowrap" style={{ animation: "ftbScroll 12s linear infinite" }}>
            {[0, 1].map((k) => (
              <span key={k} className="text-amber-300 font-extrabold text-sm pr-8">
                📚 EBOOK STORE — master rabbit, poultry, fish & crop farming from real farmers · authors keep 70% of every sale · {count}+ ebooks inside · TAP TO ENTER →&nbsp;&nbsp;&nbsp;
              </span>
            ))}
          </div>
        </div>
        <div className="flex justify-between px-1 mt-1">
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} className="w-1.5 h-1.5 rounded-full bg-amber-300" style={{ animation: "ftbBlink 1s infinite", animationDelay: `${0.5 + i * 0.12}s` }} />
          ))}
        </div>
      </div>
    </Link>
  );
}