"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const CATEGORIES = ["Animal", "Plants", "Business", "Tech", "Poultry", "Rabbits", "Goats", "Pigs", "Fish", "Crops"];

export default function AiWriterPage() {
  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState("");
  const [keywords, setKeywords] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [post, setPost] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState<any[]>([]);
  const router = useRouter();

  async function loadSaved() {
    const supabase = createClient();
    const { data } = await supabase.from("ai_drafts").select("*").order("created_at", { ascending: false }).limit(20);
    setSaved(data || []);
  }

  useEffect(() => {
    loadSaved();
  }, []);

  async function write() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/ai/write-blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, category, keywords }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error || "Writer failed");
      } else {
        const full = { ...json, category };
        setPost(full);
        const supabase = createClient();
        await supabase.from("ai_drafts").insert({
          topic,
          title: json.title,
          html: json.html,
          seo_title: json.seoTitle,          seo_description: json.seoDescription,
          tags: json.tags,
          category,
        });
        loadSaved();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (e: any) {
      setError(e?.message || "network error");
    }
    setBusy(false);
  }

  function openSaved(row: any) {
    setPost({
      title: row.title,
      html: row.html,
      seoTitle: row.seo_title,
      seoDescription: row.seo_description,
      tags: row.tags,
      category: row.category || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteSaved(id: string) {
    if (!confirm("Delete this saved article?")) return;
    const supabase = createClient();
    await supabase.from("ai_drafts").delete().eq("id", id);
    loadSaved();
  }

  function sendToEditor() {
    localStorage.setItem(
      "blog_draft_new",
      JSON.stringify({
        title: post.title,
        excerpt: post.seoDescription,
        content: post.html,
        category: post.category || category,
        tags: post.tags,
        coverImage: "",
        seoTitle: post.seoTitle,
        seoDescription: post.seoDescription,
      })
    );
    router.push("/admin/blogs/new");
  }

  async function copyForDocs() {    try {
      const plain = post.html.replace(/<[^>]+>/g, " ");
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([post.html], { type: "text/html" }),
          "text/plain": new Blob([plain], { type: "text/plain" }),
        }),
      ]);
      setCopied(true);
      window.open("https://docs.google.com/document/create");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setError("Copy failed — use Send to Editor instead.");
    }
  }

  function downloadPin() {
    const canvas = document.createElement("canvas");
    canvas.width = 1000;
    canvas.height = 1500;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const g = ctx.createLinearGradient(0, 0, 0, 1500);
    g.addColorStop(0, "#166534");
    g.addColorStop(1, "#052e16");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1000, 1500);
    ctx.fillStyle = "rgba(255,255,255,0.07)";
    ctx.beginPath();
    ctx.arc(860, 180, 260, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(110, 1330, 300, 0, Math.PI * 2);
    ctx.fill();
    ctx.textAlign = "center";
    ctx.font = "150px serif";
    ctx.fillText("🌾", 500, 280);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 68px sans-serif";
    wrapText(ctx, (post.title || topic).toUpperCase(), 500, 480, 840, 92);
    ctx.fillStyle = "#facc15";
    ctx.font = "bold 46px sans-serif";
    ctx.fillText("FARMING TECH & BUSINESS", 500, 1320);
    ctx.fillStyle = "#bbf7d0";
    ctx.font = "38px sans-serif";
    ctx.fillText("farmtechbusiness.com", 500, 1390);
    const a = document.createElement("a");
    a.download = "pinterest-pin.png";
    a.href = canvas.toDataURL("image/png");
    a.click();  }

  function wrapText(ctx: any, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
    const words = text.split(" ");
    let line = "";
    for (const w of words) {
      const test = line + w + " ";
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, x, y);
        line = w + " ";
        y += lineHeight;
      } else line = test;
    }
    ctx.fillText(line, x, y);
  }

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto overflow-x-hidden">
      <h1 className="text-2xl font-bold mb-2">🤖 Professional AI Writer</h1>
      <p className="text-gray-600 text-sm mb-6">Writes like a 15-year field expert · SEO built-in · 2 live external links · 2 internal links · auto-saved forever.</p>

      <div className="glass-card p-5 rounded-2xl space-y-4 mb-6">
        <textarea className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" rows={2} placeholder="Topic, e.g. 'How to fatten goats for December market at minimum cost'" value={topic} onChange={(e) => setTopic(e.target.value)} />
        <select className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Auto-choose category</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" placeholder="Focus keywords (optional)" value={keywords} onChange={(e) => setKeywords(e.target.value)} />
        <button onClick={write} disabled={busy} className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold disabled:opacity-50">
          {busy ? "✍️ Writing like a 15-year veteran..." : "🤖 Write My Blog Post"}
        </button>
        {error && <p className="text-sm text-center text-red-600">{error}</p>}
      </div>

      {saved.length > 0 && (
        <div className="glass-card p-4 rounded-2xl mb-6">
          <h2 className="font-bold mb-3">📚 Saved AI Articles ({saved.length})</h2>
          <div className="space-y-2">
            {saved.map((s) => (
              <div key={s.id} className="bg-white/70 p-3 rounded-xl flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{s.title}</p>
                  <p className="text-[10px] text-gray-400">{new Date(s.created_at).toLocaleDateString()} · {s.category || "auto"}</p>
                </div>
                <button onClick={() => openSaved(s)} className="text-xs font-bold bg-green-100 text-green-700 px-3 py-2 rounded-full">Open</button>
                <button onClick={() => deleteSaved(s.id)} className="text-xs font-bold bg-red-100 text-red-700 px-3 py-2 rounded-full">🗑️</button>
              </div>
            ))}          </div>
        </div>
      )}

      {post && (
        <>
          <div className="sticky bottom-20 z-30 glass-card p-3 rounded-2xl mb-4 shadow-xl grid grid-cols-1 gap-2">
            <button onClick={sendToEditor} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold">✍️ Send to Editor & Post</button>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={copyForDocs} className="bg-blue-600 text-white py-3 rounded-xl font-bold">{copied ? "✅ Copied!" : "📋 Google Docs"}</button>
              <button onClick={downloadPin} className="bg-red-600 text-white py-3 rounded-xl font-bold">📌 Pinterest Image</button>
            </div>
          </div>

          <div className="glass-card p-4 rounded-2xl mb-4 text-xs space-y-1">
            <p><b>SEO Title:</b> {post.seoTitle}</p>
            <p><b>Meta:</b> {post.seoDescription}</p>
            <p><b>Tags:</b> {post.tags}</p>
          </div>

          <div className="glass-card p-5 rounded-2xl overflow-x-auto max-w-full">
            <div className="prose prose-sm max-w-none break-words" dangerouslySetInnerHTML={{ __html: post.html }} />
          </div>
        </>
      )}
    </div>
  );
}