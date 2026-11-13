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
  
  // Find the user by username (or ID)
  const { data: profile } = await supabase.from('profiles').select('id, full_name').or(`username.eq.${username},id.eq.${username}`).single();
  
  if (!profile) return null;

  // Fetch the post belonging to this user
  const { data: b, error } = await supabase
    .from('blogs')
    .select('*')
    .eq('slug', slug)
    .eq('author_id', profile.id)
    .single();

  if (!b || error) return null;

  // 🚨 AUTO-MATCH YOUR E-BOOKS BASED ON CATEGORY 🚨
  const { data: matchedEbooks } = await supabase
    .from('ebooks')
    .select('id, title, cover_url, description')
    .eq('is_active', true)
    .ilike('title', `%${b.category}%`) // Looks for "Poultry Ebook" if category is "Poultry"
    .limit(1);

  // Fetch products attached by the user
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

// Basic parser (same as your main blog)
function inline(text: string) {
  const parts = (text || "").split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g);
  return parts.map((p: string, i: number) => {
    if (p.startsWith("**") && p.endsWith("**")) return <strong key={i} className="font-extrabold">{p.slice(2, -2)}</strong>;
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
  for (let i = 0; i < lines.length; i++) {
    const s = lines[i].trim();
    if (!s) continue;
    if (s.startsWith("## ")) { out.push({ t: "h2", text: s.slice(3) }); }
    else if (s.startsWith("- ")) { list.push(s.slice(2)); }
    else { 
      if (list.length) { out.push({ t: "ul", items: list }); list = []; }
      out.push({ t: "p", text: s }); 
    }
  }
  if (list.length) out.push({ t: "ul", items: list });
  return out;
}

export default async function UserPostPage({ params }: { params: { username: string, slug: string } }) {
  const d = await getPost(params.username, params.slug);
  if (!d) return <div className="p-10 text-center">Post not found.</div>;

  const { b, profile, ebook, products } = d;
  const parsedBlocks = blocks(b.content);
  
  // Theme Logic (Basic implementation)
  const isDarkTheme = b.theme_id === 'theme-2';
  const bgClass = isDarkTheme ? 'bg-gray-900 text-white' : 'bg-white text-gray-800';
  const headerClass = isDarkTheme ? 'text-white' : 'text-forest-900';

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
          if (blk.t === "h2") return <h2 key={i} className={`text-xl font-extrabold pt-4 ${isDarkTheme ? 'text-amber-400' : 'text-forest-800'}`}>{inline(blk.text)}</h2>;
          if (blk.t === "ul") return <ul key={i} className="list-disc pl-5 space-y-1 text-sm">{blk.items.map((it: string, j: number) => <li key={j}>{inline(it)}</li>)}</ul>;
          
          paragraphCount++;
          
          return (
            <div key={i}>
              <p className="text-base leading-relaxed text-justify opacity-90">{inline(blk.text)}</p>
              
              {/* 🚨 YOUR ADSENSE INJECTION 🚨 */}
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
            <div key={p.id} className="p-3 bg-white border-2 border-amber-300 rounded-2xl flex items-center gap-3 shadow-sm">
              {p.image_url && <img src={p.image_url} alt={p.title} className="w-16 h-16 object-cover rounded-xl" />}
              <div className="flex-1">
                <p className="text-xs font-extrabold text-gray-900 leading-tight mb-2 line-clamp-2">{p.title}</p>
                <a href={`/go/${p.slug}`} target="_blank" className="block bg-amber-500 text-white text-center py-1.5 rounded-lg text-xs font-extrabold">
                  Check Price →
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mx-4 mt-8 mb-4"><AdBanner slot="user_blog_bottom" /></div>
    </div>
  );
}