"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function BookExpert({ expertId, fee, name }: { expertId: string; fee: number; name: string }) {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [time, setTime] = useState("");
  const [msg, setMsg] = useState("");
  const [user, setUser] = useState<any>(null);
  const [checked, setChecked] = useState(false);

  async function check() {
    const supabase = createClient();
    const { data: { user: u } } = await supabase.auth.getUser();
    setUser(u);
    setChecked(true);
    setOpen(true);
  }

  async function submit(e: any) {
    e.preventDefault();
    const supabase = createClient();
    const { error } = await supabase.from("consultations").insert({ expert_id: expertId, user_id: user.id, topic: topic.trim(), preferred_time: time.trim(), fee: fee });
    if (error) setMsg("Error: " + error.message);
    else setMsg("✅ Request sent! Admin will confirm your slot & payment on WhatsApp.");
    setTopic("");
    setTime("");
  }

  if (!open) {
    return <button onClick={check} className="flex-1 bg-purple-600 text-white text-center py-2 rounded-xl text-sm font-bold">📅 Book</button>;
  }
  if (checked && !user) {
    return <a href="/login" className="flex-1 bg-purple-600 text-white text-center py-2 rounded-xl text-sm font-bold">Log in to Book</a>;
  }

  return (
    <form onSubmit={submit} className="w-full mt-2 space-y-2">
      <input required className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-xs" placeholder="What do you need help with?" value={topic} onChange={(e) => setTopic(e.target.value)} />
      <input required className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-xs" placeholder="Preferred day & time" value={time} onChange={(e) => setTime(e.target.value)} />
      <button className="w-full bg-purple-600 text-white py-2 rounded-xl text-xs font-bold">📅 Confirm Request (₦{Number(fee || 0).toLocaleString()})</button>
      {msg && <p className="text-[10px] text-green-700 text-center">{msg}</p>}
    </form>
  );
}