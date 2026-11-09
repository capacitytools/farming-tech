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

    // Fetch ALL blogs (drafts and published) for the admin view
    const { data: b } = await supabase
      .from('blogs')
      .select('id,title,slug,category,cover_image_url,status,views_count')
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

  if (!loaded) return <p className="text-center p-10">Loading...</p>;
  if (!admin) return <p className="text-center p-10">Admin access only.</p>;

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold text-forest-800">📰 Blog Control Room</h1>
        <p className="text-xs text-gray-500">Manage, view, and share your articles.</p>
        {msg && <p className="text-xs font-bold text-green-700 mt-1">{msg}</p>}
      </div>

      <div className="space-y-3 mt-4">
        {blogs.map((b) => (
          <div key={b.id} className="glass-card bg-white p-3 rounded-2xl flex flex-col gap-2 border border-gray-100 shadow-sm">
            
            {/* ARTICLE INFO */}
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

            {/* ACTION BUTTONS */}
            <div className="flex gap-2 mt-1">
              {/* View Live */}
              <Link 
                href={`/blog/${b.slug}`} 
                target="_blank"
                className="flex-1 bg-blue-50 text-blue-700 py-2 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1 active:scale-95 transition-transform"
              >
                👁️ View Live
              </Link>

              {/* Copy Link */}
              <button 
                onClick={() => copyLink(b.slug)} 
                className="flex-1 bg-purple-50 text-purple-700 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition-transform"
              >
                🔗 Copy Link
              </button>
            </div>

            {/* EDIT / DELETE / STATUS */}
            <div className="flex gap-2 mt-1">
              <button 
                onClick={() => toggleStatus(b.id, b.status)} 
                className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 ${b.status === 'published' ? 'border-amber-300 text-amber-700 bg-amber-50' : 'border-green-300 text-green-700 bg-green-50'}`}
              >
                {b.status === 'published' ? 'Set as Draft' : 'Publish Now'}
              </button>
              
              <Link 
                href={`/admin/article-engine?edit=${b.id}`} 
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