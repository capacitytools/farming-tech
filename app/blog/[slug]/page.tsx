import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import BlogViewBumper from '@/components/BlogViewBumper';
import AdBanner from '@/components/AdBanner';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://farmingtechbusiness.com';

export const revalidate = 3600;

function sb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

async function getBlog(slug: string) {
  const supabase = sb();
  const { data: b, error } = await supabase.from('blogs').select('*').eq('slug', slug).single();
  if (!b || error) return null;

  const { data: rel } = await supabase.from('blogs').select('slug,title,category,cover_image_url').eq('category', b.category).neq('id', b.id).limit(3);

  let ebooks: any[] = [];
  if (b.linked_ebooks && b.linked_ebooks.length > 0) {
    const res = await supabase.from('ebooks').select('id, title, cover_url, description').in('id', b.linked_ebooks);
    ebooks = b.linked_ebooks.map((id: string) => res.data?.find(e => e.id === id)).filter(Boolean);
  } else if (b.product_cta) {
    const res = await supabase.from('ebooks').select('id, title, cover_url, description').eq('id', b.product_cta).single();
    if (res.data) ebooks.push(res.data);
  }

  let products: any[] = [];
  if (b.linked_products && b.linked_products.length > 0) {
    const res = await supabase.from('affiliate_links').select('id,title,image_url,slug').in('id', b.linked_products);
    products = res.data || [];
  }

  return { b, rel: rel || [], ebooks, products };
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
    if (p.startsWith("*") && p.endsWith("*") && p.length > 2) return <em key={i}>{p.slice(1, -1)}</em>;
    const m = p.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (m) return <a key={i} href={m[2]} className="text-green-700 font-semibold underline">{m[1]}</a>;
    return <span key={i}>{p}</span>;
  });
}

// 🚨 FIXED PARSER: Now supports H1-H6 🚨
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

    // 🚨 HEADING DETECTION (longest match first) 🚨
    if (s.startsWith("###### ")) { flushList(); out.push({ t: "h6", text: s.slice(7) }); }
    else if (s.startsWith("##### ")) { flushList(); out.push({ t: "h5", text: s.slice(6) }); }
    else if (s.startsWith("#### ")) { flushList(); out.push({ t: "h4", text: s.slice(5) }); }
    else if (s.startsWith("### ")) { flushList(); out.push({ t: "h3", text: s.slice(4) }); }
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

function EbookCard({ ebook, index }: { ebook: any, index: number }) {
  return (
    <div className={`mx-4 my-8 bg-gradient-to-br from-forest-800 to-forest-900 text-white rounded-3xl overflow-hidden shadow-xl border border-forest-700 flex flex-col ${index > 0 ? 'opacity-95' : ''}`}>
      {ebook.cover_url && (
         <img src={ebook.cover_url} alt={ebook.title} className="w-full h-32 object-cover opacity-80" />
      )}
      <div className="p-5">
        <p className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest mb-1">Recommended E-Book</p>
        <h3 className="text-xl font-extrabold leading-tight mb-2">{ebook.title}</h3>
        <p className="text-xs text-forest-200 mb-4 line-clamp-2">
          {ebook.description || "Get the complete, practical guide to mastering this agricultural business."}
        </p>
        <Link 
          href={'/ebooks/' + ebook.id} 
          className="block text-center bg-amber-400 text-forest-900 px-5 py-3 rounded-xl text-sm font-extrabold shadow-md active:scale-95 transition-transform"
        >
          GET THE E-BOOK NOW →
        </Link>
      </div>
    </div>
  );
}

