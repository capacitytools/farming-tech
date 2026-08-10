"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { currencySymbol } from "@/lib/currency";

export default function EbooksPage() {
  const [ebooks, setEbooks] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState("");

  async function load() {
    const supabase = createClient();
    const { data: books } = await supabase.from("ebooks").select("*").eq("is_active", true).order("created_at", { ascending: false });
    setEbooks(books || []);
    const { data: { user: u } } = await supabase.auth.getUser();
    setUser(u);
    if (u) {
      const { data: pur } = await supabase.from("ebook_purchases").select("*").eq("user_id", u.id).eq("status", "paid");
      setPurchases(pur || []);
    }
  }

  useEffect(() => {
    load();
    (async () => {
      const ref = new URLSearchParams(window.location.search).get("reference");
      if (ref) {
        const r = await fetch(`/api/payments/verify?reference=${ref}`);
        const j = await r.json();
        if (j?.ok) setMessage("Payment successful! Your download is ready. 🎉");
        await load();
      }
    })();
  }, []);

  function owned(ebookId: string) {
    return purchases.find((p) => p.ebook_id === ebookId);
  }

  async function buy(ebook: any) {
    setMessage("");
    if (!user) {
      setMessage("Please log in first to buy.");
      return;
    }
    setBusy(ebook.id);
    try {      const res = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ebook_id: ebook.id }),
      });
      const j = await res.json();
      if (!res.ok || !j?.url) {
        setMessage("❌ " + (j?.error || "Could not start payment"));
        setBusy("");
        return;
      }
      window.location.href = j.url;
    } catch {
      setMessage("❌ Network error — try again.");
      setBusy("");
    }
  }

  return (
    <div className="p-4 pb-24 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">📚 E-Book Store</h1>
      <p className="text-gray-600 text-sm mb-6">Buy once, download forever. Secure payment via Paystack.</p>
      {message && <p className="text-sm text-center text-green-700 mb-4">{message}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {ebooks.map((book) => {
          const own = owned(book.id);
          return (
            <div key={book.id} className="glass-card p-5 rounded-2xl shadow-lg flex flex-col items-center text-center">
              {book.cover_url ? (
                <img src={book.cover_url} alt={book.title} className="w-full h-40 object-cover rounded-xl mb-4" />
              ) : (
                <div className="text-6xl mb-4">📗</div>
              )}
              <h2 className="font-bold text-lg mb-2">{book.title}</h2>
              <p className="text-sm text-gray-600 mb-3">{book.description}</p>
              <p className="text-green-700 font-bold text-xl mb-4">
                {currencySymbol(book.currency)}{Number(book.price).toLocaleString()}
              </p>
              {own ? (
                <a href={book.file_url || "#"} target="_blank" rel="noopener noreferrer" className="w-full bg-forest-600 text-white py-2 rounded-xl font-semibold">
                  ⬇️ Download
                </a>
              ) : (
                <button onClick={() => buy(book)} disabled={busy === book.id} className="w-full bg-green-600 text-white py-2 rounded-xl font-semibold disabled:opacity-50">
                  {busy === book.id ? "Opening payment..." : "Buy Now"}
                </button>
              )}
            </div>
          );        })}
      </div>
      {ebooks.length === 0 && <p className="text-gray-500 text-center py-10">No e-books yet — check back soon!</p>}
    </div>
  );
}