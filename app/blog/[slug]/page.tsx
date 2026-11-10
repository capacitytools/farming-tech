import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import BlogViewBumper from '@/components/BlogViewBumper';
import AdBanner from '@/components/AdBanner';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://farmingtechbusiness.com';

export const revalidate = 3600;

function sb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

function safeParse(s: any, fallback: any) {
  try { return s ? JSON.parse(s) : fallback; } catch (e) { return fallback; }
}

async function getBlog(slug: string) {
  const supabase = sb();
  const { data: b, error } = await supabase.from('blogs').select('*').eq('slug', slug).single();
  if (!b || error) return null;

  const { data: rel } = await supabase.from('blogs').select('slug,title,category,cover_image_url').eq('category', b.category).neq('id', b.id).limit(6);

  let ebook: any = null;
  if (b.product_cta) {
    const res3 = await supabase.from('ebooks').select('id,title,price,cover_url').eq('id', b.product_cta).single();
    ebook = res3.data;
  }

  return { b, rel: rel || [], ebook };
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const d = await getBlog(params.slug);
  if (!d) return { title: 'Article not found' };
  const b = d.b;
  return {
    title: b.meta_title || b.title,
    description: b.meta_description || b.excerpt || (b.content || '').slice(0, 150),
    alternates: { canonical: SITE + '/blog/' + b.slug },
  };
}

