"use client";

import { useState } from "react";

export default function ShareBar({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  function nativeShare() {
    if (navigator.share) navigator.share({ title, url }).catch(() => {});
    else copyLink();
  }

  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  const wa = `https://wa.me/?text=${encodeURIComponent(title + " " + url)}`;

  return (
    <div className="flex flex-wrap items-center gap-2 my-4">
      <button onClick={copyLink} className="px-3 py-2 rounded-xl bg-forest-600 text-white text-sm font-semibold">
        {copied ? "✅ Copied!" : "🔗 Copy link"}
      </button>
      <button onClick={nativeShare} className="px-3 py-2 rounded-xl bg-forest-100 dark:bg-forest-800 text-forest-800 dark:text-forest-100 text-sm font-semibold">
        📤 Share
      </button>
      <a href={fb} target="_blank" rel="noopener noreferrer" className="px-3 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold">
        Facebook
      </a>
      <a href={wa} target="_blank" rel="noopener noreferrer" className="px-3 py-2 rounded-xl bg-green-500 text-white text-sm font-semibold">
        WhatsApp
      </a>
    </div>
  );
}