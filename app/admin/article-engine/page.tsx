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

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: p } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      setAdmin(p?.role === "admin");
    }
    const [b, e] = await Promise.all([
      supabase.from("blogs").select("*").order("created_at", { ascending: false }),
      supabase.from("ebooks").select("id, title, price").order("created_at", { ascending: false }),
    ]);    setBlogs(b.data || []);
    setEbooks(e.data || []);
    setLoaded(true);
  }
  useEffect(() => { load(); }, []);

  function flash(t: string) {
    setMsg(t);
    setTimeout(() => setMsg(""), 2500);
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
    const structure = it.intent.startsWith("Informational (How")
      ? ["Quick Answer", "What You Need Before You Start", "Step-by-Step Process", "Costs & Budget Table", "Common Mistakes to Avoid", "FAQs", "Conclusion & Next Steps"]
      : it.intent === "Transactional"
        ? ["Quick Answer", "What You Get", "How It Works", "Pricing & Options", "Who It Is For", "FAQs", "Get Started"]
        : ["Quick Answer", "Key Takeaways", "Core Explanation", "Practical Examples & Tables", "Common Misconceptions", "FAQs", "Conclusion"];
    const cannib = blogs.filter((b) => b.slug !== seo.slug && ((b.primary_keyword || "").toLowerCase().includes(pk) || (b.title || "").toLowerCase().includes(pk)));    const internal = blogs.filter((b) => b.category === f.category && b.slug !== slugify(f.topic)).slice(0, 4)
      .map((b) => ({ title: b.title, url: "/blog/" + b.slug, anchor: b.title, where: "One contextual mention in the body + the Related Guides block" }));
    const title = (cap(f.topic) + " — " + f.region + " Guide").slice(0, 60);
    const meta = (f.topic + ": practical steps, real costs and common mistakes for " + f.audience.toLowerCase() + ". Clear, field-tested guidance from Farming Tech & Business.").slice(0, 158);
    const slug = slugify(f.topic);
    setSeo({ title, h1: cap(f.topic), meta, slug });
    setAnalysis({ pk, secondary, longtail, questions, entities, structure, cannib, internal });
    flash("🧠 Analysis complete — review the SEO pack below.");
  }

  function runAudit() {
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    const faqs = faqText.split("\n").filter((l) => l.includes("|"));
    const srcs = srcText.split("\n").filter((l) => l.includes("|"));
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
    setScore(checks.filter((c) => c.ok).length * 10);
  }

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
        {          "@type": "BreadcrumbList",
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
SEMANTIC ENTITIES: ${(a?.entities || []).join(", ")}
SEARCH INTENT: ${intent?.intent} (${intent?.why})
AUDIENCE: ${f.audience} | REGION: ${f.region} | DEPTH: ${f.depth}
STRUCTURE (H2s):\n- ${a?.structure?.join("\n- ")}
INTERNAL LINKS TO INCLUDE NATURALLY:\n- ${(a?.internal || []).map((i: any) => i.title + " (" + i.url + ")").join("\n- ")}
PRODUCT CTA: ${ebooks.find((e) => e.id === f.productId)?.title || "none"} — contextual "Want to go deeper?" block at the end, never aggressive.
RULES: Quick Answer (40-100 words) first. Key Takeaways. Tables where they help. No AI filler ("In today's world...", "delve", "unlock"). Never fabricate experience or dosages; use "Research indicates...", "Farmers commonly...". Cite sources for disease/medication/feed-formulation claims. Mobile-friendly short paragraphs. Finish with Conclusion + Related Guides + Ebook CTA. Output clean Markdown with H2/H3 headings.` + (f.instructions ? "\nSPECIAL INSTRUCTIONS: " + f.instructions : "");
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
    if (!file) return;    try {
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
    const srcs = srcText.split("\n").filter((l) => l.includes("|")).map((l) => { const [t, o, u] = l.split("|"); return { title: (t || "").trim(), org: (o || "").trim(), url: (u || "").trim() }; });
    const payload = {
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
      updated_at: new Date().toISOString(),    };
    if (editId) await supabase.from("blogs").update(payload).eq("id", editId);
    else await supabase.from("blogs").insert(payload);
    flash("🚀 " + (editId ? "Updated" : "Published") + " with full SEO pack! Score: " + score + "/100");
    load();
  }

  if (!loaded) return <p className="text-center text-gray-500 py-10">Loading engine…</p>;
  if (!admin) return <p className="text-center text-gray-500 py-10">🛡️ Admin access only.</p>;

  const social = analysis ? socialPack() : null;

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold">🧠 AI Article & SEO Engine</h1>
        <p className="text-xs text-gray-500">Research → intent → keywords → write → audit → publish. Searcher first, always.</p>
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
        <textarea className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" rows={2} placeholder="Questions to answer (one per line, optional)" value={f.questions} onChange={(e) => setF({ ...f, questions: e.target.value })} />
        <textarea className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" rows={2} placeholder="Special instructions (optional)" value={f.instructions} onChange={(e) => setF({ ...f, instructions: e.target.value })} />
        <button onClick={generate} className="w-full bg-forest-600 text-white py-3 rounded-xl font-extrabold">🧠 RUN INTENT + KEYWORD + GAP ANALYSIS</button>
      </div>

      {analysis && (        <>
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
            <button onClick={() => copy(aiPack(), "AI Writer brief")} className="w-full bg-purple-600 text-white py-3 rounded-xl font-extrabold">🤖 COPY AI WRITER BRIEF (paste into your AI project)</button>
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
            </div>
          </div>

          <div className="glass-card p-4 rounded-2xl space-y-2">
            <p className="text-sm font-extrabold text-forest-700">4️⃣ CONTENT + MEDIA + CTA</p>
            <label className="block text-xs font-semibold text-green-700 cursor-pointer">🖼️ Featured image (Cloudinary)
              <input type="file" accept="image/*" className="hidden" onChange={uploadCoverFn} />
            </label>
            {cover && <img src={cover} alt="" className="h-20 w-full object-cover rounded-xl" />}
            <button onClick={() => copy(`Photorealistic Nigerian farm scene illustrating "${f.topic}", golden hour, vertical 2:3, deep green and gold palette, educational composition, no text overlays — Farming Tech & Business visual identity.`, "Image prompt")} className="w-full bg-amber-500 text-white py-2 rounded-xl text-xs font-bold">🎨 Copy AI Image Prompt</button>
            <textarea className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm font-mono" rows={12} placeholder="Paste the article Markdown here (from your AI writer or written by you)..." value={content} onChange={(e) => setContent(e.target.value)} />
            <input className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" placeholder="YouTube video URL (optional)" value={f.videoUrl} onChange={(e) => setF({ ...f, videoUrl: e.target.value })} />
            <select className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" value={f.productId} onChange={(e) => setF({ ...f, productId: e.target.value })}>
              <option value="">— Ebook CTA: none —</option>
              {ebooks.map((eb) => <option key={eb.id} value={eb.id}>📚 {eb.title}</option>)}
            </select>
          </div>

          <div className="glass-card p-4 rounded-2xl space-y-2">
            <p className="text-sm font-extrabold text-forest-700">5️⃣ FAQ + SOURCES</p>
            <textarea className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" rows={4} placeholder={"Question | Answer (one per line)"} value={faqText} onChange={(e) => setFaqText(e.target.value)} />            <textarea className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm" rows={3} placeholder={"Source title | Organization | URL (one per line)"} value={srcText} onChange={(e) => setSrcText(e.target.value)} />
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
              <button onClick={() => copy(social.x, "X post")} className="w-full bg-gray-800 text-white py-2 rounded-xl text-xs font-bold">𝕏 Copy X post</button>
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