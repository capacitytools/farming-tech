"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminExperts() {
  const [experts, setExperts] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [bio, setBio] = useState("");
  const [image, setImage] = useState("");
  const [msg, setMsg] = useState("");

  async function load() {
    const supabase = createClient();
    const { data } = await supabase.from("experts").select("*").order("created_at", { ascending: false });
    setExperts(data || []);
  }
  useEffect(() => {
    load();
  }, []);

  async function upload(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `expert-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("blog-images").upload(path, file);
    if (!error) setImage(supabase.storage.from("blog-images").getPublicUrl(path).data.publicUrl);
  }

  async function add(e: any) {
    e.preventDefault();
    setMsg("");
    const supabase = createClient();
    const { error } = await supabase.from("experts").insert({ name, specialty, location, phone, whatsapp, bio, image_url: image || null });
    if (error) setMsg("Error: " + error.message);
    else {
      setMsg("Expert added ✅");
      setName(""); setSpecialty(""); setLocation(""); setPhone(""); setWhatsapp(""); setBio(""); setImage("");
      load();
    }
  }

  async function remove(id: string) {
    if (!confirm("Remove this expert?")) return;
    const supabase = createClient();
    await supabase.from("experts").delete().eq("id", id);
    load();
  }

  const input = "w-full p-3 rounded-xl border border-gray-200 bg-white/70";

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🎓 Manage Experts</h1>

      <form onSubmit={add} className="glass-card p-5 rounded-2xl space-y-3 mb-8">
        <input className={input} placeholder="Full name *" required value={name} onChange={(e) => setName(e.target.value)} />
        <input className={input} placeholder="Specialty (e.g. Poultry Health Consultant)" value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
        <input className={input} placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <input className={input} placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <input className={input} placeholder="WhatsApp (with country code)" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
        </div>
        <textarea className={input} rows={2} placeholder="Short bio (experience, achievements)" value={bio} onChange={(e) => setBio(e.target.value)} />
        <div>
          <label className="text-sm font-semibold text-gray-600">Photo</label>
          <input type="file" accept="image/*" onChange={upload} className="w-full text-sm mt-1" />
          {image && <img src={image} alt="expert" className="mt-2 h-16 w-16 object-cover rounded-full" />}
        </div>
        {msg && <p className="text-sm text-center text-green-700">{msg}</p>}
        <button className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold">➕ Add Expert</button>
      </form>

      <h2 className="font-bold mb-3">Current experts ({experts.length})</h2>
      <div className="space-y-2">
        {experts.map((x) => (
          <div key={x.id} className="glass-card p-3 rounded-2xl flex items-center gap-3">
            {x.image_url ? (
              <img src={x.image_url} className="w-10 h-10 rounded-full object-cover" alt="" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-forest-200 flex items-center justify-center font-bold">{x.name?.[0]}</div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{x.name}</p>
              <p className="text-xs text-gray-500 truncate">{x.specialty}</p>
            </div>
            <button onClick={() => remove(x.id)} className="text-red-600 text-sm font-semibold">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}