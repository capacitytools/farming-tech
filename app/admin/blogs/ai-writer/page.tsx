"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = ["Animal", "Plants", "Business", "Tech", "Poultry", "Rabbits", "Goats", "Pigs", "Fish", "Crops"];

export default function AiWriterPage() {
  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState("");
  const [keywords, setKeywords] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [post, setPost] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  async function write() {
    setBusy(true);
    setError("");
    setPost(null);
    try {
      const res = await fetch("/api/ai/write-blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, category, keywords }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) setError(json.error || "Writer failed");
      else setPost(json);
    } catch (e: any) {
      setError(e?.message || "network error");
    }
    setBusy(false);
  }

  function sendToEditor() {
    localStorage.setItem("blog_draft_new", JSON.stringify({
      title: post.title,
      excerpt: post.seoDescription,
      content: post.html,
      category,
      tags: post.tags,
      coverImage: "",
      seoTitle: post.seoTitle,
      seoDescription: post.seoDescription,
    }));
    router.push("/admin/blogs/new");
  }
  async function copyForDocs() {
    try {
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
    ctx.beginPath(); ctx.arc(860, 180, 260, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(110, 1330, 300, 0, Math.PI * 2); ctx.fill();
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
    a.click();
  }

  function wrapText(ctx: any, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {    const words = text.split(" ");
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
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">🤖 Professional AI Writer</h1>
      <p className="text-gray-600 text-sm mb-6">Writes like a 15-year field expert · SEO + AdWords built-in · 2 live external links · 2 internal links · Google-Docs ready.</p>

      <div className="glass-card p-5 rounded-2xl space-y-4 mb-6">
        <textarea className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" rows={2} placeholder="Topic, e.g. 'How to fatten goats for December market at minimum cost'" value={topic} onChange={(e) => setTopic(e.target.value)} />
        <select className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Auto-choose category</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" placeholder="Focus keywords (optional) e.g. goat fattening, December market" value={keywords} onChange={(e) => setKeywords(e.target.value)} />
        <button onClick={write} disabled={busy} className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold disabled:opacity-50">
          {busy ? "✍️ Writing like a 15-year veteran..." : "🤖 Write My Blog Post"}
        </button>
        {error && <p className="text-sm text-center text-red-600">{error}</p>}
      </div>

      {post && (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            <button onClick={sendToEditor} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold">✍️ Send to Editor & Post</button>
            <button onClick={copyForDocs} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold">{copied ? "✅ Copied! Opening Docs..." : "📋 Copy for Google Docs"}</button>
            <button onClick={downloadPin} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold">📌 Pinterest Image</button>
          </div>
          <div className="glass-card p-5 rounded-2xl mb-4 text-xs space-y-1">
            <p><b>SEO Title:</b> {post.seoTitle}</p>
            <p><b>Meta:</b> {post.seoDescription}</p>
            <p><b>Tags:</b> {post.tags}</p>
          </div>
          <div className="glass-card p-5 rounded-2xl prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: post.html }} />
        </>
      )}
    </div>
  );
}