"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { uploadToCloudinary } from "@/lib/upload";

function slugify(t: string) {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
function cap(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ArticleEnginePage() {
  const [admin, setAdmin] = useState(false);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [ebooks, setEbooks] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  const [f, setF] = useState({
    topic: "", primaryKey: "", category: "Farming", audience: "Beginner farmers in Nigeria",
    region: "Nigeria", author: "Site Admin", productId: "", secondaryKw: "", questions: "",
    competitors: "", references: "", instructions: "", depth: "standard", videoUrl: "",
  });
  const [intent, setIntent] = useState<{ intent: string; why: string } | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [seo, setSeo] = useState({ title: "", h1: "", meta: "", slug: "" });
  const [content, setContent] = useState("");
  const [cover, setCover] = useState("");
  const [faqText, setFaqText] = useState("");
  const [srcText, setSrcText] = useState("");
  const [indexable, setIndexable] = useState(true);
  const [status, setStatus] = useState("published");
  const [audit, setAudit] = useState<any[]>([]);
  const [score, setScore] = useState(0);
  const [aiKey, setAiKey] = useState("");
  const [aiModel, setAiModel] = useState("gemini-2.0-flash");
  const [aiBusy, setAiBusy] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: p } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      setAdmin(p?.role === "admin");
    }    const [b, e] = await Promise.all([
      supabase.from("blogs").select("*").order("created_at", { ascending: false }),
      supabase.from("ebooks").select("id, title, price").order("created_at", { ascending: false }),
    ]);
    setBlogs(b.data || []);
    setEbooks(e.data || []);
    setAiKey(localStorage.getItem("ftb_gemini_key") || "");
    setLoaded(true);
  }
  useEffect(() => { load(); }, []);

  function flash(t: string) {
    setMsg(t);
    setTimeout(() => setMsg(""), 3000);
  }
  function copy(t: string, label: string) {
    navigator.clipboard.writeText(t);
    flash("✅ " + label + " copied!");
  }

  function classify(t: string) {
    const s = t.toLowerCase();
    if (/(buy|price|cost|for sale|supplier|ebook|training fee|order)/.test(s)) return { intent: "Transactional", why: "The query contains purchase language (buy/price/ebook), so the searcher is ready to act." };
    if (/(best|vs|review|which|compare|top)/.test(s)) return { intent: "Commercial investigation", why: "The searcher is comparing options before deciding." };
    if (/(near me|in nigeria|in lagos|in ibadan|around me)/.test(s)) return { intent: "Local", why: "The query carries location intent." };
    if (/(how to|steps|guide|start|setup|build|make)/.test(s)) return { intent: "Informational (How-To)", why: "The searcher wants a practical procedure they can follow." };
    if (/(what|why|meaning|causes|symptoms|deficiency)/.test(s)) return { intent: "Informational", why: "The searcher needs understanding before action." };
    return { intent: "Mixed intent", why: "The query blends learning and decision-making; the article will educate first, then offer the natural next step." };
  }

  function generate() {
    if (!f.topic.trim()) return alert("Enter the topic first.");
    const pk = (f.primaryKey || f.topic).trim().toLowerCase();
    const it = classify(f.topic + " " + pk);
    setIntent(it);
    const secondary = (f.secondaryKw ? f.secondaryKw.split(",").map((x) => x.trim()) : []).concat([
      pk + " guide", pk + " for beginners", pk + " cost in " + f.region, pk + " problems and solutions",
    ]);
    const longtail = [
      "how to start " + pk + " step by step",
      "is " + pk + " profitable in " + f.region,
      pk + " mistakes to avoid",
    ];
    const questions = (f.questions ? f.questions.split("\n").map((x) => x.trim()).filter(Boolean) : []).concat([
      "What is " + pk + " in simple terms?",
      "How much does it cost to start " + pk + " in " + f.region + "?",
      "What are the common mistakes beginners make in " + pk + "?",
    ]);
    const entities = Array.from(new Set((f.topic + " " + pk + " " + f.category).toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 4)));
    const structure = it.intent.startsWith("Informational (How")      ? ["Quick Answer", "What You Need Before You Start", "Step-by-Step Process", "Costs & Budget Table", "Common Mistakes to Avoid", "FAQs", "Conclusion & Next Steps"]
      : it.intent === "Transactional"
        ? ["Quick Answer", "What You Get", "How It Works", "Pricing & Options", "Who It Is For", "FAQs", "Get Started"]
        : ["Quick Answer", "Key Takeaways", "Core Explanation", "Practical Examples & Tables", "Common Misconceptions", "FAQs", "Conclusion"];
    const cannib = blogs.filter((b) => b.slug !== slugify(f.topic) && ((b.primary_keyword || "").toLowerCase().includes(pk) || (b.title || "").toLowerCase().includes(pk)));
    const internal = blogs.filter((b) => b.category === f.category && b.slug !== slugify(f.topic)).slice(0, 4)
      .map((b) => ({ title: b.title, url: "/blog/" + b.slug, anchor: b.title, where: "One contextual mention in the body + the Related Guides block" }));
    const title = (cap(f.topic) + " — " + f.region + " Guide").slice(0, 60);
    const meta = (f.topic + ": practical steps, real costs and common mistakes for " + f.audience.toLowerCase() + ". Clear, field-tested guidance from Farming Tech & Business.").slice(0, 158);
    const slug = slugify(f.topic);
    setSeo({ title, h1: cap(f.topic), meta, slug });
    setAnalysis({ pk, secondary, longtail, questions, entities, structure, cannib, internal });
    flash("🧠 Analysis complete — now tap WRITE WITH AI.");
  }

  async function writeWithAI() {
    if (!analysis) return alert("Run the analysis first.");
    let key = aiKey || localStorage.getItem("ftb_gemini_key") || "";
    if (!key) {
      const p = prompt("Paste your free Google Gemini API key (get it free at aistudio.google.com/apikey):");
      if (!p) return;
      key = p.trim();
      localStorage.setItem("ftb_gemini_key", key);
      setAiKey(key);
    }
    setAiBusy(true);
    flash("🤖 AI writer is working... this takes 20-60 seconds.");
    const links = (analysis.internal || []).map((i: any) => `- Title: ${i.title} | URL: ${i.url} | Anchor: ${i.anchor}`).join("\n");
    const system = `You are the senior agricultural writer of Farming Tech & Business (Nigeria). Rules: searcher first; open with the answer or problem immediately (never "In today's world...", "delve", "unlock", "embark"); include a ## Quick Answer of 40-100 words; ## Key Takeaways with 3-7 bullets; use ## and ### headings; use markdown tables where they genuinely help; wrap key terms, numbers and warnings in **double asterisks** for bold; short mobile-friendly paragraphs; never fabricate personal experience, dosages or citations — use transparent language like "Farmers commonly...", "Research indicates...", "Estimates vary..."; add a ## FAQs section with 5-7 genuinely useful ### questions; end with ## Conclusion and a ## Continue Learning bullet list; write original, practical, farmer-friendly English.`;
    const prompt = `Write a complete, publication-ready article now.
BRIEF:
Topic: ${f.topic}
Primary keyword: ${analysis.pk}
Secondary keywords: ${analysis.secondary.join(", ")}
Long-tail: ${analysis.longtail.join(", ")}
Questions to answer: ${analysis.questions.join(" / ")}
Semantic entities: ${analysis.entities.slice(0, 15).join(", ")}
Search intent: ${intent?.intent} — ${intent?.why}
Audience: ${f.audience} | Region: ${f.region} | Depth: ${f.depth}
Structure: ${analysis.structure.join(" → ")}
INTERNAL LINKS — embed 2 to 4 of these naturally as markdown links [anchor](url):
${links || "(none available yet)"}
${f.instructions ? "SPECIAL INSTRUCTIONS: " + f.instructions : ""}
OUTPUT FORMAT — use these exact markers on their own lines:
---ARTICLE---
(the full markdown article; start with a 2-3 sentence intro paragraph, no H1)
---FAQ---
Question | Answer
(one per line, 5-7 lines)
---SOURCES---Title | Organization | URL
(only real, verifiable sources; if none, write exactly: none)`;
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${aiModel}:generateContent?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (!text) throw new Error(data?.error?.message || "empty response");
      const art = (text.split("---ARTICLE---")[1] || text).split("---FAQ---")[0].trim();
      const faqPart = text.split("---FAQ---")[1]?.split("---SOURCES---")[0]?.trim() || "";
      const srcPart = text.split("---SOURCES---")[1]?.trim() || "";
      setContent(art);
      setFaqText(faqPart);
      setSrcText(srcPart === "none" ? "" : srcPart);
      auditNow(art, faqPart, srcPart);
      flash("✅ Article written, formatted and auto-filled! Review, then publish.");
    } catch (err: any) {
      alert("AI writer error: " + (err && err.message ? err.message : "check your key and connection"));
    }
    setAiBusy(false);
  }

  function auditNow(c: string, fq: string, src: string) {
    const words = c.trim() ? c.trim().split(/\s+/).length : 0;
    const faqs = fq.split("\n").filter((l) => l.includes("|"));
    const srcs = src.split("\n").filter((l) => l.includes("|"));
    const checks = [
      { k: "Search intent", ok: !!intent },
      { k: "Primary keyword", ok: !!analysis?.pk },
      { k: "SEO title (30-60 chars)", ok: seo.title.length >= 30 && seo.title.length <= 60 },
      { k: "Meta description (70-160)", ok: seo.meta.length >= 70 && seo.meta.length <= 160 },
      { k: "Clean URL slug", ok: /^[a-z0-9-]+$/.test(seo.slug) && seo.slug.length > 3 },
      { k: "Content depth (600+ words)", ok: words >= 600 },
      { k: "Internal links (1+)", ok: (analysis?.internal?.length || 0) >= 1 },
      { k: "Featured image + ALT", ok: !!cover },
      { k: "FAQ (3+ real questions)", ok: faqs.length >= 3 },
      { k: "Ebook CTA connected", ok: !!f.productId },
    ];
    setAudit(checks);
    setScore(checks.filter((x) => x.ok).length * 10);
  }

  function runAudit() {
    auditNow(content, faqText, srcText);  }

  function buildSchema() {
    const faqs = faqText.split("\n").filter((l) => l.includes("|")).map((l) => {
      const [q, a] = l.split("|");
      return { q: q.trim(), a: a.trim() };
    });
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const schema: any = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BlogPosting",
          headline: seo.h1 || seo.title,
          description: seo.meta,
          mainEntityOfPage: origin + "/blog/" + seo.slug,
          ...(cover ? { image: [cover] } : {}),
          author: { "@type": "Person", name: f.author },
          datePublished: new Date().toISOString(),
          publisher: { "@type": "Organization", name: "Farming Tech & Business" },
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: origin + "/" },
            { "@type": "ListItem", position: 2, name: f.category, item: origin + "/blog" },
            { "@type": "ListItem", position: 3, name: seo.h1 || seo.title, item: origin + "/blog/" + seo.slug },
          ],
        },
        ...(faqs.length ? [{
          "@type": "FAQPage",
          mainEntity: faqs.map((x) => ({
            "@type": "Question", name: x.q,
            acceptedAnswer: { "@type": "Answer", text: x.a },
          })),
        }] : []),
      ],
    };
    return JSON.stringify(schema, null, 2);
  }

  function aiPack() {
    const a = analysis;
    return `FARMING TECH ARTICLE ENGINE — WRITER BRIEF
TOPIC: ${f.topic}
PRIMARY KEYWORD: ${a?.pk}
SECONDARY: ${(a?.secondary || []).join(", ")}
LONG-TAIL: ${(a?.longtail || []).join(", ")}
QUESTIONS TO ANSWER:\n- ${(a?.questions || []).join("\n- ")}
SEMANTIC ENTITIES: ${(a?.entities || []).join(", ")}SEARCH INTENT: ${intent?.intent} (${intent?.why})
AUDIENCE: ${f.audience} | REGION: ${f.region} | DEPTH: ${f.depth}
STRUCTURE (H2s):\n- ${a?.structure?.join("\n- ")}
INTERNAL LINKS TO INCLUDE NATURALLY:\n- ${(a?.internal || []).map((i: any) => i.title + " (" + i.url + ")").join("\n- ")}
PRODUCT CTA: ${ebooks.find((e) => e.id === f.productId)?.title || "none"} — contextual "Want to go deeper?" block at the end, never aggressive.
RULES: Quick Answer (40-100 words) first. Key Takeaways. Tables where they help. No AI filler. Never fabricate experience or dosages. Cite sources for disease/medication/feed claims. Mobile-friendly paragraphs. Finish with Conclusion + Related Guides + Ebook CTA. Output clean Markdown.` + (f.instructions ? "\nSPECIAL INSTRUCTIONS: " + f.instructions : "");
  }

  function socialPack() {
    const url = (typeof window !== "undefined" ? window.location.origin : "") + "/blog/" + seo.slug;
    return {
      fb: `🌾 ${seo.h1}\n\nPractical, field-ready guidance for ${f.audience.toLowerCase()} — costs, steps and the mistakes to avoid.\n\nRead free: ${url}\n#FarmingTechAndBusiness #${f.category.replace(/\s/g, "")}`,
      ig: `${seo.h1} 🌾\n\nEverything ${f.audience.toLowerCase()} need to know — in one clear guide.\n\nLink in bio 🔗\n\n#FarmingTechAndBusiness #AgriTech #${f.category.replace(/\s/g, "")} #FarmingNigeria`,
      x: `${seo.h1} — a clear, practical guide for ${f.audience.toLowerCase()}.\n\n${url}\n\n#AgriTech #${f.category.replace(/\s/g, "")}`,
      li: `${seo.h1}\n\nA practical, source-aware guide for ${f.audience.toLowerCase()} in ${f.region}: steps, costs, common mistakes and next steps.\n\n${url}\n\n#Agriculture #AgriTech #Business`,
      pin: `${seo.h1} | Farming Tech & Business — practical guide for ${f.audience.toLowerCase()}. ${url}`,
    };
  }

  async function uploadCoverFn(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setCover(await uploadToCloudinary(file, "blog-covers"));
    } catch (err: any) {
      alert("Upload failed: " + (err && err.message ? err.message : "try again"));
    }
  }

  function loadExisting(id: string) {
    const b = blogs.find((x) => x.id === id);
    if (!b) return;
    setEditId(b.id);
    setF({ ...f, topic: b.title, primaryKey: b.primary_keyword || "", category: b.category || "Farming", author: b.author_name || "Site Admin", videoUrl: b.video_url || "", productId: b.product_cta || "" });
    setSeo({ title: b.meta_title || b.title, h1: b.title, meta: b.meta_description || "", slug: b.slug });
    setContent(b.content || "");
    setCover(b.cover_image_url || "");
    setFaqText(JSON.parse(b.faq_json || "[]").map((x: any) => x.q + " | " + x.a).join("\n"));
    setSrcText(JSON.parse(b.sources_json || "[]").map((x: any) => x.title + " | " + x.org + " | " + x.url).join("\n"));
    setStatus(b.status || "published");
    setIndexable(b.indexable !== false);
    flash("📂 Loaded for editing.");
  }

  async function publish() {
    if (!seo.title.trim() || !content.trim()) return alert("SEO title and content are required.");
    if (score < 60 && !confirm("Editorial score is " + score + "/100 (below 60). Publish anyway?")) return;
    const supabase = createClient();
    const faqs = faqText.split("\n").filter((l) => l.includes("|")).map((l) => { const [q, a] = l.split("|"); return { q: q.trim(), a: a.trim() }; });
    const srcs = srcText.split("\n").filter((l) => l.includes("|")).map((l) => { const [t, o, u] = l.split("|"); return { title: (t || "").trim(), org: (o || "").trim(), url: (u || "").trim() }; });    const payload = {
      title: seo.h1 || seo.title,
      slug: seo.slug,
      content,
      category: f.category,
      cover_image_url: cover || null,
      meta_title: seo.title,
      meta_description: seo.meta,
      excerpt: seo.meta,
      primary_keyword: analysis?.pk || f.primaryKey || "",
      secondary_keywords: (analysis?.secondary || []).join(", "),
      search_intent: intent?.intent || "",
      topic_cluster: f.category,
      author_name: f.author,
      status,
      indexable,
      schema_json: buildSchema(),
      faq_json: JSON.stringify(faqs),
      sources_json: JSON.stringify(srcs),
      video_url: f.videoUrl || null,
      product_cta: f.productId || null,
      updated_at: new Date().toISOString(),
    };
    if (editId) await supabase.from("blogs").update(payload).eq("id", editId);
    else await supabase.from("blogs").insert(payload);
    flash("🚀 " + (editId ? "Updated" : "Published") + " with full SEO pack! Score: " + score + "/100");
    load();
  }

  function inline(text: string) {
    const parts = (text || "").split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g);
    return parts.map((p, i) => {
      if (p.startsWith("**") && p.endsWith("**")) return <strong key={i} className="font-extrabold text-forest-900">{p.slice(2, -2)}</strong>;
      if (p.startsWith("*") && p.endsWith("*") && p.length > 2) return <em key={i}>{p.slice(1, -1)}</em>;
      const m = p.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (m) return <a key={i} href={m[2]} className="text-green-700 font-semibold underline">{m[1]}</a>;
      return <span key={i}>{p}</span>;
    });
  }

  function pvBlocks() {
    const lines = (content || "").split("\n");
    const out: any[] = [];
    let list: string[] = [];
    let table: string[] = [];
    const flushList = () => { if (list.length) { out.push({ t: "ul", items: list }); list = []; } };
    const flushTable = () => { if (table.length) { out.push({ t: "table", rows: table }); table = []; } };
    for (const line of lines) {
      const s = line.trim();
      if (!s) { flushList(); flushTable(); continue; }      if (s.startsWith("|")) { flushList(); table.push(s); continue; }
      flushTable();
      if (s.startsWith("### ")) { flushList(); out.push({ t: "h3", text: s.slice(4) }); }
      else if (s.startsWith("## ")) { flushList(); out.push({ t: "h2", text: s.slice(3) }); }
      else if (s.startsWith("# ")) { flushList(); out.push({ t: "h2", text: s.slice(2) }); }
      else if (s.startsWith("- ") || s.startsWith("• ")) { list.push(s.slice(2)); }
      else { flushList(); out.push({ t: "p", text: s }); }
    }
    flushList(); flushTable();
    return out;
  }

  if (!loaded) return <p className="text-center text-gray-500 py-10">Loading engine…</p>;
  if (!admin) return <p className="text-center text-gray-500 py-10">🛡️ Admin access only.</p>;

  const social = analysis ? socialPack() : null;

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold">🧠 AI Article & SEO Engine</h1>
        <p className="text-xs text-gray-500">Research → intent → keywords → AI writes → auto-fill → audit → publish.</p>
        {msg && <p className="text-xs font-bold text-green-700 mt-1">{msg}</p>}
      </div>

      <div className="glass-card p-3 rounded-2xl">
        <p className="text-xs font-bold text-gray-500 mb-1">📂 Load existing article to update</p>
        <select className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" onChange={(e) => e.target.value && loadExisting(e.target.value)} value="">
          <option value="">— choose article —</option>
          {blogs.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
        </select>
      </div>

      <div className="glass-card p-4 rounded-2xl space-y-2">
        <p className="text-sm font-extrabold text-forest-700">1️⃣ ARTICLE BRIEF</p>
        <input className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" placeholder="Topic * (e.g. How to Start Maggot Farming)" value={f.topic} onChange={(e) => setF({ ...f, topic: e.target.value })} />
        <input className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" placeholder="Primary keyword (auto = topic)" value={f.primaryKey} onChange={(e) => setF({ ...f, primaryKey: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <input className="p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" placeholder="Category" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} />
          <input className="p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" placeholder="Region" value={f.region} onChange={(e) => setF({ ...f, region: e.target.value })} />
          <input className="p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" placeholder="Author" value={f.author} onChange={(e) => setF({ ...f, author: e.target.value })} />
          <select className="p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" value={f.depth} onChange={(e) => setF({ ...f, depth: e.target.value })}>
            <option value="quick">Quick (800w)</option>
            <option value="standard">Standard (1500w)</option>
            <option value="pillar">Pillar (3000w+)</option>
          </select>
        </div>
        <input className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" placeholder="Target audience" value={f.audience} onChange={(e) => setF({ ...f, audience: e.target.value })} />
        <input className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" placeholder="Secondary keywords (comma separated, optional)" value={f.secondaryKw} onChange={(e) => setF({ ...f, secondaryKw: e.target.value })} />
        <textarea className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" rows={2} placeholder="Questions to answer (one per line, optional)" value={f.questions} onChange={(e) => setF({ ...f, questions: e.target.value })} />        <textarea className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" rows={2} placeholder="Special instructions (optional)" value={f.instructions} onChange={(e) => setF({ ...f, instructions: e.target.value })} />
        <button onClick={generate} className="w-full bg-forest-600 text-white py-3 rounded-xl font-extrabold">🧠 RUN INTENT + KEYWORD + GAP ANALYSIS</button>
      </div>

      {analysis && (
        <>
          <div className="glass-card p-4 rounded-2xl space-y-2">
            <p className="text-sm font-extrabold text-forest-700">2️⃣ ANALYSIS</p>
            <p className="text-xs"><b>Intent:</b> {intent?.intent} — <i>{intent?.why}</i></p>
            <p className="text-xs"><b>Secondary:</b> {analysis.secondary.join(", ")}</p>
            <p className="text-xs"><b>Long-tail:</b> {analysis.longtail.join(", ")}</p>
            <p className="text-xs"><b>Entities:</b> {analysis.entities.slice(0, 12).join(", ")}</p>
            <p className="text-xs"><b>Structure:</b> {analysis.structure.join(" → ")}</p>
            {analysis.cannib.length > 0 && (
              <p className="text-xs font-bold text-red-600 bg-red-50 p-2 rounded-xl">⚠️ CANNIBALIZATION WARNING: similar articles exist: {analysis.cannib.map((c: any) => c.title).join("; ")} — consider updating/expanding them instead.</p>
            )}
            <p className="text-xs"><b>Internal links:</b> {analysis.internal.length ? analysis.internal.map((i: any) => i.title).join(", ") : "none yet — publish supporting articles."}</p>
          </div>

          <div className="glass-card p-4 rounded-2xl space-y-2 border-2 border-purple-400">
            <p className="text-sm font-extrabold text-purple-700">🤖 IN-HOUSE AI WRITER</p>
            <div className="flex gap-2">
              <input className="flex-1 p-2 rounded-xl border border-gray-200 bg-white/70 text-xs" type="password" placeholder="Gemini API key (free at aistudio.google.com/apikey)" value={aiKey} onChange={(e) => { setAiKey(e.target.value); localStorage.setItem("ftb_gemini_key", e.target.value); }} />
              <select className="p-2 rounded-xl border border-gray-200 bg-white/70 text-xs" value={aiModel} onChange={(e) => setAiModel(e.target.value)}>
                <option value="gemini-2.0-flash">gemini-2.0-flash</option>
                <option value="gemini-1.5-flash">gemini-1.5-flash</option>
              </select>
            </div>
            <button onClick={writeWithAI} disabled={aiBusy} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-extrabold disabled:opacity-50">
              {aiBusy ? "✍️ Writing & formatting your article..." : "✍️ WRITE THE ARTICLE WITH AI (auto-fills everything)"}
            </button>
            <p className="text-[9px] text-gray-400">The writer embeds internal links, bolds key terms, builds tables and FAQs, then fills the content, FAQ and source panels automatically.</p>
            <button onClick={() => copy(aiPack(), "AI Writer brief")} className="w-full bg-gray-700 text-white py-2 rounded-xl text-xs font-bold">📋 Or copy the brief for an external AI</button>
          </div>

          <div className="glass-card p-4 rounded-2xl space-y-2">
            <p className="text-sm font-extrabold text-forest-700">3️⃣ SEO PACK</p>
            <input className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" value={seo.title} onChange={(e) => setSeo({ ...seo, title: e.target.value })} />
            <p className="text-[9px] text-gray-400">SEO title ({seo.title.length}/60)</p>
            <input className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" value={seo.h1} onChange={(e) => setSeo({ ...seo, h1: e.target.value })} />
            <textarea className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" rows={2} value={seo.meta} onChange={(e) => setSeo({ ...seo, meta: e.target.value })} />
            <p className="text-[9px] text-gray-400">Meta description ({seo.meta.length}/160)</p>
            <div className="flex gap-2 items-center">
              <span className="text-xs text-gray-500">/blog/</span>
              <input className="flex-1 p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" value={seo.slug} onChange={(e) => setSeo({ ...seo, slug: slugify(e.target.value) })} />
            </div>
            <div className="flex gap-2">
              <button onClick={() => copy(buildSchema(), "JSON-LD schema")} className="flex-1 bg-gray-800 text-white py-2 rounded-xl text-xs font-bold">🧬 Copy Schema</button>
              <button onClick={() => copy(`Home → ${f.category} → ${seo.h1}`, "Breadcrumbs")} className="flex-1 bg-gray-600 text-white py-2 rounded-xl text-xs font-bold">🧭 Copy Breadcrumbs</button>
            </div>          </div>

          <div className="glass-card p-4 rounded-2xl space-y-2">
            <p className="text-sm font-extrabold text-forest-700">4️⃣ CONTENT + MEDIA + CTA</p>
            <div className="flex gap-2">
              <button onClick={() => copy(content, "Article")} className="flex-1 bg-green-600 text-white py-2 rounded-xl text-xs font-bold">📄 Copy Article</button>
              <button onClick={() => copy(faqText, "FAQ lines")} className="flex-1 bg-teal-600 text-white py-2 rounded-xl text-xs font-bold">❓ Copy FAQ</button>
              <button onClick={() => copy(srcText, "Sources")} className="flex-1 bg-gray-600 text-white py-2 rounded-xl text-xs font-bold">📖 Copy Sources</button>
            </div>
            <button onClick={() => setShowPreview(!showPreview)} className="w-full bg-forest-50 text-forest-700 py-2 rounded-xl text-xs font-extrabold">{showPreview ? "🙈 Hide formatted preview" : "👁️ Show formatted preview (exactly as readers will see)"}</button>
            {showPreview && (
              <div className="bg-white rounded-2xl p-4 space-y-3 border border-gray-200">
                {pvBlocks().map((blk, i) => {
                  if (blk.t === "h2") return <h2 key={i} className="text-lg font-extrabold text-forest-800 pt-2">{inline(blk.text)}</h2>;
                  if (blk.t === "h3") return <h3 key={i} className="text-base font-bold text-forest-700 pt-1">{inline(blk.text)}</h3>;
                  if (blk.t === "ul") return <ul key={i} className="list-disc pl-5 space-y-1 text-sm text-gray-800">{blk.items.map((it: string, j: number) => <li key={j}>{inline(it)}</li>)}</ul>;
                  if (blk.t === "table") {
                    const rows = blk.rows.map((r: string) => r.split("|").map((c: string) => c.trim()).filter(Boolean));
                    return (
                      <div key={i} className="overflow-x-auto">
                        <table className="w-full text-xs border border-gray-200 rounded-xl overflow-hidden">
                          <thead className="bg-forest-50"><tr>{(rows[0] || []).map((c: string, j: number) => <th key={j} className="p-2 text-left font-extrabold text-forest-800">{c}</th>)}</tr></thead>
                          <tbody>{rows.slice(1).map((r: string[], j: number) => <tr key={j} className="border-t border-gray-100">{r.map((c, k) => <td key={k} className="p-2 text-gray-700">{inline(c)}</td>)}</tr>)}</tbody>
                        </table>
                      </div>
                    );
                  }
                  return <p key={i} className="text-sm text-gray-800 leading-relaxed text-justify">{inline(blk.text)}</p>;
                })}
              </div>
            )}
            <label className="block text-xs font-semibold text-green-700 cursor-pointer">🖼️ Featured image (Cloudinary)
              <input type="file" accept="image/*" className="hidden" onChange={uploadCoverFn} />
            </label>
            {cover && <img src={cover} alt="" className="h-20 w-full object-cover rounded-xl" />}
            <button onClick={() => copy(`Photorealistic Nigerian farm scene illustrating "${f.topic}", golden hour, vertical 2:3, deep green and gold palette, educational composition, no text overlays — Farming Tech & Business visual identity.`, "Image prompt")} className="w-full bg-amber-500 text-white py-2 rounded-xl text-xs font-bold">🎨 Copy AI Image Prompt</button>
            <textarea className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm font-mono" rows={12} placeholder="Article Markdown (AI writer fills this automatically)..." value={content} onChange={(e) => setContent(e.target.value)} />
            <input className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" placeholder="YouTube video URL (optional)" value={f.videoUrl} onChange={(e) => setF({ ...f, videoUrl: e.target.value })} />
            <select className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" value={f.productId} onChange={(e) => setF({ ...f, productId: e.target.value })}>
              <option value="">— Ebook CTA: none —</option>
              {ebooks.map((eb) => <option key={eb.id} value={eb.id}>📚 {eb.title}</option>)}
            </select>
          </div>

          <div className="glass-card p-4 rounded-2xl space-y-2">
            <p className="text-sm font-extrabold text-forest-700">5️⃣ FAQ + SOURCES (auto-filled by AI)</p>
            <textarea className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" rows={4} placeholder="Question | Answer (one per line)" value={faqText} onChange={(e) => setFaqText(e.target.value)} />
            <textarea className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" rows={3} placeholder="Source title | Organization | URL (one per line)" value={srcText} onChange={(e) => setSrcText(e.target.value)} />
          </div>
          <div className="glass-card p-4 rounded-2xl space-y-2">
            <p className="text-sm font-extrabold text-forest-700">6️⃣ QUALITY AUDIT</p>
            <button onClick={runAudit} className="w-full bg-forest-600 text-white py-2.5 rounded-xl font-extrabold">🔍 RUN SEO READINESS AUDIT</button>
            {audit.length > 0 && (
              <>
                <p className="text-2xl font-extrabold text-center">{score}<span className="text-sm text-gray-400">/100 editorial score</span></p>
                {audit.map((c) => (
                  <p key={c.k} className={`text-xs font-bold ${c.ok ? "text-green-700" : "text-amber-600"}`}>{c.ok ? "✅ PASS" : "🟡 REVIEW"} — {c.k}</p>
                ))}
              </>
            )}
          </div>

          {social && (
            <div className="glass-card p-4 rounded-2xl space-y-2">
              <p className="text-sm font-extrabold text-forest-700">7️⃣ SOCIAL DISTRIBUTION PACK</p>
              <button onClick={() => copy(social.fb, "Facebook post")} className="w-full bg-blue-600 text-white py-2 rounded-xl text-xs font-bold">f Copy Facebook post</button>
              <button onClick={() => copy(social.ig, "Instagram caption")} className="w-full bg-pink-600 text-white py-2 rounded-xl text-xs font-bold">📸 Copy Instagram caption</button>
              <button onClick={() => copy(social.x, "X post")} className="w-full bg-gray-800 text-white py-2 rounded-xl text-xs font-bold"> Copy X post</button>
              <button onClick={() => copy(social.li, "LinkedIn post")} className="w-full bg-sky-700 text-white py-2 rounded-xl text-xs font-bold">in Copy LinkedIn post</button>
              <button onClick={() => copy(social.pin, "Pinterest description")} className="w-full bg-red-600 text-white py-2 rounded-xl text-xs font-bold">📌 Copy Pinterest description</button>
            </div>
          )}

          <div className="glass-card p-4 rounded-2xl space-y-2 border-2 border-green-400">
            <p className="text-sm font-extrabold text-green-700">8️⃣ PUBLISH</p>
            <div className="flex gap-2">
              <select className="flex-1 p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="updating">Updating</option>
                <option value="archived">Archived</option>
              </select>
              <label className="flex items-center gap-1 text-xs font-bold"><input type="checkbox" checked={indexable} onChange={(e) => setIndexable(e.target.checked)} /> indexable</label>
            </div>
            <button onClick={publish} className="w-full bg-green-600 text-white py-3 rounded-xl font-extrabold">🚀 {editId ? "UPDATE ARTICLE" : "PUBLISH ARTICLE"}</button>
            <p className="text-[9px] text-gray-400">Never publish below 60/100 without review. Searcher first, always.</p>
          </div>
        </>
      )}
    </div>
  );
}