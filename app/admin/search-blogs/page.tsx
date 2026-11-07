'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function AdminBlogSearchPage() {
  const [admin, setAdmin] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [allBlogs, setAllBlogs] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState(false);
  const [msg, setMsg] = useState('');

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      setAdmin(p?.role === 'admin' || p?.role === 'editor');
    }

    // Fetch all published blogs
    const { data: b } = await supabase
      .from('blogs')
      .select('id,title,slug,category,content,primary_keyword')
      .eq('status', 'published');

    setAllBlogs(b || []);
    setLoaded(true);
  }

  useEffect(() => { load(); }, []);

  function flash(t: string) {
    setMsg(t);
    setTimeout(() => setMsg(''), 3000);
  }

  function searchBlogs(e: any) {
    e.preventDefault();
    if (!query.trim()) return;
    
    setSearched(true);
    const q = query.toLowerCase();

    // Search Title, Primary Keyword, and Content
    const found = allBlogs.filter((b) => {
      const matchTitle = b.title?.toLowerCase().includes(q);
      const matchKeyword = b.primary_keyword?.toLowerCase().includes(q);
      const matchContent = b.content?.toLowerCase().includes(q);
      return matchTitle || matchKeyword || matchContent;
    });

    setResults(found);
  }

  function copyLink(slug: string) {
    const url = `https://farmingtechbusiness.com/blog/${slug}`;
    const html = `<a href="${url}">${url}</a>`;
    // We copy just the URL for the markdown engine to use
    navigator.clipboard.writeText(url);
    flash('🔗 Link copied to clipboard!');
  }

  function copyMarkdown(title: string, slug: string) {
    const markdown = `[${title}](/blog/${slug})`;
    navigator.clipboard.writeText(markdown);
    flash('📋 Markdown link copied!');
  }

  if (!loaded) return <p className="text-center p-10">Loading...</p>;
  if (!admin) return <p className="text-center p-10">Admin access only.</p>;

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-forest-800">🔍 Blog Search & Interlinker</h1>
        <p className="text-xs text-gray-500">Find articles to link to using exact keywords.</p>
        {msg && <p className="text-xs font-bold text-green-700 mt-1">{msg}</p>}
      </div>

      {/* SEARCH FORM */}
      <form onSubmit={searchBlogs} className="glass-card p-4 rounded-2xl space-y-3">
        <input 
          className="w-full p-3 rounded-xl border border-gray-200 bg-white/70 text-sm" 
          placeholder="Search keyword (e.g., 'rabbit feed', 'poultry', 'incubator')..." 
          value={query} 
          onChange={(e) => setQuery(e.target.value)} 
        />
        <button type="submit" className="w-full bg-forest-600 text-white py-3 rounded-xl font-extrabold text-sm shadow-md">
          🔍 SEARCH ALL ARTICLES
        </button>
      </form>

      {/* RESULTS */}
      {searched && (
        <div className="space-y-4">
          <p className="text-sm font-extrabold text-forest-700">
            Found {results.length} articles containing "{query}"
          </p>
          
          {results.map((r) => (
            <div key={r.id} className="glass-card bg-white border border-gray-100 p-4 rounded-2xl shadow-sm space-y-2">
              <div>
                <span className="text-[9px] font-bold text-forest-600 bg-forest-50 px-2 py-1 rounded-md uppercase">{r.category}</span>
                <h3 className="text-sm font-extrabold text-forest-900 mt-2">{r.title}</h3>
              </div>
              
              <div className="flex gap-2 mt-2">
                <button onClick={() => copyMarkdown(r.title, r.slug)} className="flex-1 bg-forest-600 text-white py-2 rounded-lg text-xs font-bold active:scale-95 transition-transform">
                  📋 Copy Markdown Link
                </button>
                <button onClick={() => copyLink(r.slug)} className="flex-1 bg-gray-800 text-white py-2 rounded-lg text-xs font-bold active:scale-95 transition-transform">
                  🔗 Copy Raw URL
                </button>
              </div>
            </div>
          ))}

          {results.length === 0 && (
            <div className="text-center py-10">
              <p className="text-4xl mb-2">🕵️</p>
              <p className="text-sm font-bold text-forest-800">No articles found.</p>
              <p className="text-xs text-gray-500">Try a different keyword.</p>
            </div>
          )}
        </div>
      )}

      <div className="text-center">
        <Link href="/admin" className="text-xs font-bold text-forest-600 hover:underline">← Back to Admin Console</Link>
      </div>
    </div>
  );
}