function inline(text: string) {
  const parts = (text || "").split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g);
  return parts.map((p: string, i: number) => {
    if (p.startsWith("**") && p.endsWith("**")) return <strong key={i} className="font-extrabold text-forest-900">{p.slice(2, -2)}</strong>;
    if (p.startsWith("*") && p.endsWith("*")) return <em key={i}>{p.slice(1, -1)}</em>;
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

  for (let i = 0; i < lines.length; i++) {
    const s = lines[i].trim();
    if (!s) { flushList(); flushTable(); continue; }
    if (s.startsWith("|")) { flushList(); table.push(s); continue; }
    flushTable();
    if (s.startsWith("### ")) { flushList(); out.push({ t: "h3", text: s.slice(4) }); }
    else if (s.startsWith("## ")) { flushList(); out.push({ t: "h2", text: s.slice(3) }); }
    else if (s.startsWith("# ")) { flushList(); out.push({ t: "h2", text: s.slice(2) }); }
    else if (s.startsWith("- ") || s.startsWith("* ")) { list.push(s.slice(2)); }
    else { flushList(); out.push({ t: "p", text: s }); }
  }
  flushList();
  flushTable();
  return out;
}

function slugify(text: string) { return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }

export default async function BlogArticlePage({ params }: { params: { slug: string } }) {
  const d = await getBlog(params.slug);
  if (!d) return <div className="p-10 text-center">Article not found</div>;

  const { b, rel, ebook } = d;
  const parsedBlocks = blocks(b.content);
  const wordCount = (b.content || "").split(/\s+/).length;
  const readTime = Math.ceil(wordCount / 200);
  const toc = parsedBlocks.filter((b: any) => b.t === "h2").map((b: any) => ({ text: b.text, id: slugify(b.text) }));

  let paragraphCount = 0;

  return (
    <div className="pb-24 max-w-2xl mx-auto bg-white shadow-sm min-h-screen">
      <BlogViewBumper id={b.id} />

      <header className="px-4 pt-6">
        <span className="text-[10px] font-bold text-forest-600 bg-forest-50 px-3 py-1 rounded-full uppercase">{b.category}</span>
        <h1 className="text-3xl font-extrabold text-forest-900 mt-3 leading-tight">{b.title}</h1>
        <p className="text-[11px] text-gray-500 mt-2 font-semibold">{b.author_name} • {new Date(b.created_at).toLocaleDateString()} • ⏱️ {readTime} min read</p>
      </header>

      {b.cover_image_url && (
        <div className="px-4 mt-4">
          <img src={b.cover_image_url} alt={b.title} className="w-full h-64 object-cover rounded-2xl shadow-sm" />
        </div>
      )}

      {toc.length >= 3 && (
        <div className="px-4 mt-6">
          <div className="bg-forest-50 border border-forest-200 p-4 rounded-2xl">
            <p className="text-sm font-extrabold text-forest-800 mb-2">📑 In This Article</p>
            <ul className="space-y-1.5">{toc.map((item, i) => <li key={i} className="text-xs text-forest-700 font-semibold"><a href={"#" + item.id}>• {item.text}</a></li>)}</ul>
          </div>
        </div>
      )}

      <article className="px-4 mt-8 space-y-4 text-gray-800">
        {parsedBlocks.map((blk: any, i: number) => {
          if (blk.t === "h2") return <h2 id={slugify(blk.text)} key={i} className="text-xl font-extrabold text-forest-800 pt-4 border-l-4 border-forest-300 pl-3">{inline(blk.text)}</h2>;
          if (blk.t === "h3") return <h3 key={i} className="text-lg font-bold text-forest-700 pt-2">{inline(blk.text)}</h3>;
          if (blk.t === "ul") return <ul key={i} className="list-disc pl-5 space-y-1 text-sm">{blk.items.map((it: string, j: number) => <li key={j}>{inline(it)}</li>)}</ul>;
          if (blk.t === "table") {
            const rows = blk.rows.map((r: string) => r.split("|").map((c: string) => c.trim()).filter(Boolean));
            return <div key={i} className="overflow-x-auto"><table className="w-full text-xs border border-gray-200 rounded-xl"><thead className="bg-forest-50"><tr>{(rows[0] || []).map((c: string, j: number) => <th key={j} className="p-2 text-left font-extrabold text-forest-800">{c}</th>)}</tr></thead><tbody>{rows.slice(1).map((r: string[], j: number) => <tr key={j} className="border-t">{r.map((c: string, k: number) => <td key={k} className="p-2">{inline(c)}</td>)}</tr>)}</tbody></table></div>;
          }
          
          paragraphCount++;
          return (
            <div key={i}>
              <p className="text-base text-gray-800 leading-relaxed text-justify">{inline(blk.text)}</p>
              {paragraphCount === 3 && <div className="my-6"><AdBanner slot="blog_in_article" /></div>}
            </div>
          );
        })}
      </article>

      {/* 🚨 THE NEW PRODUCT CARD DISPLAY 🚨 */}
      {b.product_title && b.product_link && (
        <div className="mx-4 mt-8 p-4 bg-amber-50 border-2 border-amber-300 rounded-3xl flex items-center gap-4 shadow-lg">
          {b.product_image ? (
            <img src={b.product_image} alt={b.product_title} className="w-20 h-20 object-cover rounded-xl bg-white shadow-sm" />
          ) : (
            <div className="w-20 h-20 bg-amber-200 rounded-xl flex items-center justify-center text-3xl">🛍️</div>
          )}
          <div className="flex-1">
            <p className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider mb-1">Recommended Product</p>
            <p className="text-sm font-extrabold text-amber-900 leading-tight mb-2">{b.product_title}</p>
            <a href={b.product_link} target="_blank" rel="noopener noreferrer" className="block bg-amber-500 text-white text-center py-2 rounded-lg text-xs font-extrabold shadow-sm active:scale-95 transition-transform">
              Check Price & Buy →
            </a>
          </div>
        </div>
      )}

      {ebook && (
        <div className="mx-4 mt-6">
          <div className="bg-gradient-to-r from-forest-600 to-green-700 text-white p-5 rounded-3xl shadow-lg">
            <p className="text-sm font-extrabold">Want to Go Deeper? 📚</p>
            <p className="text-xs text-green-100 mt-1">Get the complete {ebook.title}.</p>
            <Link href={'/ebooks/' + ebook.id} className="inline-block bg-amber-400 text-forest-900 px-5 py-2.5 rounded-xl text-xs font-extrabold mt-3">GET THE EBOOK →</Link>
          </div>
        </div>
      )}

      <div className="mx-4 mt-8 mb-4"><AdBanner slot="blog_bottom" /></div>

      <div className="px-4 mt-12 bg-forest-50 p-6 rounded-t-3xl">
        <h2 className="text-lg font-extrabold text-forest-800 mb-4">Continue Learning</h2>
        <div className="space-y-3">
          {rel.map((r: any) => (
            <Link key={r.slug} href={'/blog/' + r.slug} className="bg-white p-3 rounded-xl flex items-center gap-3 shadow-sm border border-gray-100">
              {r.cover_image_url ? <img src={r.cover_image_url} alt="" className="w-12 h-12 rounded-lg object-cover" /> : <div className="w-12 h-12 bg-forest-100 rounded-lg flex items-center justify-center">📰</div>}
              <p className="text-xs font-bold text-forest-900 line-clamp-2">{r.title}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}