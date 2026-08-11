import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MODELS = ["gemini-2.5-flash-lite", "gemini-2.0-flash", "gemini-3-flash-preview", "gemini-2.5-flash"];

async function callGemini(key: string, model: string, prompt: string, useTools: boolean) {
  const body: any = { contents: [{ parts: [{ text: prompt }] }] };
  if (useTools) body.tools = [{ google_search: {} }];
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const raw = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(raw);
  } catch {
    return { error: raw.slice(0, 100) };
  }
  const text = (json?.candidates?.[0]?.content?.parts || []).map((p: any) => p.text || "").join("");
  if (text) return { text };
  return { error: json?.error?.message || "no text" };
}

export async function POST(req: Request) {
  try {
    const { topic, category, keywords } = await req.json();
    const key = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!key) return NextResponse.json({ error: "Gemini API key missing" }, { status: 500 });
    if (!topic?.trim()) return NextResponse.json({ error: "Give me a topic first" }, { status: 400 });

    const supabase = createClient();
    const { data: posts } = await supabase
      .from("blogs")
      .select("title, slug")
      .eq("status", "published")
      .order("views_count", { ascending: false })
      .limit(6);
    const internal = (posts || [])
      .map((p: any) => `"${p.title}" → https://farmtechbusiness.com/blog/${p.slug}`)
      .join("\n");

    const prompt = `You are a professional agricultural writer and consultant with 15 years of hands-on field experience in Nigeria and Africa. You write world-class, SEO-optimized blog articles.

TOPIC: ${topic}
CATEGORY: ${category || "choose the best one"}
FOCUS KEYWORDS: ${keywords || "choose the best SEO keywords yourself"}

WRITE A COMPLETE, PUBLICATION-READY ARTICLE IN CLEAN HTML with these rules:
1. Act from deep real field experience — specific numbers, product names, dosages, mistakes to avoid. No fluff.
2. SEO: use the focus keyword naturally 8-12 times, including in the <h1>, at least two <h2>s, and the first paragraph.
3. Structure: <h1> title, strong intro paragraph, 5-7 <h2> sections, some <h3>, <ul> lists, <strong> for key facts, <blockquote> for a pro tip.
4. CURRENT FACTS: use live search to verify current information. Embed EXACTLY 2 external authoritative links (FAO, government agriculture agencies, research universities) as real <a href="https://...">anchor text links</a> inside sentences.
5. INTERNAL LINKS: embed EXACTLY 2 of these internal links naturally as <a> anchors where relevant:
${internal || "https://farmtechbusiness.com/ebooks (E-book store)"}
6. End with a conclusion + a call-to-action to join Farming Tech & Business.
7. Length: 900-1300 words. Professional but friendly. Plain HTML only (no markdown, no asterisks).

After the HTML, add these exact lines:
SEOTITLE: (under 60 chars, keyword first)
SEODESC: (under 155 chars, compelling, with keyword)
TAGS: 6 comma-separated SEO tags`;

    let lastError = "";
    let text = "";
    for (const useTools of [true, false]) {
      for (const model of MODELS) {
        const r = await callGemini(key, model, prompt, useTools);
        if (r.text) {
          text = r.text;
          break;
        }
        lastError = r.error || "failed";
      }
      if (text) break;
    }
    if (!text) return NextResponse.json({ error: lastError || "Writer failed" }, { status: 502 });

    const cut = text.search(/SEOTITLE:/i);
    const html = (cut > 0 ? text.slice(0, cut) : text).trim();
    const seoTitle = text.match(/SEOTITLE:\s*(.+)/i)?.[1]?.trim() || topic;
    const seoDescription = text.match(/SEODESC:\s*(.+)/i)?.[1]?.trim() || "";
    const tags = text.match(/TAGS:\s*(.+)/i)?.[1]?.trim() || "";
    const title = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, "").trim() || seoTitle;

    return NextResponse.json({ ok: true, html, title, seoTitle, seoDescription, tags });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}