"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminTrainers() {
  const [rows, setRows] = useState<any[]>([]);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase.from("profiles").select("id, full_name, role, can_host_training, trainer_requested").order("trainer_requested", { ascending: false }).limit(50);
    setRows(data || []);
  }
  useEffect(() => {
    load();
  }, []);

  async function setHost(id: string, v: boolean) {
    const supabase = createClient();
    await supabase.from("profiles").update({ can_host_training: v, trainer_requested: false }).eq("id", id);
    load();
  }

  const pending = rows.filter((r) => r.trainer_requested && !r.can_host_training);

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">🎙️ Approved Trainers</h1>
      <p className="text-xs text-gray-500 mb-6">Only admins, tribe leaders & people you approve here can start live training calls. Everyone can join & listen.</p>

      {pending.length > 0 && (
        <>
          <h2 className="font-bold mb-3 text-amber-700">⏳ Pending Requests ({pending.length})</h2>
          <div className="space-y-2 mb-8">
            {pending.map((r) => (
              <div key={r.id} className="glass-card p-3 rounded-2xl flex items-center gap-3 border-2 border-amber-300">
                <p className="flex-1 font-semibold text-sm truncate">🎙️ {r.full_name || "Farmer"}</p>
                <button onClick={() => setHost(r.id, true)} className="text-xs font-bold px-3 py-2 rounded-full bg-green-600 text-white">✅ Approve</button>
                <button onClick={() => setHost(r.id, false)} className="text-xs font-bold px-3 py-2 rounded-full bg-gray-200 text-gray-700">Ignore</button>
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className="font-bold mb-3">All Members</h2>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.id} className="glass-card p-3 rounded-2xl flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{r.full_name || "Farmer"} {r.can_host_training && "🎙️"} {r.role === "admin" && "👑"}</p>
              <p className="text-[10px] text-gray-500">{r.role}</p>
            </div>
            <button onClick={() => setHost(r.id, !r.can_host_training)} className={`text-xs font-bold px-3 py-2 rounded-full ${r.can_host_training ? "bg-green-600 text-white" : "bg-gray-200 text-gray-700"}`}>
              {r.can_host_training ? "Revoke" : "Approve"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}