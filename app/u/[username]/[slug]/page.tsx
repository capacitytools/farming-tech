import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import BlogViewBumper from '@/components/BlogViewBumper';
import AdBanner from '@/components/AdBanner';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://farmingtechbusiness.com';

function sb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

async function getPost(username: string, slug: string) {
  const supabase = sb();
  
  const { data: profile } = await supabase.from('profiles').select('id, full_name').or(`username.eq.${username},id.eq.${username}`).single();
  if (!profile) return null;

  const { data: b, error } = await supabase.from('blogs').select('*').eq('slug', slug).eq('author_id', profile.id).single();
  if (!b || error) return null;

  // AUTO-MATCH YOUR E-BOOKS
  const { data: matchedEbooks } = await supabase.from('ebooks').select('id, title, cover_url, description').eq('is_active', true).ilike('title', `%${b.category}%`).limit(1);

  // Fetch user's attached products
  let products: any[] = [];
  if (b.linked_products && b.linked_products.length > 0) {
    const res = await supabase.from('affiliate_links').select('id,title,image_url,slug').in('id', b.linked_products);
    products = res.data || [];
  }

  return { b, profile, ebook: matchedEbooks?.[0] || null, products };
}

export async function generateMetadata({ params }: { params: { username: string, slug: string } }) {
  const d = await getPost(params.username, params.slug);
  if (!d) return { title: 'Post not found' };
  return { title: d.b.title, description: d.b.content.slice(0, 150) };
}

