"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminTribes() {
  const [tribes, setTribes] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🌾");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase.from("tribes").select("*").order("name");
    setTribes(data || []);
  }
  useEffect(() => {
    load();
  }, []);

  async function uploadImage(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `tribe-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("blog-images").upload(path, file);
    if (!error) {
      setImageUrl(supabase.storage.from("blog-images").getPublicUrl(path).data.publicUrl);
    }
    setUploading(false);
  }

  async function addTribe(e: any) {
    e.preventDefault();
    setMessage("");
    const supabase = createClient();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const { error } = await supabase.from("tribes").insert({ name, icon, description, slug, image_url: imageUrl || null, member_count: 0 });
    if (error) setMessage("Error: " + error.message);
    else {
      setMessage("Tribe created ✅");
      setName(""); setDescription(""); setIcon("🌾"); setImageUrl("");
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
        <input className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" placeholder="Icon emoji (e.g. 🐄 🌾 🦃)" value={icon} onChange={(e) => setIcon(e.target.value)} />
        <textarea className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" placeholder="Description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        <div>
          <label className="text-sm font-semibold text-gray-600">Tribe image (optional)</label>
          <input type="file" accept="image/*" onChange={uploadImage} className="w-full text-sm mt-1" />
          {imageUrl && <img src={imageUrl} alt="tribe" className="mt-2 h-24 w-full object-cover rounded-xl" />}
        </div>
        {message && <p className="text-sm text-center text-green-700">{message}</p>}
        <button className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold" disabled={uploading}>Create Tribe</button>
      </form>

      <h2 className="font-bold mb-3">All tribes ({tribes.length})</h2>
      <div className="space-y-3">
        {tribes.map((t) => (
          <div key={t.id} className="glass-card p-4 rounded-2xl">
            <div className="flex gap-3">
              {t.image_url ? (
                <img src={t.image_url} alt={t.name} className="w-20 h-20 object-cover rounded-lg" />
              ) : (
                <div className="w-20 h-20 bg-forest-100 rounded-lg flex items-center justify-center text-4xl">{t.icon}</div>
              )}
              <div className="flex-1">
                <h3 className="font-bold">{t.icon} {t.name}</h3>
                <p className="text-xs text-gray-500">{t.description}</p>
                <p className="text-xs text-gray-400 mt-1">👥 {t.member_count} members</p>
                <button onClick={() => deleteTribe(t.id)} className="text-red-600 text-sm font-semibold mt-2">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}