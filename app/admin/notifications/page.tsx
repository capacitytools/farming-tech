"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminNotifications() {
  const [items, setItems] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [msg, setMsg] = useState("");

  async function load() {
    const supabase = createClient();
    const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(20);
    setItems(data || []);
  }
  useEffect(() => {
    load();
  }, []);

  async function send(e: any) {
    e.preventDefault();
    setMsg("");
    const supabase = createClient();
    const { error } = await supabase.from("notifications").insert({ title, message });
    if (error) setMsg("Error: " + error.message);
    else {
      setMsg("Announcement sent to all users 🔔");
      setTitle("");
      setMessage("");
      load();
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this announcement?")) return;
    const supabase = createClient();
    await supabase.from("notifications").delete().eq("id", id);
    load();
  }

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🔔 Broadcast Announcement</h1>
      <form onSubmit={send} className="glass-card p-5 rounded-2xl space-y-4 mb-8">
        <input className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" placeholder="Title, e.g. New e-book released! *" required value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" placeholder="Message (optional)" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
        {msg && <p className="text-sm text-center text-green-700">{msg}</p>}
        <button className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold">📢 Send to all users</button>
      </form>

      <h2 className="font-bold mb-3">Sent announcements</h2>
      <div className="space-y-3">
        {items.map((n) => (
          <div key={n.id} className="glass-card p-4 rounded-2xl flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm">{n.title}</h3>
              <p className="text-xs text-gray-500 mt-1">{n.message}</p>
            </div>
            <button onClick={() => remove(n.id)} className="text-red-600 text-sm font-semibold ml-3">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}