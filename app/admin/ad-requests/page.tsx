"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminAdRequests() {
  const [rows, setRows] = useState<any[]>([]);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase.from("ad_campaigns").select("*, profiles(full_name)").order("created_at", { ascending: false }).limit(30);
    setRows(data || []);
  }
  useEffect(() => {
    load();
  }, []);

  async function setStatus(id: string, status: string) {
    const supabase = createClient();
    await supabase.from("ad_campaigns").update({ status }).eq("id", id);
    load();
  }

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">📢 Ad Requests</h1>
      <p className="text-xs text-gray-500 mb-6">Approve ads → copy their CODE → slot it into any video at /admin/videos.</p>

      <div className="space-y-3">
        {rows.map((a) => (
          <div key={a.id} className="glass-card p-4 rounded-2xl">
            <div className="flex items-center justify-between">
              <p className="font-bold text-sm">{a.business_name}</p>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${a.status === "approved" ? "bg-green-100 text-green-700" : a.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>{a.status}</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">📜 {a.ad_text}</p>
            <p className="text-xs text-gray-500 mt-1">by {a.profiles?.full_name} · code: <b className="text-purple-700">{a.code}</b></p>
            {a.image_url && <img src={a.image_url} alt="" className="mt-2 h-12 w-12 object-cover rounded-lg" />}
            {a.status === "pending" && (
              <div className="flex gap-2 mt-2">
                <button onClick={() => setStatus(a.id, "approved")} className="flex-1 bg-green-600 text-white py-2 rounded-xl text-xs font-bold">✅ Approve</button>
                <button onClick={() => setStatus(a.id, "rejected")} className="flex-1 bg-red-500 text-white py-2 rounded-xl text-xs font-bold">Reject</button>
              </div>
            )}
          </div>
        ))}
        {rows.length === 0 && <p className="text-gray-500 text-center py-10">No ad requests yet.</p>}
      </div>
    </div>
  );
}