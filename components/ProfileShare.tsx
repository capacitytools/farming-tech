"use client";

import { useState } from "react";

export default function ProfileShare({ id, code, name }: { id: string; code: string; name: string }) {
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}/farmer/${code || id}`;
  const text = `🌾 Meet ${name} on Farming Tech & Business — the free app where farmers learn, sell & EARN money. Join with my link 👇`;
  const en = encodeURIComponent;

  function share(net: string) {
    const links: any = {
      wa: `https://wa.me/?text=${en(text + "\n" + link)}`,
      fb: `https://www.facebook.com/sharer/sharer.php?u=${en(link)}`,
      x: `https://twitter.com/intent/tweet?text=${en(text)}&url=${en(link)}`,
      pin: `https://pinterest.com/pin/create/button/?url=${en(link)}&description=${en(text)}`,
      tg: `https://t.me/share/url?url=${en(link)}&text=${en(text)}`,
    };
    if (net === "copy") {
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } else if (net === "status") {
      navigator.clipboard.writeText(text + "\n" + link);
      window.open("https://wa.me/", "_blank");
    } else {
      window.open(links[net], "_blank");
    }
  }

  return (
    <div className="glass-card p-3 rounded-2xl">
      <div className="flex items-center gap-2">
        <p className="flex-1 text-[10px] font-mono font-bold text-forest-700 truncate">🔗 /farmer/{code || id.slice(0, 6)}</p>
        <button onClick={() => share("copy")} className="text-[10px] font-bold bg-forest-600 text-white px-3 py-1.5 rounded-full">
          {copied ? "✅ Copied!" : "Copy Link"}
        </button>
      </div>
      <div className="flex items-center gap-2 mt-2 text-xs font-bold text-gray-600">
        <span className="text-[9px] text-gray-400">Share profile:</span>
        <button onClick={() => share("wa")} title="WhatsApp">📤</button>
        <button onClick={() => share("status")} title="WhatsApp Status">🟢</button>
        <button onClick={() => share("fb")} title="Facebook">f</button>
        <button onClick={() => share("x")} title="X / Twitter">𝕏</button>
        <button onClick={() => share("pin")} title="Pinterest">📌</button>
        <button onClick={() => share("tg")} title="Telegram">✈️</button>
      </div>
      <p className="text-[9px] text-gray-400 mt-1">This link is also your referral link — everyone who joins through it grows your points & earnings. 🎁</p>
    </div>
  );
}