"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminConsultations() {
  const [rows, setRows] = useState<any[]>([]);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase.from("consultations").select("*, profiles(full_name, whatsapp), experts(name)").order("created_at", { ascending: false }).limit(30);
    setRows(data || []);
  }
  useEffect(() => {
    load();
  }, []);

  async function setStatus(id: string, status: string) {
    const supabase = createClient();
    await supabase.from("consultations").update({ status }).eq("id", id);
    load();
  }

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">🎓 Consultation Bookings</h1>
      <p className="text-xs text-gray-500 mb-6">Confirm payment (user pays expert fee via transfer) → collect your 10% → connect them on WhatsApp.</p>

      <div className="space-y-3">
        {rows.map((c) => (
          <div key={c.id} className="glass-card p-4 rounded-2xl">
            <div className="flex items-center justify-between">
              <p className="font-bold text-sm">{c.profiles?.full_name} → {c.experts?.name}</p>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${c.status === "pending" ? "bg-yellow-100 text-yellow-700" : c.status === "confirmed" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{c.status}</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">🗂️ {c.topic}</p>
            <p className="text-xs text-gray-500">🕐 {c.preferred_time} · 💵 ₦{Number(c.fee).toLocaleString()} (your cut: ₦{Math.round(Number(c.fee) * 0.1).toLocaleString()})</p>
            {c.status === "pending" && (
              <div className="flex gap-2 mt-2">
                <button onClick={() => setStatus(c.id, "confirmed")} className="flex-1 bg-green-600 text-white py-2 rounded-xl text-xs font-bold">✅ Confirm</button>
                <button onClick={() => setStatus(c.id, "cancelled")} className="flex-1 bg-red-500 text-white py-2 rounded-xl text-xs font-bold">Cancel</button>
              </div>
            )}
          </div>
        ))}
        {rows.length === 0 && <p className="text-gray-500 text-center py-10">No bookings yet.</p>}
      </div>
    </div>
  );
}