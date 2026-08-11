"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminWallet() {
  const [rows, setRows] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [pool, setPool] = useState("");
  const [msg, setMsg] = useState("");

  async function load() {
    const supabase = createClient();
    const { data } = await supabase.rpc("admin_wallet_view");
    setRows(data || []);
    const { data: p } = await supabase.from("payout_requests").select("*, profiles(full_name)").eq("status", "pending").order("created_at", { ascending: false });
    setPayouts(p || []);
  }
  useEffect(() => {
    load();
  }, []);

  async function setVerified(id: string, v: boolean) {
    const supabase = createClient();
    const until = new Date();
    until.setMonth(until.getMonth() + 1);
    await supabase.from("profiles").update({ verified: v, verified_until: v ? until.toISOString() : null }).eq("id", id);
    load();
  }

  async function distribute() {
    const total = Number(pool);
    if (!total) return;
    const earners = rows.filter((r) => r.monetized && r.verified && r.points > 0);
    const totalPts = earners.reduce((a, r) => a + Number(r.points), 0);
    if (!totalPts) return setMsg("No monetized users with points yet.");
    const supabase = createClient();
    for (const r of earners) {
      const share = Math.floor((Number(r.points) / totalPts) * total);
      if (share > 0) await supabase.from("profiles").update({ wallet_balance: Number(r.wallet_balance) + share }).eq("id", r.id);
    }
    setMsg(`✅ ₦${total.toLocaleString()} distributed to ${earners.length} creators!`);
    setPool("");
    load();
  }

  async function resolvePayout(id: string, approve: boolean, userId: string, amount: number) {
    const supabase = createClient();
    if (approve) {
      await supabase.from("payout_requests").update({ status: "paid" }).eq("id", id);    } else {
      await supabase.from("payout_requests").update({ status: "rejected" }).eq("id", id);
      const { data: u } = await supabase.from("profiles").select("wallet_balance").eq("id", userId).single();
      await supabase.from("profiles").update({ wallet_balance: Number(u.wallet_balance) + amount }).eq("id", userId);
    }
    load();
  }

  const total = Number(pool) || 0;
  const earners = rows.filter((r) => r.monetized && r.verified && r.points > 0);
  const totalPts = earners.reduce((a, r) => a + Number(r.points), 0);

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">💵 Wallet Control Center</h1>

      <div className="glass-card p-5 rounded-2xl mb-6 border-2 border-green-300">
        <h2 className="font-bold mb-2">📈 Monthly Revenue Share</h2>
        <p className="text-xs text-gray-500 mb-3">Enter this month's Creator Pool (e.g. 50% of your Adsterra earnings). It's shared automatically by points.</p>
        <div className="flex gap-2">
          <input className="flex-1 p-3 rounded-xl border border-gray-200 bg-white/70" type="number" placeholder="Pool amount ₦" value={pool} onChange={(e) => setPool(e.target.value)} />
          <button onClick={distribute} className="bg-green-600 text-white px-4 rounded-xl font-bold">Distribute</button>
        </div>
        {total > 0 && earners.length > 0 && (
          <div className="mt-3 space-y-1 text-xs text-gray-600">
            {earners.map((r) => (
              <p key={r.id}>{r.full_name}: <b>₦{Math.floor((Number(r.points) / totalPts) * total).toLocaleString()}</b> ({r.points} pts)</p>
            ))}
          </div>
        )}
        {msg && <p className="text-sm text-green-700 mt-2">{msg}</p>}
      </div>

      <h2 className="font-bold mb-3">🏦 Payout Requests ({payouts.length})</h2>
      <div className="space-y-2 mb-8">
        {payouts.map((p) => (
          <div key={p.id} className="glass-card p-4 rounded-2xl">
            <div className="flex items-center justify-between">
              <p className="font-bold text-sm">{p.profiles?.full_name}</p>
              <p className="font-bold text-green-700">₦{Number(p.amount).toLocaleString()}</p>
            </div>
            <p className="text-xs text-gray-500 mt-1">{p.bank_info}</p>
            <div className="flex gap-2 mt-2">
              <button onClick={() => resolvePayout(p.id, true, p.user_id, Number(p.amount))} className="flex-1 bg-green-600 text-white py-2 rounded-xl text-xs font-bold">✅ Mark Paid</button>
              <button onClick={() => resolvePayout(p.id, false, p.user_id, Number(p.amount))} className="flex-1 bg-red-500 text-white py-2 rounded-xl text-xs font-bold">Reject & Refund</button>
            </div>
          </div>
        ))}
        {payouts.length === 0 && <p className="text-sm text-gray-500">No pending payouts.</p>}
      </div>
      <h2 className="font-bold mb-3">👥 Verify & Manage Members</h2>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.id} className="glass-card p-3 rounded-2xl flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{r.full_name || "Farmer"} {r.verified && "✅"} {r.monetized && "💵"}</p>
              <p className="text-[10px] text-gray-500">{r.points} pts · wallet ₦{Number(r.wallet_balance).toLocaleString()}</p>
            </div>
            <button onClick={() => setVerified(r.id, !r.verified)} className={`text-xs font-bold px-3 py-2 rounded-full ${r.verified ? "bg-gray-200 text-gray-700" : "bg-sky-600 text-white"}`}>
              {r.verified ? "Unverify" : "✅ Verify"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}