"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const RANK_ICONS: any = {
  "Beginner Star": "⭐",
  "Master Star": "🌟",
  "Premium Star": "💫",
  "Professional Star": "🏅",
  "Golden Star": "👑",
};

export default function LeaderboardPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.rpc("public_leaderboard");
      setRows(data || []);
      setLoaded(true);
    })();
  }, []);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">🏆 Top Farmers Leaderboard</h1>
      <p className="text-gray-600 text-sm mb-6">Tap any farmer to see their profile, listings & reviews. ✅ = verified</p>

      {!loaded ? (
        <p className="text-center text-gray-500 py-10">Loading…</p>
      ) : (
        <div className="space-y-2">
          {rows.map((u, i) => (
            <Link key={u.id} href={`/farmer/${u.id}`} className={`glass-card p-3 rounded-2xl flex items-center gap-3 ${i < 3 ? "border-2 border-amber-300" : ""}`}>
              <span className="w-8 text-center font-bold text-gray-500">{i < 3 ? medals[i] : `#${i + 1}`}</span>
              {u.avatar_url ? (
                <img src={u.avatar_url} className="w-10 h-10 rounded-full object-cover" alt="" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center font-bold text-green-800">
                  {(u.full_name || "?")[0]}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">
                  {u.full_name || "Farmer"} {u.verified && <span className="text-sky-500">✅</span>}
                </p>
                <p className="text-[10px] text-gray-500">{RANK_ICONS[u.rank]} {u.rank}</p>
              </div>
              <span className="font-bold text-amber-600 text-sm">{u.points} pts</span>
            </Link>
          ))}
          {rows.length === 0 && <p className="text-center text-gray-500 py-10">No farmers yet — be the first!</p>}
        </div>
      )}

      <div className="glass-card p-4 rounded-2xl mt-6 text-xs text-gray-600 space-y-1">
        <p className="font-bold text-gray-800 text-sm mb-1">How to earn points:</p>
        <p>➕ Join a tribe = 10 pts · 📣 Post = 15 pts · 💬 Reply = 5 pts</p>
        <p>🐄 Create listing = 20 pts · 📚 Buy e-book = 30 pts · 🩺 AI scan = 10 pts · ⭐ Review = 5 pts · 🎁 Referral = 25 pts</p>
        <p>📣 Timeline: post = 10 · like = 1 · comment = 3 · views & received likes/comments = bonus!</p>
      </div>
    </div>
  );
}