function inline(text: string) {
  const parts = (text || "").split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g);
  return parts.map((p: string, i: number) => {
    if (p.startsWith("**") && p.endsWith("**")) return <strong key={i} className="font-extrabold">{p.slice(2, -2)}</strong>;
    if (p.startsWith("*") && p.endsWith("*") && p.length > 2) return <em key={i}>{p.slice(1, -1)}</em>;
    const m = p.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (m) return <a key={i} href={m[2]} className="text-green-600 font-semibold underline">{m[1]}</a>;
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

export default async function UserPostPage({ params }: { params: { username: string, slug: string } }) {
  const d = await getPost(params.username, params.slug);
  if (!d) return <div className="p-10 text-center font-bold">Post not found.</div>;

  const { b, profile, ebook, products } = d;
  const parsedBlocks = blocks(b.content);
  
  // 🚨 THEME ENGINE LOGIC 🚨
  const isDark = b.theme_id === 'theme-2';
  const bgClass = isDark ? 'bg-gray-900 text-gray-200' : 'bg-white text-gray-800';
  const headerClass = isDark ? 'text-white' : 'text-forest-900';
  const cardClass = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';

  let paragraphCount = 0;

  return (
    <div className={`pb-24 max-w-2xl mx-auto shadow-sm min-h-screen ${bgClass}`}>
      <BlogViewBumper id={b.id} />

      <header className="px-4 pt-8 pb-4">
        <span className="text-[10px] font-bold bg-forest-600 text-white px-3 py-1 rounded-full uppercase">{b.category}</span>
        <h1 className={`text-3xl font-extrabold mt-4 leading-tight ${headerClass}`}>{b.title}</h1>
        <p className="text-[11px] opacity-70 mt-2 font-semibold">By {profile.full_name || 'Farmer'}</p>
      </header>

      {b.cover_image_url && (
        <div className="px-4 mt-2">
          <img src={b.cover_image_url} alt={b.title} className="w-full h-64 object-cover rounded-2xl shadow-sm" />
        </div>
      )}

      <article className="px-4 mt-8 space-y-4">
        {parsedBlocks.map((blk: any, i: number) => {
          // 🚨 RENDER ALL 6 HEADING LEVELS 🚨
          if (blk.t === "h1") return <h1 key={i} className={`text-3xl font-extrabold pt-6 ${headerClass}`}>{inline(blk.text)}</h1>;
          if (blk.t === "h2") return <h2 key={i} className={`text-2xl font-extrabold pt-6 border-l-4 border-forest-300 pl-3 ${isDark ? 'text-amber-400' : 'text-forest-800'}`}>{inline(blk.text)}</h2>;
          if (blk.t === "h3") return <h3 key={i} className={`text-xl font-bold pt-4 ${isDark ? 'text-amber-500' : 'text-forest-700'}`}>{inline(blk.text)}</h3>;
          if (blk.t === "h4") return <h4 key={i} className={`text-lg font-bold pt-3 ${isDark ? 'text-amber-600' : 'text-forest-700'}`}>{inline(blk.text)}</h4>;
          if (blk.t === "h5") return <h5 key={i} className={`text-base font-bold pt-2 ${isDark ? 'text-amber-700' : 'text-forest-600'}`}>{inline(blk.text)}</h5>;
          if (blk.t === "h6") return <h6 key={i} className={`text-sm font-bold uppercase tracking-wider pt-2 ${isDark ? 'text-amber-800' : 'text-forest-600'}`}>{inline(blk.text)}</h6>;
          
          if (blk.t === "ul") return <ul key={i} className="list-disc pl-5 space-y-1 text-sm">{blk.items.map((it: string, j: number) => <li key={j}>{inline(it)}</li>)}</ul>;
          
          if (blk.t === "table") {
            const rows = blk.rows.map((r: string) => r.split("|").map((c: string) => c.trim()).filter(Boolean));
            return (
              <div key={i} className="overflow-x-auto my-4">
                <table className="w-full text-xs border border-gray-200 rounded-xl overflow-hidden">
                  <thead className={isDark ? 'bg-gray-800' : 'bg-forest-50'}>
                    <tr>{(rows[0] || []).map((c: string, j: number) => <th key={j} className={`p-2 text-left font-extrabold ${isDark ? 'text-white' : 'text-forest-800'}`}>{c}</th>)}</tr>
                  </thead>
                  <tbody>
                    {rows.slice(1).map((r: string[], j: number) => <tr key={j} className="border-t border-gray-100 dark:border-gray-700">{r.map((c: string, k: number) => <td key={k} className="p-2">{inline(c)}</td>)}</tr>)}
                  </tbody>
                </table>
              </div>
            );
          }
          
          paragraphCount++;
          
          return (
            <div key={i}>
              <p className="text-base leading-relaxed text-justify opacity-90">{inline(blk.text)}</p>
              
              {/* 🚨 ADSENSE INJECTION 🚨 */}
              {paragraphCount === 3 && (
                <>
                  <div className="my-6"><AdBanner slot="user_blog_in_article" /></div>
                  
                  {/* 🚨 AUTO-MATCHED E-BOOK INJECTION 🚨 */}
                  {ebook && (
                    <div className="my-8 bg-gradient-to-br from-forest-800 to-forest-900 text-white rounded-3xl overflow-hidden shadow-xl border border-forest-700 p-5">
                      <p className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest mb-1">Recommended Read</p>
                      <h3 className="text-xl font-extrabold leading-tight mb-2">{ebook.title}</h3>
                      <p className="text-xs text-forest-200 mb-4 line-clamp-2">{ebook.description}</p>
                      <Link href={`/ebooks/${ebook.id}`} className="block text-center bg-amber-400 text-forest-900 px-5 py-3 rounded-xl text-sm font-extrabold">
                        GET THE E-BOOK →
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </article>

      {/* USER'S PRODUCTS */}
      {products.length > 0 && (
        <div className="px-4 mt-8 space-y-3">
          <p className="text-sm font-extrabold uppercase tracking-widest border-b-2 border-amber-400 pb-1 mb-3">Gear Mentioned</p>
          {products.map(p => (
            <div key={p.id} className={`p-3 border-2 border-amber-300 rounded-2xl flex items-center gap-3 shadow-sm ${cardClass}`}>
              {p.image_url && <img src={p.image_url} alt={p.title} className="w-16 h-16 object-cover rounded-xl" />}
              <div className="flex-1">
                <p className="text-xs font-extrabold leading-tight mb-2 line-clamp-2">{p.title}</p>
                <a href={`/go/${p.slug}`} target="_blank" className="block bg-amber-500 text-white text-center py-1.5 rounded-lg text-xs font-extrabold">
                  Check Price →
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mx-4 mt-8 mb-4"><AdBanner slot="user_blog_bottom" /></div>

      {/* FARMING TECH BRANDING */}
      <div className="text-center mt-12 mb-4">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Powered By</p>
        <p className={`text-lg font-extrabold ${headerClass}`}>Farming Tech & Business</p>
        <p className="text-[10px] font-bold text-gray-400">© 2026</p>
      </div>
    </div>
  );
}