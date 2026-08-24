"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { currencySymbol } from "@/lib/currency";

const PAYSTACK_PUBLIC_KEY = "pk_live_00573ba36a45a7fa73d358fee60ae30f5ce1dd49";

function loadScript(src: string) {
  return new Promise((res, rej) => {
    if ((window as any).PaystackPop) return res(true);
    const s = document.createElement("script");
    const t = setTimeout(() => rej(new Error("Paystack script timed out")), 10000);
    s.src = src;
    s.onload = () => { clearTimeout(t); res(true); };
    s.onerror = () => { clearTimeout(t); rej(new Error("Paystack script blocked or failed to load")); };
    document.body.appendChild(s);
  });
}

export default function EbookDetailClient({ id }: { id: string }) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [book, setBook] = useState<any>(null);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [msg, setMsg] = useState("");
  const [loaded, setLoaded] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data: { user: u } } = await supabase.auth.getUser();
    setUser(u);

    const { data: b } = await supabase.from("ebooks").select("*").eq("id", id).single();
    if (!b) { setLoaded(true); return; }
    const { data: pr } = await supabase.from("profiles").select("full_name, avatar_url, verified, referral_code").eq("id", b.author_id).single();
    const withProf = { ...b, profiles: pr || null };
    setBook(withProf);

    if (u) {
      const [{ data: p }, { data: pu }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", u.id).single(),
        supabase.from("ebook_purchases").select("*").eq("user_id", u.id),
      ]);
      setProfile(p);
      setPurchases(pu || []);
    }
    const refParam = new URLSearchParams(window.location.search).get("ref");
    if (refParam && refParam !== withProf.profiles?.referral_code) {      localStorage.setItem("refCode", refParam);
    }
    setLoaded(true);
  }

  useEffect(() => { load(); }, [id]);

  function myLink() {
    const base = `${window.location.origin}/ebooks/${id}`;
    const code = profile?.referral_code || "";
    return code ? `${base}?ref=${code}` : base;
  }

  function share(net: string) {
    const url = myLink();
    const priceText = Number(book.price) > 0 ? `only ${currencySymbol(book.currency || "NGN")}${Number(book.price).toLocaleString()}` : "100% FREE";
    const text = `📚 ${book.title} by ${book.profiles?.full_name || "a farmer"} — ${priceText} on Farming Tech & Business. Get it now 👇`;
    const en = encodeURIComponent;
    const links: any = {
      wa: `https://wa.me/?text=${en(text + "\n" + url)}`,
      fb: `https://www.facebook.com/sharer/sharer.php?u=${en(url)}`,
      x: `https://twitter.com/intent/tweet?text=${en(text)}&url=${en(url)}`,
      pin: `https://pinterest.com/pin/create/button/?url=${en(url)}&media=${en(book.cover_url || "")}&description=${en(text)}`,
      tg: `https://t.me/share/url?url=${en(url)}&text=${en(text)}`,
    };
    if (net === "copy") {
      navigator.clipboard.writeText(url);
      setMsg("✅ Your personal link copied — share it anywhere and earn on every sale & signup!");
      setTimeout(() => setMsg(""), 2500);
    } else if (net === "status") {
      navigator.clipboard.writeText(text + "\n" + url);
      window.open("https://wa.me/", "_blank");
    } else {
      window.open(links[net], "_blank");
    }
  }

  async function buy() {
    if (!user) return alert("Log in to get ebooks.");
    const supabase = createClient();

    // Collect WhatsApp once for the customer sheet
    if (!profile?.whatsapp) {
      const wa = prompt("Add your WhatsApp number so we can deliver your purchases (e.g. 08012345678):");
      if (wa && wa.replace(/\D/g, "").length >= 10) {
        await supabase.from("profiles").update({ whatsapp: wa.trim() }).eq("id", user.id);
        setProfile({ ...profile, whatsapp: wa.trim() });
      }
    }
    // FREE BOOK — skip Paystack, unlock instantly
    if (Number(book.price) <= 0) {
      const already = purchases.some((p) => p.ebook_id === book.id);
      if (!already) {
        await supabase.from("ebook_purchases").insert({ ebook_id: book.id, user_id: user.id, status: "paid" });
      }
      setMsg("🎉 Free ebook unlocked!");
      load();
      openBook();
      return;
    }

    try {
      await loadScript("https://js.paystack.co/v1/inline.js");
      const pop = (window as any).PaystackPop;
      if (!pop || !pop.setup) throw new Error("PaystackPop not available on this browser");
      const refParam = new URLSearchParams(window.location.search).get("ref") || localStorage.getItem("refCode") || null;
      const handler = pop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: user.email,
        amount: book.price * 100,
        ref: "ebook-" + Date.now(),
        callback: function () {
          (async () => {
            const supabase2 = createClient();
            await supabase2.from("ebook_purchases").insert({
              ebook_id: book.id,
              user_id: user.id,
              status: "paid",
              affiliate_code: refParam && refParam !== book.profiles?.referral_code ? refParam : null,
            });
            alert("🎉 Payment successful! Your ebook is unlocked.");
            load();
          })();
        },
      });
      handler.openIframe();
    } catch (err: any) {
      alert("Payment error: " + (err && err.message ? err.message : "unknown error"));
    }
  }

  function owned() {
    return purchases.some((p) => p.ebook_id === book.id && p.status === "paid") || user?.id === book.author_id || profile?.role === "admin";
  }

  function openBook() {
    if (book.access_link) window.open(book.access_link, "_blank");
    else if (book.file_url) window.open(book.file_url, "_blank");
    else alert("The author has not attached content yet.");  }

  if (!loaded) return <p className="text-center text-gray-500 py-10">Loading…</p>;
  if (!book) return <p className="text-center text-gray-500 py-10">Ebook not found.</p>;

  const isFree = Number(book.price) <= 0;

  return (
    <div className="pb-24 max-w-2xl mx-auto">
      <div className="relative">
        {book.cover_url ? (
          <img src={book.cover_url} alt={book.title} className="w-full h-64 object-cover" />
        ) : (
          <div className="w-full h-48 bg-forest-100 flex items-center justify-center text-6xl">📚</div>
        )}
        <Link href="/ebooks" className="absolute top-3 left-3 bg-black/60 text-white text-xs font-bold px-3 py-2 rounded-full">← Store</Link>
        {isFree && <span className="absolute top-3 right-3 bg-green-600 text-white text-xs font-extrabold px-3 py-2 rounded-full">🎁 FREE</span>}
      </div>

      <div className="p-4">
        <h1 className="text-xl font-extrabold text-forest-900">{book.title}</h1>
        <p className="text-xs text-gray-500 mt-1">
          by <Link href={`/farmer/${book.author_id}`} className="font-bold text-forest-700 hover:underline">{book.profiles?.full_name || "Farmer"}</Link> {book.profiles?.verified && "✅"}
        </p>
        <p className="text-2xl font-extrabold mt-2">{isFree ? <span className="text-green-700">FREE</span> : <span className="text-green-700">{currencySymbol(book.currency || "NGN")}{Number(book.price).toLocaleString()}</span>}</p>

        <div className="glass-card p-4 rounded-2xl mt-4">
          <p className="text-xs font-extrabold text-gray-500 uppercase tracking-wide mb-1">📖 What's inside</p>
          <p className="text-sm text-gray-800 whitespace-pre-line">{book.description || "The author has not added details yet."}</p>
        </div>

        {msg && <p className="text-xs font-bold text-green-700 mt-3">{msg}</p>}

        <div className="mt-4 space-y-2">
          {owned() ? (
            <button onClick={openBook} className="w-full bg-forest-600 text-white py-3 rounded-xl font-extrabold">📖 Read / Download Now</button>
          ) : (
            <button onClick={buy} className="w-full bg-green-600 text-white py-3 rounded-xl font-extrabold">
              {isFree ? "🎁 Get Free — instant access" : "💳 Buy Now — instant access"}
            </button>
          )}
        </div>

        <div className="glass-card p-3 rounded-2xl mt-4">
          <p className="text-[10px] font-bold text-gray-500 mb-2">📤 Share & earn — your link carries your code: 10% commission on every sale + points when anyone registers with it.</p>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => share("wa")} className="px-3 py-2 rounded-xl text-xs font-bold bg-green-100 text-green-700">📤 WhatsApp</button>
            <button onClick={() => share("status")} className="px-3 py-2 rounded-xl text-xs font-bold bg-green-100 text-green-700">🟢 Status</button>
            <button onClick={() => share("fb")} className="px-3 py-2 rounded-xl text-xs font-bold bg-blue-100 text-blue-700">f Facebook</button>
            <button onClick={() => share("x")} className="px-3 py-2 rounded-xl text-xs font-bold bg-gray-100 text-gray-700">𝕏</button>            <button onClick={() => share("copy")} className="px-3 py-2 rounded-xl text-xs font-bold bg-forest-600 text-white">🔗 Copy My Link</button>
          </div>
        </div>

        <p className="text-[9px] text-gray-400 mt-4 text-center">{isFree ? "Free gift from the author — no payment needed" : "Secured by Paystack · access unlocked immediately after payment"}</p>
      </div>
    </div>
  );
}