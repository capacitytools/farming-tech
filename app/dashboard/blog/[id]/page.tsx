'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function CreatorStudio({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [blog, setBlog] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalViews: 0, totalPosts: 0 });
  const [loaded, setLoaded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/login');

      const { data: b } = await supabase.from('user_blogs').select('*').eq('id', params.id).eq('owner_id', user.id).single();
      if (!b) return router.push('/dashboard/blog');
      setBlog(b);

      const { data: p } = await supabase.from('blogs').select('*').eq('blog_id', params.id).order('created_at', { ascending: false });
      const postsData = p || [];
      setPosts(postsData);
      
      const views = postsData.reduce((acc, curr) => acc + (curr.views_count || 0), 0);
      setStats({ totalViews: views, totalPosts: postsData.length });

      setLoaded(true);
    }
    load();
  }, [params.id, router]);

  if (!loaded) return <p className="text-center p-10">Loading Studio...</p>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      
      {/* 🚨 TOP BAR WITH DROPDOWN MENU 🚨 */}
      <header className="bg-forest-900 text-white p-4 sticky top-0 z-20">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-[10px] text-forest-300 uppercase tracking-widest">Creator Studio</p>
            <h1 className="text-xl font-extrabold">{blog.name}</h1>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="bg-forest-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
            Menu {menuOpen ? '▲' : '▼'}
          </button>
        </div>

        {/* THE DROPDOWN MENU */}
        {menuOpen && (
          <div className="absolute top-16 right-4 w-64 bg-white text-gray-800 rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
            
            <div className="p-4 border-b bg-gray-50">
              <p className="text-[10px] font-bold text-gray-500 uppercase">Active Theme</p>
              <Link href="/dashboard/blog/theme" className="text-sm text-blue-600 font-bold">Change Theme ({blog.theme_id}) →</Link>
            </div>
            
            <Link href={`/dashboard/blog/${blog.id}/new`} className="block p-3 text-sm font-bold border-b hover:bg-gray-50">✍️ Create Post</Link>
            <Link href={`/dashboard/blog/${blog.id}/media`} className="block p-3 text-sm font-bold border-b hover:bg-gray-50">🖼️ Media Library</Link>
            
            {/* 🚨 THE NEW MONETIZATION SECTION 🚨 */}
            <div className="bg-amber-50 border-y border-amber-200">
              <p className="px-3 pt-3 pb-1 text-[10px] font-extrabold text-amber-700 uppercase tracking-wider">💰 Monetization</p>
              <Link href="/dashboard/affiliates" className="block p-3 text-sm font-bold hover:bg-amber-100 text-amber-900">🔗 Affiliate Vault</Link>
              <Link href={`/dashboard/blog/${blog.id}/earnings`} className="block p-3 text-sm font-bold hover:bg-amber-100 text-amber-900">📊 Earnings & Ads</Link>
              <Link href={`/dashboard/blog/${blog.id}/ebooks`} className="block p-3 text-sm font-bold hover:bg-amber-100 text-amber-900">📚 My E-books</Link>
              <Link href={`/dashboard/blog/${blog.id}/payouts`} className="block p-3 text-sm font-bold hover:bg-amber-100 text-amber-900">🏦 Payout Settings</Link>
            </div>

            <Link href={`/dashboard/blog/${blog.id}/analytics`} className="block p-3 text-sm font-bold border-b hover:bg-gray-50">📈 Real Analytics</Link>
            <Link href={`/dashboard/blog/${blog.id}/settings`} className="block p-3 text-sm font-bold hover:bg-gray-50">⚙️ Settings</Link>
          </div>
        )}
      </header>

      {/* ANALYTICS CARDS */}
      <div className="p-4 grid grid-cols-2 gap-3 mt-2">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
          <p className="text-3xl font-extrabold text-forest-800">{stats.totalViews}</p>
          <p className="text-[10px] font-bold text-gray-500 uppercase mt-1">Total Views</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
          <p className="text-3xl font-extrabold text-forest-800">{stats.totalPosts}</p>
          <p className="text-[10px] font-bold text-gray-500 uppercase mt-1">Total Posts</p>
        </div>
      </div>

      {/* POSTS LIST */}
      <div className="p-4 space-y-3">
        <h2 className="text-sm font-extrabold text-gray-700 mb-2">Recent Posts</h2>
        {posts.map(p => (
          <div key={p.id} className="bg-white p-3 rounded-2xl flex justify-between items-center shadow-sm border border-gray-100">
            <div>
              <p className="text-sm font-bold text-forest-900 line-clamp-1">{p.title}</p>
              <p className="text-[10px] text-gray-500">👁️ {p.views_count || 0} views</p>
            </div>
            <Link href={`/dashboard/blog/${blog.id}/edit/${p.id}`} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg">Edit</Link>
          </div>
        ))}
        {posts.length === 0 && <p className="text-center text-gray-500 text-sm">No posts yet.</p>}
      </div>

      {/* FARMING TECH BRANDING */}
      <div className="text-center mt-12 mb-4">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Powered By</p>
        <p className="text-lg font-extrabold text-forest-800">Farming Tech & Business</p>
        <p className="text-[10px] font-bold text-gray-400">© 2026</p>
      </div>
    </div>
  );
}