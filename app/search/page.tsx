'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSearch(e: any) {
    e.preventDefault();
    if (!query.trim()) return;
    setBusy(true);

    const supabase = createClient();
    
    // Search across Blogs and User Blogs
    const { data: blogs } = await supabase
      .from('blogs')
      .select('id, title, slug, cover_image_url, author_name, blog_id')
      .ilike('title', `%${query}%`)
      .eq('status', 'published')
      .limit(10);

    setResults(blogs || []);
    setSearched(true);
    setBusy(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-forest-900 text-white p-6 rounded-b-3xl shadow-md sticky top-0 z-10">
        <h1 className="text-2xl font-extrabold mb-4">🔍 Search FTB</h1>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input 
            type="text" 
            placeholder="Search articles, topics, breeds..." 
            className="flex-1 p-3 rounded-xl text-black text-sm outline-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button disabled={busy} className="bg-amber-400 text-forest-900 px-5 rounded-xl font-extrabold text-sm">
            {busy ? '...' : 'Go'}
          </button>
        </form>
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-3 mt-4">
        {searched && results.length === 0 && (
          <div className="text-center py-10">
            <p className="text-4xl mb-2">🤷🏾</p>
            <p className="text-gray-500 font-bold">No results found for "{query}"</p>
          </div>
        )}

        {results.map((r) => {
          // If it has a blog_id, it's a user post. If not, it's an admin post.
          const link = r.blog_id ? `/dashboard/blog/${r.blog_id}` : `/blog/${r.slug}`;
          
          return (
            <Link key={r.id} href={link} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex gap-3 items-center">
              {r.cover_image_url ? (
                <img src={r.cover_image_url} alt="" className="w-14 h-14 object-cover rounded-lg" />
              ) : (
                <div className="w-14 h-14 bg-forest-100 rounded-lg flex items-center justify-center text-xl">📰</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-extrabold text-forest-900 line-clamp-2">{r.title}</p>
                <p className="text-[10px] text-gray-500 mt-1">By {r.author_name || 'Farming Tech'}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}