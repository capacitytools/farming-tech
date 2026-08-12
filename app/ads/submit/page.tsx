"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SubmitAd() {
  const [business, setBusiness] = useState("");
  const [text, setText] = useState("");
  const [link, setLink] = useState("");
  const [image, setImage] = useState("");
  const [msg, setMsg] = useState("");
  const [code, setCode] = useState("");

  async function upload(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `ad-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("blog-images").upload(path, file);
    if (!error) setImage(supabase.storage.from("blog-images").getPublicUrl(path).data.publicUrl);
  }

  async function submit(e: any) {
    e.preventDefault();
    setMsg("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setMsg("Log in first.");
    const adCode = "AD-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    const { error } = await supabase.from("ad_campaigns").insert({ code: adCode, user_id: user.id, business_name: business, ad_text: text, link: link || null, image_url: image || null });
    if (error) setMsg("Error: " + error.message);
    else {
      setCode(adCode);
      setMsg("✅ Submitted! Once admin approves it, give them this code to slot it into videos.");
    }
  }

  const input = "w-full p-3 rounded-xl border border-gray-200 bg-white/70";

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">📢 Promote Your Business</h1>
      <p className="text-gray-600 text-sm mb-6">Your ad scrolls under videos across the platform — thousands of farmers see it while they watch!</p>

      <form onSubmit={submit} className="glass-card p-5 rounded-2xl space-y-3">
        <input className={input} placeholder="Business name *" required value={business} onChange={(e) => setBusiness(e.target.value)} />
        <textarea className={input} rows={2} placeholder="Ad text (short & catchy) *" required value={text} onChange={(e) => setText(e.target.value)} />
        <input className={input} placeholder="Website / WhatsApp link (optional)" value={link} onChange={(e) => setLink(e.target.value)} />
        <div>
          <label className="text-sm font-semibold text-gray-600">Logo / image (optional)</label>
          <input type="file" accept="image/*" onChange={upload} className="w-full text-sm mt-1" />
          {image && <img src={image} alt="" className="mt-2 h-12 w-12 object-cover rounded-lg" />}
        </div>
        {code && <p className="text-center text-lg font-extrabold text-purple-700">Your ad code: {code}</p>}
        {msg && <p className="text-sm text-center text-green-700">{msg}</p>}
        <button className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold">📨 Submit for Approval</button>
      </form>
    </div>
  );
}