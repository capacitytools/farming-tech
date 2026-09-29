import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import BlogViewBumper from '@/components/BlogViewBumper';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://farming-tech.vercel.app';

export const revalidate = 3600;

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function safeParse(s: any, fallback: any) {
  try {
    return s ? JSON.parse(s) : fallback;
  } catch (e) {
    return fallback;
  }
}

async function getBlog(slug: string) {
  const supabase = sb();
  const { data: b, error } = await supabase.from('blogs').select('*').eq('slug', slug).single();
  if (!b || error) return null;
  
  const { data: rel } = await supabase
    .from('blogs')
    .select('slug,title,category,cover_image_url')
    .eq('category', b.category)
    .neq('id', b.id)
    .limit(6);
  
  let ebook: any = null;
  if (b.product_cta) {
    const res3 = await supabase.from('ebooks').select('id,title,price,cover_url').eq('id', b.product_cta).single();
    ebook = res3.data;
  }
  
  return { b, rel: rel || [], ebook };
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const d = await getBlog(params.slug);
  if (!d) return { title: 'Article not found | Farming Tech & Business' };
  
  const b = d.b;
  const title = b.meta_title || b.title;  const desc = b.meta_description || b.excerpt || (b.content || '').slice(0, 150);
  const indexable = b.indexable !== false && b.status !== 'draft' && b.status !== 'archived';
  
  return {
    title: title + ' | Farming Tech & Business',
    description: desc,
    alternates: { canonical: SITE + '/blog/' + b.slug },
    robots: { index: indexable, follow: true },
    openGraph: {
      title,
      description: desc,
      type: 'article',
      url: SITE + '/blog/' + b.slug,
      siteName: 'Farming Tech & Business',
      images: b.cover_image_url ? [{ url: b.cover_image_url }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
      images: b.cover_image_url ? [b.cover_image_url] : [],
    },
  };
}

function inline(text: string) {
  const parts = (text || '').split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g);
  return parts.map((p: string, i: number) => {
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={i} className="font-extrabold text-forest-900">{p.slice(2, -2)}</strong>;
    if (p.startsWith('*') && p.endsWith('*') && p.length > 2) return <em key={i}>{p.slice(1, -1)}</em>;
    const m = p.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (m) return <a key={i} href={m[2]} className="text-green-700 font-semibold underline">{m[1]}</a>;
    return <span key={i}>{p}</span>;
  });
}

function blocks(content: string) {
  const lines = (content || '').split('\n');
  const out: any[] = [];
  let list: string[] = [];
  let table: string[] = [];
  
  const flushList = () => { if (list.length) { out.push({ t: 'ul', items: list }); list = []; } };
  const flushTable = () => { if (table.length) { out.push({ t: 'table', rows: table }); table = []; } };
  
  for (let i = 0; i < lines.length; i++) {
    const s = lines[i].trim();
    if (!s) { flushList(); flushTable(); continue; }
    if (s.startsWith('|')) { flushList(); table.push(s); continue; }
    flushTable();    if (s.startsWith('### ')) { flushList(); out.push({ t: 'h3', text: s.slice(4) }); }
    else if (s.startsWith('## ')) { flushList(); out.push({ t: 'h2', text: s.slice(3) }); }
    else if (s.startsWith('# ')) { flushList(); out.push({ t: 'h2', text: s.slice(2) }); }
    else if (s.startsWith('- ') || s.startsWith('* ')) { list.push(s.slice(2)); }
    else { flushList(); out.push({ t: 'p', text: s }); }
  }
  flushList(); 
  flushTable();
  return out;
}

