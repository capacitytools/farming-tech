"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function RecruitersPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.rpc("top_recruiters");
      setRows(data || []);
      setLoaded(true);
    })();
  }, []);

  const medals = ["🥇", "🥈", ""];

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">🎖️ Top Recruiters</h1>
      <p className="text-gray-600 text-sm mb-6">The farmers growing this community. +25 pts per referral!</p>

      {!loaded ? (
        <p className="text-center text-gray-500 py-10">Loading…</p>
      ) : (
        <div className="space-y-2">
          {rows.map((u, i) => (
            <Link key={u.id} href={`/farmer/${u.id}`} className="glass-card p-3 rounded-2xl flex items-center gap-3">
              <span className="w-8 text-center font-bold text-gray-500">{i < 3 ? medals[i] : `#${i + 1}`}</span>
              {u.avatar_url ? (
                <img src={u.avatar_url} className="w-10 h-10 rounded-full object-cover" alt="" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center font-bold text-green-800">{(u.full_name || "?")[0]}</div>
              )}
              <p className="flex-1 font-semibold text-sm truncate">{u.full_name || "Farmer"}</p>
              <span className="text-xs font-bold text-green-700">{u.referrals} invited</span>
            </Link>
          ))}
          {rows.length === 0 && <p className="text-center text-gray-500 py-10">No recruiters yet — share your invite link!</p>}
        </div>
      )}

      <div className="glass-card p-4 rounded-2xl mt-6 text-xs text-gray-600">
        <p className="font-bold text-gray-800 text-sm mb-1">How it works:</p>
        <p>Profile → 🎁 Invite & Earn → copy your link → share on WhatsApp/Facebook. Every signup = +25 pts + 10% e-book commissions when they buy!</p>
      </div>
    </div>
  );
}