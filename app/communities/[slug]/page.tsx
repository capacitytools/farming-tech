import Image from 'next/image';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { formatRelativeTime } from '@/lib/utils';
import NewTribePost from '@/components/communities/NewTribePost';
import type { Metadata } from 'next';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient();
  const { data: tribe } = await supabase
    .from('tribes')
    .select('name, description')
    .eq('slug', params.slug)
    .single();

  if (!tribe) return { title: 'Tribe not found' };
  return { title: `${tribe.name} Tribe`, description: tribe.description };
}

export default async function TribeFeedPage({ params }: Props) {
  const supabase = createClient();

  const { data: tribe } = await supabase
    .from('tribes')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (!tribe) notFound();

  const { data: posts } = await supabase
    .from('tribe_posts')
    .select('id, content, image_url, likes_count, comments_count, created_at, author_id, profiles(full_name, avatar_url)')
    .eq('tribe_id', tribe.id)
    .order('created_at', { ascending: false })
    .limit(30);

  return (
    <div className="px-4 pt-4">
      {/* Tribe header */}
      <div className="glass-card p-5 mb-5 text-center">
        <span className="text-5xl">{tribe.icon}</span>
        <h1 className="text-xl font-extrabold text-forest-900 dark:text-white mt-2">{tribe.name} Tribe</h1>
        <p className="text-sm text-forest-400 mt-1">{tribe.description}</p>
        <p className="text-xs font-bold text-forest-600 dark:text-gold-400 mt-2">
          {tribe.member_count?.toLocaleString() ?? 0} members
        </p>
      </div>

      <NewTribePost tribeId={tribe.id} />

      {!posts?.length ? (
        <div className="glass-card p-8 text-center">
          <p className="text-forest-500 font-semibold">
            No posts yet. Be the first to share something in {tribe.name}!
          </p>
        </div>
      ) : (
        <div className="space-y-4 pb-6">
          {posts.map((post: any) => (
            <div key={post.id} className="glass-card p-4">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-full bg-forest-100 dark:bg-forest-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {post.profiles?.avatar_url ? (
                    <Image src={post.profiles.avatar_url} alt="" width={36} height={36} className="object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-forest-600">
                      {post.profiles?.full_name?.[0]?.toUpperCase() ?? '?'}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-forest-900 dark:text-white">
                    {post.profiles?.full_name ?? 'Farmer'}
                  </p>
                  <p className="text-xs text-forest-400">{formatRelativeTime(post.created_at)}</p>
                </div>
              </div>

              <p className="text-sm text-forest-700 dark:text-forest-200 whitespace-pre-wrap">{post.content}</p>

              {post.image_url && (
                <div className="relative w-full h-56 mt-3 rounded-xl overflow-hidden">
                  <Image src={post.image_url} alt="" fill className="object-cover" />
                </div>
              )}

              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-forest-100 dark:border-forest-800">
                <span className="text-xs font-semibold text-forest-500">❤️ {post.likes_count ?? 0}</span>
                <span className="text-xs font-semibold text-forest-500">💬 {post.comments_count ?? 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
