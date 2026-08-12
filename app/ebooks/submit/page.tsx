"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SubmitEbook() {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [pdf, setPdf] = useState("");
  const [cover, setCover] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function upload(e: any, kind: "pdf" | "cover") {
    const file = e.target.files?.[0];
    if (!file) return;
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "bin";
    const path = `${kind}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("ebooks").upload(path, file);
    if (!error) {
      const url = supabase.storage.from("ebooks").getPublicUrl(path).data.publicUrl;
      if (kind === "pdf") setPdf(url);
      else setCover(url);
    } else setMsg("Upload error: " + error.message);
  }

  async function submit(e: any) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMsg("Log in first.");
      setBusy(false);
      return;
    }
    const { error } = await supabase.from("ebooks").insert({
      title,
      price: Number(price) || 0,
      currency: "NGN",
      file_url: pdf,
      cover_url: cover || null,
      author_id: user.id,
      status: "pending",
      is_active: false,
    });
    if (error) setMsg("Error: " + error.message);
    else setMsg("✅ Submitted! Admin will review it. You earn 70% of every sale once approved. 🎉");
    setBusy(false);
  }

  const input = "w-full p-3 rounded-xl border border-gray-200 bg-white/70";

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">📤 Publish Your E-book</h1>
      <p className="text-gray-600 text-sm mb-6">You keep <b className="text-green-700">70%</b> of every sale. Admin reviews for quality first.</p>

      <form onSubmit={submit} className="glass-card p-5 rounded-2xl space-y-4">
        <input className={input} placeholder="E-book title *" required value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className={input} type="number" placeholder="Price in ₦ (e.g. 1500) *" required value={price} onChange={(e) => setPrice(e.target.value)} />
        <div>
          <label className="text-sm font-semibold text-gray-600">PDF file *</label>
          <input type="file" accept="application/pdf" onChange={(e) => upload(e, "pdf")} className="w-full text-sm mt-1" />
          {pdf && <p className="text-xs text-green-700 mt-1">✅ PDF uploaded</p>}
        </div>
        <div>
          <label className="text-sm font-semibold text-gray-600">Cover image (optional)</label>
          <input type="file" accept="image/*" onChange={(e) => upload(e, "cover")} className="w-full text-sm mt-1" />
          {cover && <img src={cover} alt="cover" className="mt-2 h-20 w-16 object-cover rounded" />}
        </div>
        {msg && <p className="text-sm text-center text-green-700">{msg}</p>}
        <button className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold disabled:opacity-50" disabled={busy || !pdf}>
          {busy ? "Submitting..." : "🚀 Submit for Review"}
        </button>
      </form>
    </div>
  );
}