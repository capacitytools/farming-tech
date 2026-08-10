"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminTribes() {
  const [tribes, setTribes] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🌾");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const supabase = createClient();
    const { data } = await supabase.from("tribes").select("*").order("name");
    setTribes(data || []);
  }
  useEffect(() => {
    load();
  }, []);

  async function addTribe(e: any) {
    e.preventDefault();
    setMessage("");
    const supabase = createClient();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const { error } = await supabase.from("tribes").insert({ name, icon, description, slug, member_count: 0 });
    if (error) setMessage("Error: " + error.message);
    else {
      setMessage("Tribe created ✅");
      setName(""); setDescription(""); setIcon("🌾");
      load();
    }
  }

  async function deleteTribe(id: string) {
    if (!confirm("Delete this tribe?")) return;
    const supabase = createClient();
    await supabase.from("tribes").delete().eq("id", id);
    load();
  }

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🌾 Manage Tribes</h1>
      <form onSubmit={addTribe} className="glass-card p-5 rounded-2xl space-y-4 mb-8">
        <input className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" placeholder="Tribe name *" required value={name} onChange={(e) => setName(e.target.value)} />
        <input className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" placeholder="Icon emoji (e.g. 🐄 🌾 🐟)" value={icon} onChange={(e) => setIcon(e.target.value)} />
        <textarea className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" placeholder="Description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        {message && <p className="text-sm text-center text-green-700">{message}</p>}
        <button className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold">Create Tribe</button>
      </form>

      <h2 className="font-bold mb-3">All tribes ({tribes.length})</h2>
      <div className="space-y-3">
        {tribes.map((t) => (
          <div key={t.id} className="glass-card p-4 rounded-2xl flex items-center justify-between">
            <div>
              <h3 className="font-bold">{t.icon} {t.name}</h3>
              <p className="text-xs text-gray-500">{t.description}</p>
              <p className="text-xs text-gray-400 mt-1">👥 {t.member_count} members</p>
            </div>
            <button onClick={() => deleteTribe(t.id)} className="text-red-600 text-sm font-semibold">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}