import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';
import BlogPublishFab from '@/components/BlogPublishFab';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://farmingtechbusiness.com';

export const revalidate = 300;

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function generateMetadata() {
  return {
    title: 'Blog | Farming Tech & Business',
    description: 'Practical farming guides, livestock advice, agribusiness ideas and agricultural technology articles from Farming Tech & Business.',
    alternates: { canonical: SITE + '/blog' },
    openGraph: { title: 'Blog | Farming Tech & Business', description: 'Practical farming guides and agribusiness knowledge.', url: SITE + '/blog', siteName: 'Farming Tech & Business' },
  };
}

export default async function BlogHomePage({ searchParams }: { searchParams: { cat?: string; q?: string } }) {
  const supabase = sb();
  const cat = searchParams.cat || '';
  const q = (searchParams.q || '').trim();

  let query = supabase
    .from('blogs')
    .select('id,slug,title,excerpt,meta_description,cover_image_url,cover_ratio,category,created_at,views_count,status,indexable')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(80); // Increased limit slightly so we don't lose real posts after deduplication
    
  if (cat) query = query.eq('category', cat);
  if (q) query = query.ilike('title', '%' + q + '%');
  
  const { data } = await query;
  
  // 🚨 THE DEDUPLICATION FIX
  // We use a Map to ensure each title only appears once.
  // It keeps the first one it sees (which is the newest due to our order clause).
  const uniquePostsMap = new Map();
  (data || []).forEach((post: any) => {
    if (post.indexable !== false) {
      const normalizedTitle = post.title.toLowerCase().trim();
      if (!uniquePostsMap.has(normalizedTitle)) {
        uniquePostsMap.set(normalizedTitle, post);
      }
    }
  });
  const posts = Array.from(uniquePostsMap.values());

  const { data: allCats } = await supabase.from('blogs').select('category').eq('status', 'published').limit(500);
  const cats = Array.from(new Set((allCats || []).map((c: any) => c.category).filter(Boolean))) as string[];

  return (
    <div className="pb-24 max-w-2xl mx-auto min-h-screen bg-gray-50 dark:bg-forest-950">
      
      {/* HEADER */}
      <div className="bg-gradient-to-br from-forest-700 to-forest-900 text-white p-5 rounded-b-3xl">
        <h1 className="text-2xl font-extrabold">📰 FTB Blog</h1>
        <p className="text-[11px] text-forest-200 mt-0.5">Practical agricultural knowledge, guides and business ideas</p>
        <form action="/blog" method="GET" className="mt-3 flex gap-2">
          {cat && <input type="hidden" name="cat" value={cat} />}
          <input name="q" defaultValue={q} placeholder="Search articles..." className="flex-1 p-2.5 rounded-xl text-sm text-forest-900 bg-white/95 outline-none" />
          <button className="bg-gold-500 text-forest-900 px-4 rounded-xl text-sm font-extrabold">Go</button>
        </form>
      </div>

      {/* CATEGORIES */}
      <div className="px-4 mt-3 flex gap-2 overflow-x-auto pb-1">
        <Link href={'/blog' + (q ? '?q=' + encodeURIComponent(q) : '')} className={'whitespace-nowrap px-3 py-1.5 rounded-full text-[10px] font-bold ' + (!cat ? 'bg-forest-600 text-white' : 'bg-white dark:bg-forest-900 text-forest-700 dark:text-forest-200 shadow-sm')}>All</Link>
        {cats.map((c) => (
          <Link key={c} href={'/blog?cat=' + encodeURIComponent(c) + (q ? '&q=' + encodeURIComponent(q) : '')} className={'whitespace-nowrap px-3 py-1.5 rounded-full text-[10px] font-bold ' + (cat === c ? 'bg-forest-600 text-white' : 'bg-white dark:bg-forest-900 text-forest-700 dark:text-forest-200 shadow-sm')}>{c}</Link>
        ))}
      </div>

      {/* BLOG LIST */}
      <div className="p-4 space-y-3">
        {posts.map((b: any) => (
          <Link key={b.id || b.slug} href={'/blog/' + b.slug} className="glass-card bg-white dark:bg-forest-900 p-3 rounded-2xl flex gap-3 active:scale-[0.99]">
            <div className="w-24 shrink-0 overflow-hidden rounded-xl bg-forest-100 relative" style={{ aspectRatio: b.cover_ratio === '4:5' ? '4 / 5' : '2 / 3' }}>
              {b.cover_image_url ? (
                <Image 
                  src={b.cover_image_url} 
                  alt={b.title} 
                  fill 
                  sizes="96px"
                  className="object-cover" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">📰</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-bold text-forest-600 uppercase">{b.category || 'Farming'}</p>
              <p className="text-sm font-extrabold text-forest-900 dark:text-white line-clamp-2 mt-0.5">{b.title}</p>
              <p className="text-[11px] text-gray-500 line-clamp-2 mt-1">{b.excerpt || b.meta_description || ''}</p>
              <p className="text-[9px] text-gray-400 mt-1.5">{new Date(b.created_at).toLocaleDateString()} · 👁 {b.views_count || 0}</p>
            </div>
          </Link>
        ))}
        {posts.length === 0 && (
          <div className="glass-card bg-white dark:bg-forest-900 p-8 rounded-2xl text-center">
            <p className="text-3xl mb-2">🌾</p>
            <p className="text-sm font-bold text-forest-900 dark:text-white">No articles found</p>
            <p className="text-xs text-gray-500 mt-1">Try another category or search term.</p>
          </div>
        )}
      </div>

      <BlogPublishFab />
    </div>
  );
}