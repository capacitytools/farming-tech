"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ContactPage() {
  const [message, setMessage] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: any) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMsg("Please log in first so we can reply to you. 🙏");
      setBusy(false);
      return;
    }
    const { data: admin } = await supabase.from("profiles").select("id").eq("role", "admin").limit(1).single();
    if (!admin) {
      setMsg("Admin not found.");
      setBusy(false);
      return;
    }
    const { error } = await supabase.from("direct_messages").insert({ sender_id: user.id, receiver_id: admin.id, content: "📬 CONTACT: " + message.trim() });
    if (error) setMsg("Error: " + error.message);
    else {
      setMsg("✅ Message sent! The admin will reply in your Inbox.");
      setMessage("");
    }
    setBusy(false);
  }

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">📬 Contact Admin</h1>
      <p className="text-gray-600 text-sm mb-6">Questions, partnerships, verification receipts, reports — we reply fast.</p>

      <form onSubmit={submit} className="glass-card p-5 rounded-2xl space-y-4">
        <textarea className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" rows={4} placeholder="Write your message..." required value={message} onChange={(e) => setMessage(e.target.value)} />
        <button className="w-full bg-green-600 text-white py-3 rounded-xl font-bold disabled:opacity-50" disabled={busy}>
          {busy ? "Sending..." : "📨 Send Message"}
        </button>
        {msg && <p className="text-sm text-center text-green-700">{msg}</p>}
      </form>

      <div className="glass-card p-4 rounded-2xl mt-6 text-sm text-gray-600 space-y-2">
        <p className="font-bold text-gray-800">Other ways to reach us:</p>
        <p>💬 WhatsApp: +234 915 988 4244</p>
        <p>📘 Facebook: Farming Tech & Business</p>
        <p>▶️ YouTube: @animalstipss</p>
      </div>
    </div>
  );
}