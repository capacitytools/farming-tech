"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { currencySymbol } from "@/lib/currency";
import Link from "next/link";

export default function EbooksPage() {
  const [user, setUser] = useState<any>(null);
  const [myCode, setMyCode] = useState("");
  const [books, setBooks] = useState<any[]>([]);
  const [msg, setMsg] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const aff = new URLSearchParams(window.location.search).get("aff");
    if (aff) localStorage.setItem("affCode", aff);

    const s = document.createElement("script");
    s.src = "https://js.paystack.co/v1/inline.js";
    s.async = true;
    document.head.appendChild(s);

    (async () => {
      const supabase = createClient();
      const { data: { user: u } } = await supabase.auth.getUser();
      setUser(u);
      if (u) {
        const { data: p } = await supabase.from("profiles").select("referral_code").eq("id", u.id).single();
        setMyCode(p?.referral_code || "");
      }
      const { data } = await supabase.from("ebooks").select("*, profiles(full_name)").eq("status", "approved").order("created_at", { ascending: false });
      setBooks(data || []);
      setLoaded(true);
    })();
  }, []);

  async function buy(b: any) {
    setMsg("");
    if (!user) return setMsg("Log in first to buy e-books. 🔓");
    const PaystackPop = (window as any).PaystackPop;
    if (!PaystackPop) return setMsg("Payment system still loading — try again in a few seconds.");
    const supabase = createClient();
    const aff = localStorage.getItem("affCode");
    const handler = PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "",
      email: user.email,
      amount: Number(b.price) * 100,
      currency: "NGN",
      callback: async (ref: any) => {        await supabase.from("ebook_purchases").insert({ user_id: user.id, ebook_id: b.id, amount: b.price, status: "paid", affiliate_code: aff && aff !== myCode ? aff : null });
        if (b.author_id && b.author_id !== user.id) await supabase.rpc("credit_wallet", { uid: b.author_id, amt: Math.round(Number(b.price) * 0.7) });
        if (aff && aff !== myCode) {
          const { data: promoter } = await supabase.from("profiles").select("id").eq("referral_code", aff).single();
          if (promoter) await supabase.rpc("credit_wallet", { uid: promoter.id, amt: Math.round(Number(b.price) * 0.1) });
        }
        setMsg(`✅ Purchase complete! Your e-book is in Profile → My E-books. The author & promoter just earned commissions! 💸`);
      },
      onClose: () => {},
    });
    handler.openIframe();
  }

  function promote(b: any) {
    if (!myCode) return setMsg("Log in to get your commission link.");
    const link = `${window.location.origin}/ebooks?aff=${myCode}`;
    navigator.clipboard.writeText(`📚 "${b.title}" — I recommend this e-book! Get it here: ${link}`);
    setMsg("📋 Commission link copied! Share it — every sale through it = 10% in YOUR wallet + 20 pts.");
  }

  if (!loaded) return <p className="text-center text-gray-500 py-10">Loading…</p>;

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">📚 E-book Store</h1>
      <p className="text-gray-600 text-sm mb-4">Learn from experts · authors earn 70% · promoters earn 10%!</p>

      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-2xl mb-6 text-center">
        <p className="font-bold mb-1">✍️ Wrote something useful?</p>
        <p className="text-xs text-purple-100 mb-2">Publish your own e-book & earn 70% of every sale — forever.</p>
        <Link href="/ebooks/submit" className="inline-block bg-white text-purple-700 px-5 py-2 rounded-xl font-bold text-sm">📤 Submit Your E-book</Link>
      </div>

      {msg && <p className="text-sm text-center text-green-700 mb-4">{msg}</p>}

      <div className="grid grid-cols-2 gap-3">
        {books.map((b) => (
          <div key={b.id} className="glass-card p-3 rounded-2xl flex flex-col">
            {b.cover_url ? (
              <img src={b.cover_url} alt={b.title} className="w-full h-36 object-cover rounded-xl mb-2" />
            ) : (
              <div className="w-full h-36 bg-forest-100 rounded-xl flex items-center justify-center text-3xl mb-2">📚</div>
            )}
            <p className="font-semibold text-xs line-clamp-2 flex-1">{b.title}</p>
            <p className="text-[10px] text-gray-500 mb-1">by {b.profiles?.full_name || "Admin"}</p>
            <p className="text-sm font-bold text-green-700 mb-2">{currencySymbol(b.currency)}{Number(b.price).toLocaleString()}</p>
            <button onClick={() => buy(b)} className="w-full bg-green-600 text-white py-2 rounded-xl text-xs font-bold mb-1">🛒 Buy</button>
            <button onClick={() => promote(b)} className="w-full bg-amber-500 text-white py-2 rounded-xl text-xs font-bold">📤 Promote (10%)</button>
          </div>
        ))}      </div>
      {books.length === 0 && <p className="text-center text-gray-500 py-10">No e-books yet — check back soon!</p>}
    </div>
  );
}