"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function DailyCheckin() {
  const [info, setInfo] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const today = new Date().toISOString().slice(0, 10);
        const { data: done } = await supabase.from("checkins").select("id").eq("user_id", user.id).eq("day", today).single();
        if (done) return;
        const { data: me } = await supabase.from("profiles").select("last_checkin, streak_count").eq("id", user.id).single();
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        const streak = me?.last_checkin === yesterday ? (me.streak_count || 0) + 1 : 1;
        setInfo({ streak });
      } catch {}
    })();
  }, []);

  async function claim() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);
    await supabase.from("checkins").insert({ user_id: user.id, streak: info.streak });
    await supabase.from("profiles").update({ last_checkin: today, streak_count: info.streak }).eq("id", user.id);
    setInfo(null);
  }

  if (!info) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center">
        <p className="text-5xl mb-2">🔥</p>
        <p className="text-lg font-extrabold text-forest-800">Day {info.streak} Streak!</p>
        <p className="text-xs text-gray-500 mt-1">You opened Farming Tech & Business today. Claim your +5 points and keep the fire burning. Miss a day and the streak resets!</p>
        <button onClick={claim} className="w-full mt-4 bg-orange-500 text-white py-3 rounded-xl font-extrabold">🔥 Claim +5 Points</button>
        <button onClick={() => setInfo(null)} className="mt-2 text-xs text-gray-400 underline">later</button>
      </div>
    </div>
  );
}