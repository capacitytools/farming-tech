import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://farmingtechbusiness.com';

function sb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

async function getProfileData(username: string) {
  const supabase = sb();
  
  // Find the user
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, bio, username')
    .or(`username.eq.${username},id.eq.${username}`)
    .single();
    
  if (!profile) return null;

  // Fetch their published posts
  const { data: posts } = await supabase
    .from('blogs')
    .select('slug, title, cover_image_url, category, created_at, views_count')
    .eq('author_id', profile.id)
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  return { profile, posts: posts || [] };
}

export async function generateMetadata({ params }: { params: { username: string } }) {
  const d = await getProfileData(params.username);
  if (!d) return { title: 'Blog not found' };
  return {
    title: `${d.profile.full_name || 'Farmer'}'s Blog | Farming Tech & Business`,
    description: d.profile.bio || `Read the latest agricultural insights from ${d.profile.full_name}`,
  };
}

export default async function UserProfilePage({ params }: { params: { username: string } }) {
  const d = await getProfileData(params.username);
  if (!d) return <div className="p-10 text-center font-bold text-forest-800">This blog does not exist.</div>;

  const { profile, posts } = d;

  return (
    <div className="pb-24 max-w-2xl mx-auto bg-gray-50 min-h-screen">
      
      {/* PROFILE HEADER */}
      <div className="bg-gradient-to-br from-forest-700 to-forest-900 text-white p-6 rounded-b-3xl shadow-md text-center">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="w-20 h-20 rounded-full border-4 border-white mx-auto object-cover" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-forest-600 border-4 border-white mx-auto flex items-center justify-center text-2xl font-bold">
            {profile.full_name?.[0] || 'F'}
          </div>
        )}
        <h1 className="text-2xl font-extrabold mt-3">{profile.full_name || 'Farmer'}</h1>
        <p className="text-xs text-forest-200 mt-1 max-w-sm mx-auto">{profile.bio || 'Sharing practical farming knowledge to help you grow.'}</p>
      </div>

      {/* POSTS LIST */}
      <div className="p-4 space-y-4 mt-2">
        <h2 className="text-sm font-extrabold text-gray-500 uppercase tracking-wider border-b pb-2">Latest Articles</h2>
        
        {posts.map(post => (
          <Link 
            key={post.slug} 
            href={`/u/${params.username}/${post.slug}`}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm flex overflow-hidden active:scale-95 transition-transform"
          >
            <div className="w-28 shrink-0 bg-gray-100 relative">
              {post.cover_image_url ? (
                <img src={post.cover_image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl opacity-50">🌾</div>
              )}
            </div>
            <div className="p-3 flex-1 flex flex-col justify-center">
              <p className="text-[9px] font-bold text-forest-600 uppercase tracking-widest">{post.category}</p>
              <h3 className="text-sm font-extrabold text-forest-900 line-clamp-2 leading-tight mt-1">{post.title}</h3>
              <p className="text-[10px] text-gray-400 mt-2">{new Date(post.created_at).toLocaleDateString()} · 👁️ {post.views_count || 0}</p>
            </div>
          </Link>
        ))}

        {posts.length === 0 && (
          <div className="text-center py-10">
            <p className="text-4xl mb-2">🌱</p>
            <p className="text-sm font-bold text-gray-500">No articles published yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}