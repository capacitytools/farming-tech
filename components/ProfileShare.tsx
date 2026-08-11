"use client";

import { useEffect, useState } from "react";

export default function ProfileShare({ id, code, name }: { id: string; code: string; name: string }) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(`${window.location.origin}/farmer/${id}?ref=${code}`);
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) localStorage.setItem("refCode", ref);
  }, [id, code]);

  if (!url) return null;

  const text = `Follow ${name} on Farming Tech & Business 🌾`;
  const e = encodeURIComponent;
  const btn = "flex-1 py-2 rounded-xl text-xs font-bold text-white text-center active:scale-95";

  return (
    <div className="flex gap-2 mt-2">
      <a className={btn + " bg-green-600"} href={`https://wa.me/?text=${e(text + " " + url)}`}>📤 WhatsApp</a>
      <a className={btn + " bg-blue-600"} href={`https://www.facebook.com/sharer/sharer.php?u=${e(url)}`}>Facebook</a>
      <a className={btn + " bg-gray-800"} href={`https://twitter.com/intent/tweet?text=${e(text)}&url=${e(url)}`}>𝕏</a>
      <button className={btn + " bg-gray-500"} onClick={() => navigator.clipboard.writeText(url)}>🔗</button>
    </div>
  );
}