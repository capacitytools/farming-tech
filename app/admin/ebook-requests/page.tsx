"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminEbookRequests() {
  const [pending, setPending] = useState<any[]>([]);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase.from("ebooks").select("*, profiles(full_name)").eq("status", "pending").order("created_at", { ascending: false });
    setPending(data || []);
  }
  useEffect(() => {
    load();
  }, []);

  async function approve(id: string) {
    const supabase = createClient();
    await supabase.from("ebooks").update({ status: "approved", is_active: true }).eq("id", id);
    load();
  }

  async function reject(id: string) {
    if (!confirm("Reject & delete this e-book?")) return;
    const supabase = createClient();
    await supabase.from("ebooks").delete().eq("id", id);
    load();
  }

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">📚 E-book Requests ({pending.length})</h1>
      <div className="space-y-3">
        {pending.map((b) => (
          <div key={b.id} className="glass-card p-4 rounded-2xl flex gap-3">
            {b.cover_url ? <img src={b.cover_url} alt="" className="w-16 h-20 object-cover rounded-xl" /> : <div className="w-16 h-20 bg-forest-100 rounded-xl flex items-center justify-center text-2xl">📚</div>}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">{b.title}</p>
              <p className="text-xs text-gray-500">by {b.profiles?.full_name || "User"} · ₦{Number(b.price).toLocaleString()}</p>
              {b.file_url && <a href={b.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 font-semibold">📄 Review PDF</a>}
              <div className="flex gap-2 mt-2">
                <button onClick={() => approve(b.id)} className="flex-1 bg-green-600 text-white py-2 rounded-xl text-xs font-bold">✅ Approve</button>
                <button onClick={() => reject(b.id)} className="flex-1 bg-red-500 text-white py-2 rounded-xl text-xs font-bold">Reject</button>
              </div>
            </div>
          </div>
        ))}
        {pending.length === 0 && <p className="text-gray-500 text-center py-10">No pending e-books.</p>}
      </div>
    </div>
  );
}