export default async function BlogArticlePage({ params }: { params: { slug: string } }) {
  const d = await getBlog(params.slug);
  if (!d) return <div className="p-10 text-center">Article not found</div>;

  const { b, rel, ebooks, products } = d;
  const parsedBlocks = blocks(b.content);
  
  let paragraphCount = 0;

  return (
    <div className="pb-24 max-w-2xl mx-auto bg-white shadow-sm min-h-screen">
      <BlogViewBumper id={b.id} />

      <header className="px-4 pt-6">
        <span className="text-[10px] font-bold text-forest-600 bg-forest-50 px-3 py-1 rounded-full uppercase">{b.category}</span>
        <h1 className="text-3xl font-extrabold text-forest-900 mt-3 leading-tight">{b.title}</h1>
      </header>

      {b.cover_image_url && (
        <div className="px-4 mt-4">
          <img src={b.cover_image_url} alt={b.title} className="w-full h-64 object-cover rounded-2xl shadow-sm" />
        </div>
      )}

      <article className="px-4 mt-8 space-y-4 text-gray-800">
        {parsedBlocks.map((blk: any, i: number) => {
          // 🚨 RENDER ALL 6 HEADING LEVELS WITH PROPER TYPOGRAPHY 🚨
          if (blk.t === "h1") return <h1 key={i} className="text-3xl font-extrabold text-forest-900 pt-6">{inline(blk.text)}</h1>;
          if (blk.t === "h2") return <h2 id={slugify(blk.text)} key={i} className="text-2xl font-extrabold text-forest-800 pt-6 border-l-4 border-forest-300 pl-3 scroll-mt-20">{inline(blk.text)}</h2>;
          if (blk.t === "h3") return <h3 key={i} className="text-xl font-bold text-forest-700 pt-4">{inline(blk.text)}</h3>;
          if (blk.t === "h4") return <h4 key={i} className="text-lg font-bold text-forest-700 pt-3">{inline(blk.text)}</h4>;
          if (blk.t === "h5") return <h5 key={i} className="text-base font-bold text-forest-600 pt-2">{inline(blk.text)}</h5>;
          if (blk.t === "h6") return <h6 key={i} className="text-sm font-bold text-forest-600 uppercase tracking-wider pt-2">{inline(blk.text)}</h6>;
          
          if (blk.t === "ul") return <ul key={i} className="list-disc pl-5 space-y-1 text-sm">{blk.items.map((it: string, j: number) => <li key={j}>{inline(it)}</li>)}</ul>;
          
          if (blk.t === "table") {
            const rows = blk.rows.map((r: string) => r.split("|").map((c: string) => c.trim()).filter(Boolean));
            return (
              <div key={i} className="overflow-x-auto my-4">
                <table className="w-full text-xs border border-gray-200 rounded-xl overflow-hidden">
                  <thead className="bg-forest-50">
                    <tr>{(rows[0] || []).map((c: string, j: number) => <th key={j} className="p-2 text-left font-extrabold text-forest-800">{c}</th>)}</tr>
                  </thead>
                  <tbody>
                    {rows.slice(1).map((r: string[], j: number) => <tr key={j} className="border-t border-gray-100">{r.map((c: string, k: number) => <td key={k} className="p-2 text-gray-700">{inline(c)}</td>)}</tr>)}
                  </tbody>
                </table>
              </div>
            );
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

      {ebooks.length > 0 && <EbookCard ebook={ebooks[0]} index={0} />}
      {ebooks.length > 1 && <EbookCard ebook={ebooks[1]} index={1} />}
      {ebooks.slice(2).map((eb, idx) => <EbookCard key={idx} ebook={eb} index={idx + 2} />)}

      {products.length > 0 && (
        <div className="px-4 mt-8 space-y-3">
          <p className="text-sm font-extrabold text-gray-800 uppercase tracking-widest border-b-2 border-amber-400 pb-1 mb-3">Recommended Gear</p>
          {products.map(p => (
            <div key={p.id} className="p-3 bg-amber-50 border-2 border-amber-300 rounded-2xl flex items-center gap-3 shadow-sm">
              {p.image_url ? (
                <img src={p.image_url} alt={p.title} className="w-16 h-16 object-cover rounded-xl bg-white" />
              ) : (
                <div className="w-16 h-16 bg-amber-200 rounded-xl flex items-center justify-center text-2xl">🛍️</div>
              )}
              <div className="flex-1">
                <p className="text-xs font-extrabold text-amber-900 leading-tight mb-2 line-clamp-2">{p.title}</p>
                <a href={`/go/${p.slug}`} target="_blank" rel="noopener noreferrer" className="block bg-amber-500 text-white text-center py-1.5 rounded-lg text-xs font-extrabold shadow-sm">
                  Check Price & Buy →
                </a>
              </div>
            </div>
          ))}
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