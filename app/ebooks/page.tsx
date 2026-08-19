"use client";

import { useEffect, useState } from "react";
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

export default function EbooksPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [books, setBooks] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState({ title: "", desc: "", price: "", mode: "file", link: "" });
  const [cover, setCover] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [loaded, setLoaded] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data: { user: u } } = await supabase.auth.getUser();
    setUser(u);
    if (u) {
      const [{ data: p }, { data: pu }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", u.id).single(),
        supabase.from("ebook_purchases").select("*").eq("user_id", u.id),
      ]);
      setProfile(p);
      setPurchases(pu || []);
    }
    const { data: b } = await supabase.from("ebooks").select("*").order("created_at", { ascending: false });
    let withAuthors: any[] = b || [];
    if (b && b.length) {
      const ids = Array.from(new Set(b.map((x: any) => x.author_id)));      const { data: pr } = await supabase.from("profiles").select("id, full_name, avatar_url, referral_code").in("id", ids as any[]);
      const map: any = {};
      (pr || []).forEach((p: any) => { map[p.id] = p; });
      withAuthors = b.map((x: any) => ({ ...x, profiles: map[x.author_id] || null }));
    }
    setBooks(withAuthors);
    setLoaded(true);
  }

  useEffect(() => { load(); }, []);

  async function uploadCover(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `ebook-cover-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("blog-images").upload(path, file);
    if (!error) setCover(supabase.storage.from("blog-images").getPublicUrl(path).data.publicUrl);
  }

  async function uploadFile(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "pdf";
    const path = `ebook-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("blog-images").upload(path, file);
    if (!error) setFileUrl(supabase.storage.from("blog-images").getPublicUrl(path).data.publicUrl);
  }

  async function publish(e: any) {
    e.preventDefault();
    if (!user) return alert("Log in to publish.");
    if (!form.title.trim() || !form.price) return alert("Add a title and price.");
    if (form.mode === "file" && !fileUrl) return alert("Upload your PDF file.");
    if (form.mode === "link" && !form.link.trim()) return alert("Paste your Google Drive link.");
    setBusy(true);
    const supabase = createClient();
    await supabase.from("ebooks").insert({
      author_id: user.id,
      title: form.title.trim(),
      description: form.desc.trim(),
      price: Number(form.price),
      currency: "NGN",
      cover_url: cover || null,
      file_url: form.mode === "file" ? fileUrl : null,
      access_link: form.mode === "link" ? form.link.trim() : null,
    });
    setMsg("✅ Ebook published! You keep 70% of every sale.");    setForm({ title: "", desc: "", price: "", mode: "file", link: "" });
    setCover(""); setFileUrl("");
    setShowForm(false);
    setTimeout(() => setMsg(""), 2500);
    await load();
    setBusy(false);
  }

  async function buy(book: any) {
    if (!user) return alert("Log in to buy ebooks.");
    try {
      await loadScript("https://js.paystack.co/v1/inline.js");
      const pop = (window as any).PaystackPop;
      if (!pop || !pop.setup) throw new Error("PaystackPop not available on this browser");
      const handler = pop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: user.email,
        amount: book.price * 100,
        ref: "ebook-" + Date.now(),
        callback: function () {
          (async () => {
            const supabase = createClient();
            await supabase.from("ebook_purchases").insert({
              ebook_id: book.id,
              user_id: user.id,
              status: "paid",
            });
            alert("🎉 Payment successful! Your ebook is unlocked below.");
            setSelected(null);
            load();
          })();
        },
      });
      handler.openIframe();
    } catch (err: any) {
      alert("Payment error: " + (err && err.message ? err.message : "unknown error — screenshot this and send to admin"));
    }
  }

  function owned(book: any) {
    return purchases.some((p) => p.ebook_id === book.id && p.status === "paid") || user?.id === book.author_id || profile?.role === "admin";
  }

  function openBook(book: any) {
    if (book.access_link) window.open(book.access_link, "_blank");
    else if (book.file_url) window.open(book.file_url, "_blank");
    else alert("The author has not attached content yet.");
  }

  function affiliateLink() {    const code = profile?.referral_code || "";
    const url = `${window.location.origin}/ebooks?ref=${code}`;
    navigator.clipboard.writeText(url);
    setMsg("✅ Affiliate link copied — share it and earn 10% of every sale!");
    setTimeout(() => setMsg(""), 2500);
  }

  if (!loaded) return <p className="text-center text-gray-500 py-10">Loading…</p>;

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-extrabold">📚 E-book Store</h1>
        <button onClick={() => setShowForm(!showForm)} className="text-xs font-bold bg-forest-600 text-white px-3 py-2 rounded-full">➕ Publish Ebook</button>
      </div>
      <p className="text-xs text-gray-500 mb-4">Tap any ebook to read its full details before buying. Authors keep 70%, affiliates earn 10%.</p>
      {msg && <p className="text-xs font-bold text-green-700 mb-3">{msg}</p>}

      {showForm && (
        <form onSubmit={publish} className="glass-card p-4 rounded-2xl space-y-2 mb-6 border-2 border-forest-300">
          <p className="text-sm font-bold text-forest-700">📖 Publish your ebook</p>
          <input className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" placeholder="Title (e.g. Rabbit Farming Masterclass)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <textarea className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" rows={4} placeholder="Full details — what will the reader learn? List everything inside (this is what buyers see before paying)..." value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} />
          <input className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" type="number" placeholder="Price in Naira (e.g. 1500)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <label className="block text-xs font-semibold text-green-700 cursor-pointer">🖼️ Cover image (optional)
            <input type="file" accept="image/*" className="hidden" onChange={uploadCover} />
          </label>
          {cover && <img src={cover} alt="" className="h-16 w-12 object-cover rounded-lg" />}

          <div className="flex gap-2">
            <button type="button" onClick={() => setForm({ ...form, mode: "file" })} className={`flex-1 py-2 rounded-xl text-xs font-bold ${form.mode === "file" ? "bg-forest-600 text-white" : "bg-gray-100 text-gray-600"}`}>📄 Upload PDF</button>
            <button type="button" onClick={() => setForm({ ...form, mode: "link" })} className={`flex-1 py-2 rounded-xl text-xs font-bold ${form.mode === "link" ? "bg-forest-600 text-white" : "bg-gray-100 text-gray-600"}`}>🔗 Google Drive Link</button>
          </div>

          {form.mode === "file" ? (
            <label className="block text-xs font-semibold text-green-700 cursor-pointer">📄 Upload your PDF
              <input type="file" accept=".pdf,.epub" className="hidden" onChange={uploadFile} />
            </label>
          ) : (
            <div>
              <input className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" placeholder="Paste Google Drive link (set sharing to: Anyone with the link)" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} />
              <p className="text-[9px] text-gray-400 mt-1">Only buyers who pay will ever see this link inside the app.</p>
            </div>
          )}
          {form.mode === "file" && fileUrl && <p className="text-[10px] text-green-700 font-bold">✅ File attached</p>}

          <button className="w-full bg-green-600 text-white py-2.5 rounded-xl text-sm font-bold disabled:opacity-50" disabled={busy}>🚀 Publish (you keep 70%)</button>
        </form>
      )}
      <div className="grid grid-cols-2 gap-3">
        {books.map((b) => (
          <div key={b.id} onClick={() => setSelected(b)} className="glass-card p-3 rounded-2xl flex flex-col cursor-pointer active:scale-[0.98]">
            {b.cover_url ? (
              <img src={b.cover_url} alt={b.title} className="w-full h-36 object-cover rounded-xl mb-2" />
            ) : (
              <div className="w-full h-36 bg-forest-100 rounded-xl flex items-center justify-center text-3xl mb-2">📚</div>
            )}
            <p className="font-semibold text-xs line-clamp-2">{b.title}</p>
            <p className="text-[10px] text-gray-500 mt-1">by {b.profiles?.full_name || "Farmer"}</p>
            <p className="text-sm font-bold text-green-700 mt-1">{currencySymbol(b.currency || "NGN")}{Number(b.price).toLocaleString()}</p>
            <p className="text-[9px] text-gray-400 mt-1">👁️ Tap for full details</p>
          </div>
        ))}
      </div>
      {books.length === 0 && <p className="text-sm text-gray-500 text-center py-10">No ebooks yet. Publish the first one and keep 70% of every sale!</p>}

      {/* DETAIL VIEW — everything a buyer needs before paying */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end" onClick={() => setSelected(null)}>
          <div className="bg-white w-full max-w-md mx-auto rounded-t-3xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              {selected.cover_url ? (
                <img src={selected.cover_url} alt={selected.title} className="w-full h-56 object-cover" />
              ) : (
                <div className="w-full h-40 bg-forest-100 flex items-center justify-center text-5xl">📚</div>
              )}
              <button onClick={() => setSelected(null)} className="absolute top-3 right-3 w-9 h-9 bg-black/60 text-white rounded-full font-bold">✕</button>
            </div>
            <div className="p-5">
              <h2 className="text-lg font-extrabold text-forest-900">{selected.title}</h2>
              <p className="text-xs text-gray-500 mt-1">by {selected.profiles?.full_name || "Farmer"} {selected.profiles?.verified && "✅"}</p>
              <p className="text-xl font-extrabold text-green-700 mt-2">{currencySymbol(selected.currency || "NGN")}{Number(selected.price).toLocaleString()}</p>

              <div className="mt-4">
                <p className="text-xs font-extrabold text-gray-500 uppercase tracking-wide mb-1">📖 What's inside</p>
                <p className="text-sm text-gray-800 whitespace-pre-line">{selected.description || "The author has not added details yet."}</p>
              </div>

              <div className="mt-5 space-y-2">
                {owned(selected) ? (
                  <button onClick={() => openBook(selected)} className="w-full bg-forest-600 text-white py-3 rounded-xl font-extrabold">📖 Read / Download Now</button>
                ) : (
                  <button onClick={() => buy(selected)} className="w-full bg-green-600 text-white py-3 rounded-xl font-extrabold">💳 Buy Now — instant access</button>
                )}
                {user && (
                  <button onClick={affiliateLink} className="w-full bg-amber-100 text-amber-700 py-2 rounded-xl text-xs font-bold">🔗 Promote & earn 10% of every sale</button>
                )}
                <p className="text-[9px] text-gray-400 text-center">Secured by Paystack · access unlocked immediately after payment</p>
              </div>            </div>
          </div>
        </div>
      )}
    </div>
  );
}