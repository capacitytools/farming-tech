"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CURRENCIES } from "@/lib/currency";

export default function AdminEbooks() {
  const [ebooks, setEbooks] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [fileUrl, setFileUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase.from("ebooks").select("*").order("created_at", { ascending: false });
    setEbooks(data || []);
  }
  useEffect(() => {
    load();
  }, []);

  async function uploadFile(e: any, type: "pdf" | "cover") {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage("");
    const supabase = createClient();
    const ext = file.name.split(".").pop() || (type === "pdf" ? "pdf" : "jpg");
    const path = `${type === "pdf" ? "ebook-pdf" : "ebook-cover"}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("blog-images").upload(path, file);
    if (!error) {
      const url = supabase.storage.from("blog-images").getPublicUrl(path).data.publicUrl;
      if (type === "pdf") setFileUrl(url);
      else setCoverUrl(url);
      setMessage(`${type === "pdf" ? "PDF" : "Cover"} uploaded ✅`);
    } else {
      setMessage("Upload failed: " + error.message);
    }
    setUploading(false);
  }

  function startEdit(book: any) {
    setEditing(book);
    setTitle(book.title);    setDescription(book.description || "");
    setPrice(String(book.price));
    setCurrency(book.currency);
    setFileUrl(book.file_url || "");
    setCoverUrl(book.cover_url || "");
  }

  function cancelEdit() {
    setEditing(null);
    setTitle(""); setDescription(""); setPrice(""); setFileUrl(""); setCoverUrl("");
  }

  async function saveEbook(e: any) {
    e.preventDefault();
    setMessage("");
    const supabase = createClient();
    const data = {
      title,
      description,
      price: Number(price),
      currency,
      file_url: fileUrl || null,
      cover_url: coverUrl || null,
    };
    let error;
    if (editing) {
      ({ error } = await supabase.from("ebooks").update(data).eq("id", editing.id));
    } else {
      ({ error } = await supabase.from("ebooks").insert(data));
    }
    if (error) setMessage("Error: " + error.message);
    else {
      setMessage(editing ? "E-book updated ✅" : "E-book added ✅");
      cancelEdit();
      load();
    }
  }

  async function deleteEbook(id: string) {
    if (!confirm("Delete this e-book?")) return;
    const supabase = createClient();
    await supabase.from("ebooks").delete().eq("id", id);
    load();
  }

  function copyLink(id: string) {
    const url = `https://farming-tech.vercel.app/ebooks?id=${id}`;
    navigator.clipboard.writeText(url);
    setMessage("Link copied! ✅");
    setTimeout(() => setMessage(""), 2000);  }

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">📚 Manage E-books</h1>
      <form onSubmit={saveEbook} className="glass-card p-5 rounded-2xl space-y-4 mb-8">
        <h2 className="font-bold">{editing ? "Edit E-book" : "Add New E-book"}</h2>
        <input className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" placeholder="Book title *" required value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" placeholder="Short description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <input className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" placeholder="Price *" type="number" required value={price} onChange={(e) => setPrice(e.target.value)} />
          <select className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-semibold text-gray-600">Cover image</label>
          <input type="file" accept="image/*" onChange={(e) => uploadFile(e, "cover")} className="w-full text-sm mt-1" />
          {coverUrl && <img src={coverUrl} alt="cover" className="mt-2 h-24 w-full object-cover rounded-xl" />}
        </div>
        <div>
          <label className="text-sm font-semibold text-gray-600">PDF file</label>
          <input type="file" accept=".pdf" onChange={(e) => uploadFile(e, "pdf")} className="w-full text-sm mt-1" />
          {fileUrl && <p className="text-xs text-green-600 mt-1">PDF uploaded ✅</p>}
        </div>
        {message && <p className="text-sm text-center text-green-700">{message}</p>}
        <div className="flex gap-2">
          <button className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50" disabled={uploading}>
            {editing ? "Update" : "Add E-book"}
          </button>
          {editing && (
            <button type="button" onClick={cancelEdit} className="flex-1 bg-gray-400 text-white py-3 rounded-xl font-semibold">
              Cancel
            </button>
          )}
        </div>
      </form>

      <h2 className="font-bold mb-3">Your e-books ({ebooks.length})</h2>
      <div className="space-y-3">
        {ebooks.map((b) => (
          <div key={b.id} className="glass-card p-4 rounded-2xl">
            <div className="flex gap-3">
              {b.cover_url && <img src={b.cover_url} alt={b.title} className="w-20 h-24 object-cover rounded-lg" />}
              <div className="flex-1">
                <h3 className="font-bold">{b.title}</h3>
                <p className="text-xs text-gray-600 mt-1">{b.description}</p>
                <p className="text-xs text-gray-500 mt-1">                  {Number(b.price).toLocaleString()} {b.currency} · {b.file_url ? "📄 PDF" : "⚠️ No PDF"}
                </p>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => startEdit(b)} className="text-blue-600 text-sm font-semibold">Edit</button>
                  <button onClick={() => deleteEbook(b.id)} className="text-red-600 text-sm font-semibold">Delete</button>
                  <button onClick={() => copyLink(b.id)} className="text-green-600 text-sm font-semibold">Copy Link</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}