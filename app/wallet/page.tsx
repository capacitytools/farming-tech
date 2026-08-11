"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const ADMIN_WHATSAPP = "2349159884244";

export default function WalletPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [points, setPoints] = useState(0);
  const [amount, setAmount] = useState("");
  const [bank, setBank] = useState("");
  const [msg, setMsg] = useState("");
  const [loaded, setLoaded] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data: { user: u } } = await supabase.auth.getUser();
    setUser(u);
    if (u) {
      const { data: p } = await supabase.from("profiles").select("*").eq("id", u.id).single();
      setProfile(p);
      const { data: pts } = await supabase.rpc("user_points", { uid: u.id });
      setPoints(pts || 0);
    }
    setLoaded(true);
  }

  useEffect(() => {
    load();
  }, []);

  async function markPending() {
    const supabase = createClient();
    await supabase.from("profiles").update({ verification_requested: true }).eq("id", user.id);
    setMsg("📲 Marked as pending — admin will confirm your verification shortly!");
    load();
  }

  async function activateMonetization() {
    const supabase = createClient();
    await supabase.from("profiles").update({ monetized: true }).eq("id", user.id);
    setMsg("🎉 Monetization activated! You now earn from the Creator Pool.");
    load();
  }

  async function requestPayout(e: any) {
    e.preventDefault();
    setMsg("");    const amt = Number(amount);
    if (!amt || amt < 1000) return setMsg("Minimum payout is ₦1,000.");
    if (amt > Number(profile.wallet_balance || 0)) return setMsg("Amount is more than your balance.");
    if (!bank.trim()) return setMsg("Enter your bank details.");
    const supabase = createClient();
    await supabase.from("profiles").update({ wallet_balance: Number(profile.wallet_balance) - amt }).eq("id", user.id);
    await supabase.from("payout_requests").insert({ user_id: user.id, amount: amt, bank_info: bank.trim() });
    setMsg("✅ Payout requested! You'll be paid within 48 hours.");
    setAmount("");
    load();
  }

  if (!loaded) return <p className="text-center text-gray-500 py-10">Loading…</p>;
  if (!user) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-2">💵 Wallet & Verification</h1>
        <p className="text-gray-500 mb-6">Log in to see your wallet.</p>
        <a href="/login" className="inline-block bg-green-600 text-white px-6 py-3 rounded-xl font-semibold">Log in</a>
      </div>
    );
  }

  const verified = profile?.verified;
  const monetized = profile?.monetized;
  const pending = profile?.verification_requested;

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">💵 Wallet & Verification</h1>

      <div className={`glass-card p-5 rounded-2xl mb-4 border-2 ${verified ? "border-sky-400" : "border-gray-200"}`}>
        <h2 className="font-bold mb-2">{verified ? "✅ Verified Member" : "🎫 Get Verified — ₦1,000/month"}</h2>
        {verified ? (
          <p className="text-sm text-gray-600">You're verified until {profile.verified_until ? new Date(profile.verified_until).toLocaleDateString() : "—"} ✅</p>
        ) : pending ? (
          <p className="text-sm text-amber-700 font-semibold">⏳ Payment pending confirmation — admin will verify you shortly!</p>
        ) : (
          <>
            <ul className="text-sm text-gray-700 space-y-1 mb-3">
              <li>✅ Verified badge on your profile, posts & comments</li>
              <li>💵 Unlock earning from the Creator Pool</li>
              <li>🤝 More trust = more sales on your listings</li>
              <li>🎓 Access to Verified Farmers tribe</li>
            </ul>
            <p className="text-xs text-gray-500 mb-3">How: transfer ₦1,000 to the platform account, send your receipt on WhatsApp, then mark yourself as pending.</p>
            <a
              href={`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent("Hello! I just paid ₦1,000 for VERIFIED membership. My account email is: " + user.email)}`}
              className="block text-center bg-sky-600 text-white py-3 rounded-xl font-bold mb-2"
            >              📲 Send Receipt on WhatsApp
            </a>
            <button onClick={markPending} className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold">
              ✅ I Have Paid — Mark Me as Pending
            </button>
          </>
        )}
      </div>

      <div className={`glass-card p-5 rounded-2xl mb-4 border-2 ${monetized ? "border-green-400" : "border-gray-200"}`}>
        <h2 className="font-bold mb-2">💵 Creator Monetization</h2>
        {monetized ? (
          <p className="text-sm text-green-700 font-semibold">Active ✅ — your monthly share of ad revenue lands in your wallet.</p>
        ) : verified ? (
          <>
            <p className="text-sm text-gray-600 mb-2">Requires 500 points. You have <b>{points} pts</b>.</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: `${Math.min(100, (points / 500) * 100)}%` }} />
            </div>
            <button onClick={activateMonetization} disabled={points < 500} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold disabled:opacity-40">
              {points >= 500 ? "🚀 Activate Monetization" : `Earn ${500 - points} more points to unlock`}
            </button>
          </>
        ) : (
          <p className="text-sm text-gray-500">Get verified first to unlock monetization. ⬆️</p>
        )}
      </div>

      <div className="glass-card p-5 rounded-2xl mb-4">
        <h2 className="font-bold mb-1">👛 My Wallet</h2>
        <p className="text-4xl font-extrabold text-green-700 mb-4">₦{Number(profile?.wallet_balance || 0).toLocaleString()}</p>
        <form onSubmit={requestPayout} className="space-y-3">
          <input className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" type="number" placeholder="Amount (min ₦1,000)" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <input className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" placeholder="Bank name + account number" value={bank} onChange={(e) => setBank(e.target.value)} />
          <button className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold">🏦 Request Payout</button>
        </form>
        {msg && <p className="text-sm text-center text-green-700 mt-3">{msg}</p>}
      </div>

      <div className="glass-card p-4 rounded-2xl text-xs text-gray-600 space-y-1">
        <p className="font-bold text-gray-800 text-sm mb-1">How you earn:</p>
        <p>1️⃣ Get verified (₦1,000/mo) → 2️⃣ Reach 500 pts → 3️⃣ Activate monetization</p>
        <p>4️⃣ Every month, 50% of the platform's ad revenue is shared among monetized farmers based on points earned. Post, share & engage to grow your share! 📈</p>
      </div>
    </div>
  );
}