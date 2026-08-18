"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const AMOUNTS = [10, 50, 100, 200];

export default function ProfileShare({ id, code, name }: { id: string; code: string; name: string }) {
  const [copied, setCopied] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);
  const [amount, setAmount] = useState(50);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const link = `${window.location.origin}/farmer/${code || id}`;
  const text = `🌾 Meet ${name} on Farming Tech & Business — the free app where farmers learn, sell & EARN money. Join with my link 👇`;
  const en = encodeURIComponent;

  function share(net: string) {
    const links: any = {
      wa: `https://wa.me/?text=${en(text + "\n" + link)}`,
      fb: `https://www.facebook.com/sharer/sharer.php?u=${en(link)}`,
      x: `https://twitter.com/intent/tweet?text=${en(text)}&url=${en(link)}`,
      pin: `https://pinterest.com/pin/create/button/?url=${en(link)}&description=${en(text)}`,
      tg: `https://t.me/share/url?url=${en(link)}&text=${en(text)}`,
    };
    if (net === "copy") {
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } else if (net === "status") {
      navigator.clipboard.writeText(text + "\n" + link);
      window.open("https://wa.me/", "_blank");
    } else {
      window.open(links[net], "_blank");
    }
  }

  async function sendTip() {
    setBusy(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { alert("Log in to send gifts."); setBusy(false); return; }
    if (user.id === id) { alert("You cannot gift yourself."); setBusy(false); return; }
    const { data: myPts } = await supabase.rpc("user_points", { uid: user.id });
    if ((myPts || 0) < amount) { alert("Not enough points — you have " + (myPts || 0) + " pts. Earn more by posting, sharing & daily check-ins!"); setBusy(false); return; }
    const fee = Math.round(amount * 0.1);
    await supabase.from("tips").insert({ from_id: user.id, to_id: id, amount, fee, note: note || null });
    alert("🎁 You gifted " + (amount - fee) + " pts to " + name + "! Thank you for spreading love. (10% platform fee applied)");
    setTipOpen(false);
    setNote("");
    setBusy(false);
  }

  return (
    <div className="glass-card p-3 rounded-2xl">
      <div className="flex items-center gap-2">
        <p className="flex-1 text-[10px] font-mono font-bold text-forest-700 truncate">🔗 /farmer/{code || id.slice(0, 6)}</p>
        <button onClick={() => setTipOpen(true)} className="text-[10px] font-bold bg-pink-600 text-white px-3 py-1.5 rounded-full">🎁 Tip</button>
        <button onClick={() => share("copy")} className="text-[10px] font-bold bg-forest-600 text-white px-3 py-1.5 rounded-full">
          {copied ? "✅ Copied!" : "Copy Link"}
        </button>
      </div>
      <div className="flex items-center gap-2 mt-2 text-xs font-bold text-gray-600">
        <span className="text-[9px] text-gray-400">Share profile:</span>
        <button onClick={() => share("wa")} title="WhatsApp">📤</button>
        <button onClick={() => share("status")} title="WhatsApp Status">🟢</button>
        <button onClick={() => share("fb")} title="Facebook">f</button>
        <button onClick={() => share("x")} title="X / Twitter">𝕏</button>
        <button onClick={() => share("pin")} title="Pinterest">📌</button>
        <button onClick={() => share("tg")} title="Telegram">✈️</button>
      </div>
      <p className="text-[9px] text-gray-400 mt-1">This link is also your referral link — everyone who joins through it grows your points & earnings. 🎁</p>

      {tipOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setTipOpen(false)}>
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <p className="text-lg font-extrabold text-center">🎁 Gift points to {name}</p>
            <p className="text-[10px] text-gray-500 text-center mt-1">Reward great content & kindness. 10% platform fee applies.</p>
            <div className="grid grid-cols-4 gap-2 mt-4">
              {AMOUNTS.map((a) => (
                <button key={a} onClick={() => setAmount(a)} className={`py-2 rounded-xl text-sm font-extrabold ${amount === a ? "bg-pink-600 text-white" : "bg-gray-100 text-gray-600"}`}>{a}</button>
              ))}
            </div>
            <input className="w-full p-2 mt-3 rounded-xl border border-gray-200 text-sm" placeholder="Add a kind note (optional)..." value={note} onChange={(e) => setNote(e.target.value)} />
            <p className="text-[10px] text-gray-500 mt-2 text-center">They receive <b>{Math.round(amount * 0.9)}</b> pts · platform keeps <b>{Math.round(amount * 0.1)}</b> pts</p>
            <button onClick={sendTip} disabled={busy} className="w-full mt-3 bg-pink-600 text-white py-3 rounded-xl font-extrabold disabled:opacity-50">
              {busy ? "Sending..." : "🎁 Send " + amount + " pts"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}