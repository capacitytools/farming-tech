"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function PayoutsPage() {
  const [pool, setPool] = useState("10000");
  const [rows, setRows] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase.from("profiles").select("id, full_name, whatsapp, referral_code").eq("verified", true);
    const list: any[] = [];
    for (const m of data || []) {
      const { data: pts } = await supabase.rpc("user_points", { uid: m.id });
      list.push({ ...m, points: pts || 0 });
    }
    list.sort((a, b) => b.points - a.points);
    setRows(list);
    setLoaded(true);
  }

  useEffect(() => { load(); }, []);

  const totalPoints = rows.reduce((s, r) => s + r.points, 0);
  const poolNum = Number(pool) || 0;
  const perPoint = totalPoints > 0 ? poolNum / totalPoints : 0;
  const share = (r: any) => r.points * perPoint;

  function exportCSV() {
    const lines = ["Name,WhatsApp,Points,Share (NGN)"];
    rows.forEach((r) => lines.push(`"${(r.full_name || "").replace(/"/g, "'")}",${r.whatsapp || ""},${r.points},${share(r).toFixed(2)}`));
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "ftb-monthly-payouts.csv";
    a.click();
  }

  if (!loaded) return <p className="text-center text-gray-500 py-10">Loading verified members…</p>;

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-extrabold mb-1">💵 Monthly Payout Calculator</h1>
      <p className="text-xs text-gray-500 mb-4">Type this month's ad pool, and the app divides it fairly by points among verified members. Export & pay via WhatsApp/bank.</p>

      <div className="glass-card p-4 rounded-2xl mb-4">
        <label className="text-xs font-bold text-gray-600">This month's pool (₦)</label>
        <input className="w-full p-3 rounded-xl border border-gray-200 bg-white/70 font-mono text-lg font-bold" value={pool} onChange={(e) => setPool(e.target.value)} />
        <div className="grid grid-cols-3 gap-2 mt-3 text-center">
          <div className="bg-green-50 rounded-xl p-2"><p className="text-lg font-extrabold text-green-700">{rows.length}</p><p className="text-[9px] text-gray-500">Verified members</p></div>
          <div className="bg-amber-50 rounded-xl p-2"><p className="text-lg font-extrabold text-amber-700">{totalPoints.toLocaleString()}</p><p className="text-[9px] text-gray-500">Total points</p></div>
          <div className="bg-purple-50 rounded-xl p-2"><p className="text-lg font-extrabold text-purple-700">₦{perPoint.toFixed(2)}</p><p className="text-[9px] text-gray-500">Per point</p></div>
        </div>
        <button onClick={exportCSV} className="w-full mt-3 bg-forest-600 text-white py-2.5 rounded-xl text-sm font-bold">📥 Export Payout List (CSV)</button>
      </div>

      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={r.id} className="glass-card p-3 rounded-2xl flex items-center gap-3">
            <span className="text-lg">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "•"}</span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">{r.full_name || "Farmer"} ✅</p>
              <p className="text-[10px] text-gray-500">{r.points.toLocaleString()} pts {r.whatsapp ? `· 📞 ${r.whatsapp}` : ""}</p>
            </div>
            <p className="font-mono font-extrabold text-green-700">₦{share(r).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
        ))}
        {rows.length === 0 && <p className="text-sm text-gray-500 text-center py-6">No verified members yet — payouts begin when verification does.</p>}
      </div>
    </div>
  );
}