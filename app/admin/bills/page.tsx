"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminBillsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [plansText, setPlansText] = useState("");
  const [msg, setMsg] = useState("");

  async function load() {
    const supabase = createClient();
    const { data } = await supabase.from("bill_orders").select("*, profiles(full_name)").order("created_at", { ascending: false }).limit(50);
    setOrders(data || []);
    const { data: cfg } = await supabase.from("settings").select("value").eq("key", "bill_plans").single();
    if (cfg && cfg.value) setPlansText(cfg.value);
  }

  useEffect(() => { load(); }, []);

  async function setStatus(id: string, status: string) {
    const supabase = createClient();
    await supabase.from("bill_orders").update({ status }).eq("id", id);
    setMsg(status === "fulfilled" ? "✅ Marked delivered." : "↩️ Marked refunded — refund the customer from your Paystack dashboard.");
    setTimeout(() => setMsg(""), 2500);
    load();
  }

  async function savePlans() {
    try {
      JSON.parse(plansText);
    } catch {
      return alert("Invalid format — check your commas and brackets.");
    }
    const supabase = createClient();
    await supabase.from("settings").upsert({ key: "bill_plans", value: plansText });
    setMsg("✅ Prices updated on the shop instantly.");
    setTimeout(() => setMsg(""), 2500);
  }

  const pending = orders.filter((o) => o.status === "pending");
  const profit = orders.filter((o) => o.status === "fulfilled").reduce((s, o) => s + (o.amount - o.cost), 0);

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-extrabold mb-1">📶 Bills Fulfillment Desk</h1>
      <p className="text-xs text-gray-500 mb-4">Deliver each pending order from your reseller source, then mark it delivered. Profit so far: ₦{profit.toLocaleString()}</p>
      {msg && <p className="text-xs font-bold text-green-700 mb-3">{msg}</p>}

      <h2 className="font-bold mb-2">⏳ Pending orders ({pending.length})</h2>
      <div className="space-y-2 mb-6">
        {pending.map((o) => (
          <div key={o.id} className="glass-card p-3 rounded-2xl border-l-4 border-amber-400">
            <div className="flex-1">
              <p className="text-sm font-extrabold">{o.service} — {o.plan}</p>
              <p className="text-[10px] text-gray-600">📞 {o.customer_phone} · paid ₦{o.amount.toLocaleString()} · your cost ₦{o.cost.toLocaleString()} · profit ₦{(o.amount - o.cost).toLocaleString()}</p>
              <p className="text-[9px] text-gray-400">{o.profiles?.full_name || "Customer"} · {new Date(o.created_at).toLocaleString()}</p>
            </div>
            <div className="flex gap-2 mt-2">
              <button onClick={() => setStatus(o.id, "fulfilled")} className="flex-1 bg-green-600 text-white py-2 rounded-xl text-xs font-bold">✅ Delivered</button>
              <button onClick={() => setStatus(o.id, "refunded")} className="flex-1 bg-red-100 text-red-600 py-2 rounded-xl text-xs font-bold">↩️ Refund</button>
            </div>
          </div>
        ))}
        {pending.length === 0 && <p className="text-sm text-gray-500">No pending orders right now.</p>}
      </div>

      <h2 className="font-bold mb-2">🕓 History</h2>
      <div className="space-y-2 mb-6">
        {orders.filter((o) => o.status !== "pending").slice(0, 20).map((o) => (
          <div key={o.id} className="glass-card p-3 rounded-2xl flex items-center gap-2">
            <div className="flex-1">
              <p className="text-xs font-bold">{o.service} — {o.plan} → {o.customer_phone}</p>
              <p className="text-[9px] text-gray-400">₦{o.amount.toLocaleString()} · {new Date(o.created_at).toLocaleDateString()}</p>
            </div>
            <span className={`text-[10px] font-extrabold ${o.status === "fulfilled" ? "text-green-600" : "text-red-500"}`}>{o.status}</span>
          </div>
        ))}
      </div>

      <h2 className="font-bold mb-2">💰 Control your prices</h2>
      <p className="text-[10px] text-gray-500 mb-2">Edit the JSON below (price = what farmers pay, cost = your wholesale). Save and the shop updates instantly. Leave empty to use default prices.</p>
      <textarea className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-[10px] font-mono" rows={12} value={plansText} onChange={(e) => setPlansText(e.target.value)} />
      <button onClick={savePlans} className="w-full mt-2 bg-forest-600 text-white py-2.5 rounded-xl text-sm font-bold">💾 Save Prices</button>
    </div>
  );
}