'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function BlogControlRoom() {
  const [admin, setAdmin] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [msg, setMsg] = useState('');

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      setAdmin(p?.role === 'admin' || p?.role === 'editor');
    }

    const { data: b } = await supabase
      .from('blogs')
      .select('id,title,slug,category,cover_image_url,status,views_count,meta_description,excerpt')
      .order('created_at', { ascending: false });

    setBlogs(b || []);
    setLoaded(true);
  }

  useEffect(() => { load(); }, []);

  function flash(t: string) {
    setMsg(t);
    setTimeout(() => setMsg(''), 3000);
  }

  async function deleteBlog(id: string) {
    if (!window.confirm('Delete this post permanently?')) return;
    const supabase = createClient();
    const { error } = await supabase.from('blogs').delete().eq('id', id);
    if (error) alert('Error deleting: ' + error.message);
    else load();
  }

  async function toggleStatus(id: string, currentStatus: string) {
    const supabase = createClient();
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    const { error } = await supabase.from('blogs').update({ status: newStatus }).eq('id', id);
    if (error) alert('Error updating status: ' + error.message);
    else load();
  }

  function copyLink(slug: string) {
    const url = `https://www.farmingtechbusiness.com/blog/${slug}`;
    navigator.clipboard.writeText(url);
    flash('🔗 Link copied to clipboard!');
  }

  function shareToPinterest(blog: any) {
    if (!blog.cover_image_url) return alert('You need a cover image to pin this article!');
    const articleUrl = `https://www.farmingtechbusiness.com/blog/${blog.slug}`;
    const description = blog.meta_description || blog.excerpt || blog.title;
    const media = blog.cover_image_url;
    const pinterestUrl = `https://www.pinterest.com/pin-builder/?url=${encodeURIComponent(articleUrl)}&media=${encodeURIComponent(media)}&description=${encodeURIComponent(description)}`;
    window.open(pinterestUrl, '_blank');
  }

  function shareToFacebook(blog: any) {
    const articleUrl = `https://www.farmingtechbusiness.com/blog/${blog.slug}`;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`;
    window.open(facebookUrl, '_blank');
  }

  if (!loaded) return <p className="text-center p-10">Loading...</p>;
  if (!admin) return <p className="text-center p-10">Admin access only.</p>;

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-4">
      
      <div>
        <h1 className="text-2xl font-extrabold text-forest-800">📰 Blog Control Room</h1>
        <p className="text-xs text-gray-500">Manage, view, and share your articles.</p>
        {msg && <p className="text-xs font-bold text-green-700 mt-1">{msg}</p>}
      </div>

      <div className="space-y-2">
        <Link href="/admin/article-engine" className="block w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-2xl font-bold shadow-lg text-center text-sm active:scale-95 transition-transform">
          🧠 OPEN THE AI ARTICLE & SEO ENGINE →
        </Link>

        <Link href="/admin/quick-post" className="block w-full bg-amber-100 text-amber-900 border-2 border-amber-400 p-3 rounded-2xl font-bold text-center text-sm active:scale-95 transition-transform">
          ⚡ Quick Post (Fast Publish)
        </Link>
      </div>

      <div className="space-y-4 mt-6">
        {blogs.map((b) => (
          <div key={b.id} className="glass-card bg-white p-3 rounded-2xl flex flex-col gap-3 border border-gray-100 shadow-sm">
            
            <div className="flex gap-3 items-center">
              <div className="w-16 h-16 shrink-0 bg-gray-100 rounded-xl overflow-hidden relative">
                {b.cover_image_url && <img src={b.cover_image_url} alt={b.title} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-extrabold text-forest-900 line-clamp-2 leading-tight">{b.title}</p>
                <p className="text-[10px] text-gray-500 mt-1 font-semibold">
                  {b.category} · 👁️ {b.views_count || 0} · 
                  <span className={`ml-1 font-bold ${b.status === 'published' ? 'text-green-600' : 'text-amber-500'}`}>
                    {b.status}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Link 
                href={`/blog/${b.slug}`} 
                target="_blank"
                className="flex-1 bg-blue-50 text-blue-700 py-2 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1 active:scale-95 transition-transform"
              >
                👁️ View Live
              </Link>
              <button 
                onClick={() => copyLink(b.slug)} 
                className="flex-1 bg-purple-50 text-purple-700 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition-transform"
              >
                🔗 Copy Link
              </button>
            </div>

            <div className="flex gap-2 bg-gray-50 p-2 rounded-xl">
              <p className="text-[10px] font-bold text-gray-400 self-center uppercase tracking-widest pl-1">Share:</p>
              <button onClick={() => shareToPinterest(b)} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 active:scale-95 transition-transform shadow-sm">
                📌 Auto-Pin
              </button>
              <button onClick={() => shareToFacebook(b)} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 active:scale-95 transition-transform shadow-sm">
                f Share to FB
              </button>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => toggleStatus(b.id, b.status)} 
                className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 ${b.status === 'published' ? 'border-amber-300 text-amber-700 bg-amber-50' : 'border-green-300 text-green-700 bg-green-50'}`}
              >
                {b.status === 'published' ? 'Set as Draft' : 'Publish Now'}
              </button>
              
              {/* 🚨 UPDATED: Now links to the new Edit Page 🚨 */}
              <Link 
                href={`/admin/blogs/edit/${b.id}`} 
                className="w-12 bg-gray-100 text-gray-700 rounded-xl text-lg flex items-center justify-center active:scale-95"
              >
                ✏️
              </Link>
              
              <button 
                onClick={() => deleteBlog(b.id)} 
                className="w-12 bg-red-50 text-red-500 rounded-xl text-lg flex items-center justify-center active:scale-95"
              >
                🗑️
              </button>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}