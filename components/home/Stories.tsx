"use client";

import { useEffect, useState } from "react";

const STORIES = [
  { emoji: "🐇", name: "Chinedu, Enugu", text: "I scanned my rabbit with the AI Doctor, caught mites early, saved my herd & sold 10 kits on the Market." },
  { emoji: "🐔", name: "Mama Bisi, Ibadan", text: "The points shocked me — I was just posting my farm updates. At month-end I got my share of the ad money!" },
  { emoji: "🐐", name: "Alhaji Musa, Kaduna", text: "Verified badge made buyers trust me. I sold 6 goats in one week without leaving my house." },
  { emoji: "🎬", name: "Tunde the Creator, Lagos", text: "My training MP3s & e-book now earn me 70% royalties while I sleep. This app pays creators for real." },
];

export default function Stories() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % STORIES.length), 4500);
    return () => clearInterval(t);
  }, []);

  const s = STORIES[i];

  return (
    <div className="glass-card p-4 rounded-2xl border-l-4 border-green-500">
      <p className="text-xs font-bold text-green-700 mb-2">💬 WHAT EARLY MEMBERS SAY</p>
      <p className="text-3xl mb-1">{s.emoji}</p>
      <p className="text-sm text-gray-800 italic">"{s.text}"</p>
      <p className="text-xs font-bold text-forest-700 mt-2">— {s.name}</p>
      <div className="flex gap-1 mt-3">
        {STORIES.map((_, x) => (
          <button key={x} onClick={() => setI(x)} className={`h-1.5 rounded-full ${x === i ? "w-6 bg-green-600" : "w-2 bg-gray-300"}`} />
        ))}
      </div>
    </div>
  );
}