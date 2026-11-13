'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function UserBlogDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) return router.push('/login');
      setUser(u);

      // Fetch only THIS user's posts
      const { data } = await supabase
        .from('blogs')
        .select('*')
        .eq('author_id', u.id)
        .order('created_at', { ascending: false });
      
      setPosts(data || []);
      setLoaded(true);
    }
    load();
  }, [router]);

  if (!loaded) return <p className="text-center p-10">Loading...</p>;

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-6">
      
      {/* HEADER */}
      <div className="bg-gradient-to-br from-forest-700 to-forest-900 text-white p-5 rounded-b-3xl shadow-md">
        <h1 className="text-2xl font-extrabold">📝 My Blog</h1>
        <p className="text-[11px] text-forest-200 mt-0.5">Write, post, and make money.</p>
      </div>

      {/* 🚨 ACTION BUTTONS 🚨 */}
      <div className="grid grid-cols-3 gap-2">
        <Link href="/dashboard/blog/new" className="bg-forest-600 text-white p-3 rounded-2xl font-bold text-center text-xs shadow-md flex flex-col items-center justify-center gap-1">
          <span className="text-xl">✍️</span> New Post
        </Link>
        <Link href="/dashboard/affiliates" className="bg-amber-400 text-forest-900 p-3 rounded-2xl font-bold text-center text-xs shadow-md flex flex-col items-center justify-center gap-1">
          <span className="text-xl">🔗</span> Affiliates
        </Link>
        <Link href="/dashboard/blog/theme" className="bg-purple-600 text-white p-3 rounded-2xl font-bold text-center text-xs shadow-md flex flex-col items-center justify-center gap-1">
          <span className="text-xl">🎨</span> Themes
        </Link>
      </div>

      {/* POSTS LIST */}
      <div className="space-y-3">
        <h2 className="text-sm font-extrabold text-gray-700">My Published Articles</h2>
        
        {posts.map(p => (
          <div key={p.id} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex gap-3 items-center">
            {p.cover_image_url ? (
              <img src={p.cover_image_url} alt="" className="w-16 h-16 object-cover rounded-lg" />
            ) : (
              <div className="w-16 h-16 bg-forest-100 rounded-lg flex items-center justify-center text-2xl">📰</div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-extrabold text-forest-900 line-clamp-1">{p.title}</p>
              <p className="text-[10px] text-green-600 font-bold">👁️ {p.views_count || 0} views</p>
              <div className="flex gap-2 mt-2">
                <Link href={`/u/${user.user_metadata?.username || user.id}/${p.slug}`} target="_blank" className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded font-bold">View</Link>
                <button onClick={() => { navigator.clipboard.writeText(`https://www.farmingtechbusiness.com/u/${user.user_metadata?.username || user.id}/${p.slug}`); alert('Link copied!'); }} className="text-[10px] bg-purple-50 text-purple-600 px-2 py-1 rounded font-bold">Copy Link</button>
              </div>
            </div>
          </div>
        ))}
        {posts.length === 0 && <p className="text-center text-gray-500 text-sm py-10">You haven't written any posts yet.</p>}
      </div>
    </div>
  );
}