export default async function BlogArticlePage({ params }: { params: { slug: string } }) {
  const d = await getBlog(params.slug);
  
  if (!d) {
    return (
      <div className="p-10 pb-24 text-center max-w-md mx-auto">
        <p className="text-4xl mb-2">404</p>
        <h1 className="text-xl font-extrabold mb-2">Article not found</h1>
        <p className="text-sm text-gray-500 mb-4">This guide may have been moved or updated.</p>
        <Link href="/blog" className="inline-block bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold">Browse all insights</Link>
      </div>
    );
  }
  
  const { b, rel, ebook } = d;
  const faqs: any[] = safeParse(b.faq_json, []);
  
  const schemaObj = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    'headline': b.title,
    'description': b.meta_description || (b.content || '').slice(0, 150),
    'author': { '@type': 'Person', 'name': b.author_name || 'Farming Tech & Business' },
    'datePublished': b.created_at,
    'publisher': { '@type': 'Organization', 'name': 'Farming Tech & Business' },
    'mainEntityOfPage': SITE + '/blog/' + b.slug
  };
  
  const schema = b.schema_json || JSON.stringify(schemaObj);

  return (
    <div className="pb-24 max-w-2xl mx-auto">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schema }} />
      <BlogViewBumper id={b.id} />

      <nav className="px-4 pt-3 text-[10px] text-gray-500 font-semibold">
        <Link href="/" className="hover:underline">Home</Link>
        <span> / </span>
        <Link href="/blog" className="hover:underline">{b.category || 'Insights'}</Link>        <span> / </span>
        <span className="text-forest-700">{b.title}</span>
      </nav>

      <header className="px-4 mt-2">
        <span className="inline-block bg-forest-100 text-forest-700 text-[10px] font-extrabold px-3 py-1 rounded-full">{b.category || 'Farming'}</span>
        <h1 className="text-2xl font-extrabold text-forest-900 mt-2 leading-tight">{b.title}</h1>
        <p className="text-[10px] text-gray-500 mt-2">
          {b.author_name || 'Farming Tech & Business'} | {new Date(b.created_at).toLocaleDateString()} | {b.views_count || 0} views
        </p>
      </header>

      {b.cover_image_url && (
        <div className="px-4 mt-3">
          <img src={b.cover_image_url} alt={b.title} className="w-full h-56 object-cover rounded-2xl" />
        </div>
      )}

      <article className="px-4 mt-4 space-y-3">
        {blocks(b.content).map((blk: any, i: number) => {
          if (blk.t === 'h2') return <h2 key={i} className="text-lg font-extrabold text-forest-800 pt-2 border-l-4 border-forest-300 pl-2">{inline(blk.text)}</h2>;
          if (blk.t === 'h3') return <h3 key={i} className="text-base font-bold text-forest-700 pt-1">{inline(blk.text)}</h3>;
          if (blk.t === 'ul') return <ul key={i} className="list-disc pl-5 space-y-1 text-sm text-gray-800">{blk.items.map((it: string, j: number) => <li key={j}>{inline(it)}</li>)}</ul>;
          if (blk.t === 'table') {
            const rows = blk.rows.map((r: string) => r.split('|').map((c: string) => c.trim()).filter(Boolean));
            return (
              <div key={i} className="overflow-x-auto">
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
          return <p key={i} className="text-sm text-gray-800 leading-relaxed text-justify">{inline(blk.text)}</p>;
        })}
      </article>

      {ebook && (
        <div className="px-4 mt-6">
          <div className="bg-gradient-to-r from-forest-600 to-green-700 text-white p-5 rounded-2xl">
            <p className="text-sm font-extrabold">Want to Go Deeper?</p>
            <p className="text-xs text-green-100 mt-1">Get the {ebook.title}.</p>
            <Link href={'/ebooks/' + ebook.id} className="inline-block bg-amber-400 text-forest-900 px-5 py-2.5 rounded-xl text-xs font-extrabold mt-3">GET THE COMPLETE GUIDE</Link>
          </div>
        </div>      )}

      {faqs.length > 0 && (
        <section className="px-4 mt-6">
          <h2 className="text-lg font-extrabold text-forest-800 mb-2">Frequently Asked Questions</h2>
          <div className="space-y-2">
            {faqs.map((f: any, i: number) => (
              <div key={i} className="glass-card p-3 rounded-2xl">
                <p className="text-sm font-bold text-forest-800">{f.q}</p>
                <p className="text-xs text-gray-700 mt-1 text-justify">{f.a}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {rel.length > 0 && (
        <section className="px-4 mt-6">
          <h2 className="text-lg font-extrabold text-forest-800 mb-2">Continue Learning</h2>
          <div className="space-y-2">
            {rel.map((r: any) => (
              <Link key={r.slug} href={'/blog/' + r.slug} className="glass-card p-3 rounded-2xl flex items-center gap-3 active:scale-[0.99]">
                {r.cover_image_url ? <img src={r.cover_image_url} alt={r.title} className="w-12 h-12 object-cover rounded-lg" /> : <div className="w-12 h-12 bg-forest-100 rounded-lg flex items-center justify-center">News</div>}
                <p className="text-xs font-bold text-forest-800 line-clamp-2">{r.title}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
