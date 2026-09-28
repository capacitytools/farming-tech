import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import BlogViewBumper from "@/components/BlogViewBumper";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://farming-tech.vercel.app";

export const revalidate = 3600;

function sb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

function safeParse(s: any, fallback: any) {
  try { return s ? JSON.parse(s) : fallback; } catch { return fallback; }
}

async function getBlog(slug: string) {
  const supabase = sb();
  const { data: b } = await supabase.from("blogs").select("*").eq("slug", slug).single();
  if (!b) return null;
  const [{ data: rel }, ebookRes] = await Promise.all([
    supabase.from("blogs").select("slug,title,category,cover_image_url").eq("category", b.category).neq("id", b.id).limit(6),
    b.product_cta ? supabase.from("ebooks").select("id,title,price,cover_url").eq("id", b.product_cta).single() : Promise.resolve({ data: null } as any),
  ]);
  return { b, rel: rel || [], ebook: ebookRes?.data || null };
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const d = await getBlog(params.slug);
  if (!d) return { title: "Article not found | Farming Tech & Business" };
  const b = d.b;
  const title = b.meta_title || b.title;
  const desc = b.meta_description || b.excerpt || (b.content || "").slice(0, 150);
  const indexable = b.indexable !== false && b.status !== "draft" && b.status !== "archived";
  return {
    title: title + " | Farming Tech & Business",
    description: desc,
    alternates: { canonical: SITE + "/blog/" + b.slug },
    robots: { index: indexable, follow: true },
    openGraph: {
      title,
      description: desc,
      type: "article",
      url: SITE + "/blog/" + b.slug,
      siteName: "Farming Tech & Business",
      images: b.cover_image_url ? [{ url: b.cover_image_url }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,      description: desc,
      images: b.cover_image_url ? [b.cover_image_url] : [],
    },
  };
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

function blocks(content: string) {
  const lines = (content || "").split("\n");
  const out: any[] = [];
  let list: string[] = [];
  let table: string[] = [];
  const flushList = () => { if (list.length) { out.push({ t: "ul", items: list }); list = []; } };
  const flushTable = () => { if (table.length) { out.push({ t: "table", rows: table }); table = []; } };
  for (const line of lines) {
    const s = line.trim();
    if (!s) { flushList(); flushTable(); continue; }
    if (s.startsWith("|")) { flushList(); table.push(s); continue; }
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

export default async function BlogArticlePage({ params }: { params: { slug: string } }) {
  const d = await getBlog(params.slug);
  if (!d) {
    return (
      <div className="p-10 pb-24 text-center max-w-md mx-auto">
        <p className="text-4xl mb-2">🌾</p>
        <h1 className="text-xl font-extrabold mb-2">Article not found</h1>
        <p className="text-sm text-gray-500 mb-4">This guide may have been moved or updated.</p>
        <Link href="/blog" className="inline-block bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold">Browse all insights →</Link>
      </div>
    );  }
  const { b, rel, ebook } = d;
  const faqs = safeParse(b.faq_json, []);
  const sources = safeParse(b.sources_json, []);
  const schema = b.schema_json || JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: b.title,
    description: b.meta_description || (b.content || "").slice(0, 150),
    author: { "@type": "Person", name: b.author_name || "Farming Tech & Business" },
    datePublished: b.created_at,
    publisher: { "@type": "Organization", name: "Farming Tech & Business" },
    mainEntityOfPage: SITE + "/blog/" + b.slug,
  });
  const url = SITE + "/blog/" + b.slug;
  const shareText = b.title + " 🌾 Farming Tech & Business";
  const en = encodeURIComponent;

  return (
    <div className="pb-24 max-w-2xl mx-auto">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schema }} />
      <BlogViewBumper id={b.id} />

      <nav className="px-4 pt-3 text-[10px] text-gray-500 font-semibold">
        <Link href="/" className="hover:underline">Home</Link> → <Link href="/blog" className="hover:underline">{b.category || "Insights"}</Link> → <span className="text-forest-700">{b.title}</span>
      </nav>

      <header className="px-4 mt-2">
        <span className="inline-block bg-forest-100 text-forest-700 text-[10px] font-extrabold px-3 py-1 rounded-full">{b.category || "Farming"}</span>
        <h1 className="text-2xl font-extrabold text-forest-900 mt-2 leading-tight">{b.title}</h1>
        <p className="text-[10px] text-gray-500 mt-2">
          ✍️ {b.author_name || "Farming Tech & Business"} · 📅 {new Date(b.created_at).toLocaleDateString()}
          {b.updated_at && b.updated_at !== b.created_at ? " · 🔄 Updated " + new Date(b.updated_at).toLocaleDateString() : ""} · 👁️ {b.views_count || 0} views
        </p>
      </header>

      {b.cover_image_url && (
        <div className="px-4 mt-3">
          <img src={b.cover_image_url} alt={b.title + " — Farming Tech & Business guide"} className="w-full h-56 object-cover rounded-2xl" />
        </div>
      )}

      <div className="px-4 mt-3 flex items-center gap-3 text-xs font-bold text-gray-600">
        <span className="text-[9px] text-gray-400">Share:</span>
        <a href={`https://wa.me/?text=${en(shareText + " " + url)}`} target="_blank" rel="noopener noreferrer">📤</a>
        <a href={`https://www.facebook.com/sharer/sharer.php?u=${en(url)}`} target="_blank" rel="noopener noreferrer">f</a>
        <a href={`https://twitter.com/intent/tweet?text=${en(shareText)}&url=${en(url)}`} target="_blank" rel="noopener noreferrer">𝕏</a>
        <a href={`https://pinterest.com/pin/create/button/?url=${en(url)}&media=${en(b.cover_image_url || "")}&description=${en(shareText)}`} target="_blank" rel="noopener noreferrer">📌</a>
      </div>
      <article className="px-4 mt-4 space-y-3">
        {blocks(b.content).map((blk, i) => {
          if (blk.t === "h2") return <h2 key={i} className="text-lg font-extrabold text-forest-800 pt-2 border-l-4 border-forest-300 pl-2">{inline(blk.text)}</h2>;
          if (blk.t === "h3") return <h3 key={i} className="text-base font-bold text-forest-700 pt-1">{inline(blk.text)}</h3>;
          if (blk.t === "ul") return <ul key={i} className="list-disc pl-5 space-y-1 text-sm text-gray-800">{blk.items.map((it: string, j: number) => <li key={j}>{inline(it)}</li>)}</ul>;
          if (blk.t === "table") {
            const rows = blk.rows.map((r: string) => r.split("|").map((c: string) => c.trim()).filter(Boolean));
            return (
              <div key={i} className="overflow-x-auto">
                <table className="w-full text-xs border border-gray-200 rounded-xl overflow-hidden">
                  <thead className="bg-forest-50">
                    <tr>{(rows[0] || []).map((c: string, j: number) => <th key={j} className="p-2 text-left font-extrabold text-forest-800">{c}</th>)}</tr>
                  </thead>
                  <tbody>
                    {rows.slice(1).map((r: string[], j: number) => <tr key={j} className="border-t border-gray-100">{r.map((c, k) => <td key={k} className="p-2 text-gray-700">{inline(c)}</td>)}</tr>}
                  </tbody>
                </table>
              </div>
            );
          }
          return <p key={i} className="text-sm text-gray-800 leading-relaxed text-justify">{inline(blk.text)}</p>;
        })}
      </article>

      {b.video_url && b.video_url.includes("youtube") && (
        <div className="px-4 mt-4">
          <iframe className="w-full h-56 rounded-2xl" src={b.video_url.replace("watch?v=", "embed/")} title={b.title} allowFullScreen />
        </div>
      )}

      {ebook && (
        <div className="px-4 mt-6">
          <div className="bg-gradient-to-r from-forest-600 to-green-700 text-white p-5 rounded-2xl">
            <p className="text-sm font-extrabold">📚 Want to Go Deeper?</p>
            <p className="text-xs text-green-100 mt-1">This article gives you the foundation. For the complete practical system — step by step, with tables, costs and checklists — get the <b>{ebook.title}</b>.</p>
            <Link href={`/ebooks/${ebook.id}`} className="inline-block bg-amber-400 text-forest-900 px-5 py-2.5 rounded-xl text-xs font-extrabold mt-3">GET THE COMPLETE GUIDE →</Link>
          </div>
        </div>
      )}

      {faqs.length > 0 && (
        <section className="px-4 mt-6">
          <h2 className="text-lg font-extrabold text-forest-800 mb-2">❓ Frequently Asked Questions</h2>
          <div className="space-y-2">
            {faqs.map((f: any, i: number) => (
              <div key={i} className="glass-card p-3 rounded-2xl">
                <p className="text-sm font-bold text-forest-800">{f.q}</p>
                <p className="text-xs text-gray-700 mt-1 text-justify">{f.a}</p>
              </div>
            ))}          </div>
        </section>
      )}

      {sources.length > 0 && (
        <section className="px-4 mt-6">
          <h2 className="text-sm font-extrabold text-forest-800 mb-2">📖 Sources & References</h2>
          <ul className="space-y-1">
            {sources.map((s: any, i: number) => (
              <li key={i} className="text-[11px] text-gray-600">
                {s.url ? <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-green-700 underline">{s.title}</a> : s.title}
                {s.org ? ` — ${s.org}` : ""}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="px-4 mt-6">
        <div className="glass-card p-4 rounded-2xl flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-forest-100 flex items-center justify-center text-xl">✍️</div>
          <div>
            <p className="text-sm font-extrabold">{b.author_name || "Farming Tech & Business"}</p>
            <p className="text-[10px] text-gray-500">Agricultural content team — practical, source-aware guides for farmers, tech people and business owners.</p>
          </div>
        </div>
      </section>

      {rel.length > 0 && (
        <section className="px-4 mt-6">
          <h2 className="text-lg font-extrabold text-forest-800 mb-2">📚 Continue Learning</h2>
          <div className="space-y-2">
            {rel.map((r: any) => (
              <Link key={r.slug} href={"/blog/" + r.slug} className="glass-card p-3 rounded-2xl flex items-center gap-3 active:scale-[0.99]">
                {r.cover_image_url ? <img src={r.cover_image_url} alt={r.title} className="w-12 h-12 object-cover rounded-lg" /> : <div className="w-12 h-12 bg-forest-100 rounded-lg flex items-center justify-center">📰</div>}
                <p className="text-xs font-bold text-forest-800 line-clamp-2">{r.title}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <p className="px-4 mt-6 text-[9px] text-gray-400 text-center">Canonical: {url} · Part of the Farming Tech & Business knowledge network (a G-Chat wing).</p>
    </div>
  );
}