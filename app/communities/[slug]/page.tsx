'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import VideoCard from '@/components/VideoCard';
import VideoComposer from '@/components/VideoComposer';

export default function TribePage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [tribe, setTribe] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [loaded, setLoaded] = useState(false);
  
  // Post Composer State
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data: { user: u } } = await supabase.auth.getUser();
    setUser(u);

    // 1. Fetch Tribe Data
    const { data: t, error } = await supabase.from('tribes').select('*').eq('slug', params.slug).single();
    if (!t || error) return router.push('/communities');
    setTribe(t);

    // 2. Check Membership
    if (u) {
      const { data: member } = await supabase.from('tribe_members').select('id').eq('tribe_id', t.id).eq('user_id', u.id).single();
      setIsMember(!!member);
    }

    // 3. Fetch Tribe Posts
    const { data: p } = await supabase
      .from('tribe_posts')
      .select('*, profiles(full_name, avatar_url)')
      .eq('tribe_id', t.id)
      .order('created_at', { ascending: false });
    setPosts(p || []);

    // 4. Fetch Tribe Videos
    const { data: v } = await supabase
      .from('videos')
      .select('*, profiles(full_name, avatar_url)')
      .eq('context', 'tribe')
      .eq('tribe_id', t.id) // Ensure your database supports this column, if not, it will just fetch all tribe videos
      .order('created_at', { ascending: false });
    setVideos(v || []);

    setLoaded(true);
  }

  useEffect(() => {
    load();
  }, [params.slug]);

  async function joinTribe() {
    if (!user) return alert('Log in to join.');
    const supabase = createClient();
    await supabase.from('tribe_members').insert({ tribe_id: tribe.id, user_id: user.id });
    setIsMember(true);
    load();
  }

  async function submitPost() {
    if (!content.trim() || !user) return;
    setBusy(true);
    const supabase = createClient();
    
    await supabase.from('tribe_posts').insert({
      tribe_id: tribe.id,
      author_id: user.id,
      content: content.trim(),
    });
    
    setContent('');
    await load();
    setBusy(false);
  }

  if (!loaded) return <p className="text-center p-10">Loading tribe...</p>;
  if (!tribe) return null;

  const canPost = isMember || user?.id === tribe.creator_id;

  return (
    <div className="pb-24 max-w-2xl mx-auto min-h-screen bg-gray-50">
      
      {/* HEADER */}
      <div className="relative h-48 bg-forest-800">
        {tribe.image_url && <img src={tribe.image_url} alt={tribe.name} className="w-full h-full object-cover opacity-60" />}
        <div className="absolute inset-0 p-4 flex flex-col justify-end text-white">
          <h1 className="text-3xl font-extrabold">{tribe.name}</h1>
          <p className="text-xs text-forest-200">{tribe.description || 'Welcome to the tribe.'}</p>
        </div>
      </div>

      {/* MEMBERSHIP BAR */}
      <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center">
        <p className="text-sm font-bold text-gray-700">👥 {tribe.member_count || 0} Members</p>
        {!isMember && (
          <button onClick={joinTribe} className="bg-forest-600 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-md">
            Join Tribe
          </button>
        )}
      </div>

      {/* POST COMPOSER */}
      {canPost && (
        <div className="p-4 bg-white border-b border-gray-200">
          <textarea
            className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-forest-500 outline-none"
            rows={3}
            placeholder={`Share something with ${tribe.name}...`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="flex justify-end mt-2">
            <button onClick={submitPost} disabled={busy} className="bg-forest-600 text-white px-6 py-2 rounded-xl text-sm font-bold disabled:opacity-50">
              {busy ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      )}

      {/* FEED */}
      <div className="p-4 space-y-4">
        
        {/* 🚨 VIDEO COMPOSER SECTION 🚨 */}
        {canPost && (
          <div>
            <button onClick={() => setShowComposer(!showComposer)} className="w-full bg-forest-100 text-forest-800 border-2 border-forest-300 py-3 rounded-xl text-sm font-bold shadow-sm active:scale-95 transition-transform">
              🎬 Post YouTube Video / Reel to {tribe.name}
            </button>
            
            {/* The exact line that was causing the error is fixed here */}
            {showComposer && (
              <div className="mt-2">
                <VideoComposer 
                  context="tribe" 
                  initialAspect="portrait" 
                  onDone={() => { setShowComposer(false); load(); }} 
                />
              </div>
            )}
          </div>
        )}

        {/* VIDEOS */}
        {videos.map((v) => (
          <div key={v.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <VideoCard video={v} />
          </div>
        ))}

        {/* TEXT POSTS */}
        {posts.map((post) => (
          <div key={post.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              {post.profiles?.avatar_url ? (
                <img src={post.profiles.avatar_url} alt="" className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-forest-200 flex items-center justify-center text-xs font-bold text-forest-800">
                  {post.profiles?.full_name?.[0] || 'F'}
                </div>
              )}
              <p className="text-sm font-bold text-gray-800">{post.profiles?.full_name || 'Farmer'}</p>
              <p className="text-[10px] text-gray-400 ml-auto">{new Date(post.created_at).toLocaleDateString()}</p>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-line">{post.content}</p>
          </div>
        ))}

        {posts.length === 0 && videos.length === 0 && (
          <div className="text-center py-10">
            <p className="text-3xl mb-2">🌱</p>
            <p className="text-sm font-bold text-gray-600">No posts yet.</p>
            <p className="text-xs text-gray-400">Be the first to share in this tribe!</p>
          </div>
        )}
      </div>
    </div>
  );
}