import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { formatRelativeTime } from '@/lib/utils';

export const revalidate = 300;

export const metadata = {
  title: 'Daily Insight — Farming Tips & News',
  description: 'Daily articles on poultry, goats, fish, rabbits, pigs, crops and AI farming tools for African farmers.',
};

export default async function BlogListPage() {
  const supabase = createClient();
  const { data: posts } = await supabase
    .from('blogs')
    .select('slug, title, excerpt, cover_image_url, category, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(50);

  return (
    <div className="px-4 pt-4">
      <h1 className="app-heading mb-1">Daily Insight</h1>
      <p className="text-sm text-forest-400 mb-5">
        Fresh farming tips, disease alerts, and business ideas — every day.
      </p>

      {!posts?.length ? (
        <div className="glass-card p-8 text-center">
          <p className="text-forest-500 font-semibold">No posts published yet. Check back soon!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="glass-card flex gap-3 p-3">
              <div className="relative w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0">
                <Image
                  src={post.cover_image_url || '/images/placeholder-blog.jpg'}
                  alt={post.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0 py-1">
                {post.category && (
                  <span className="text-[10px] font-bold text-forest-600 uppercase tracking-wide">
                    {post.category}
                  </span>
                )}
                <p className="font-bold text-forest-900 dark:text-white leading-snug line-clamp-2 mt-0.5">
                  {post.title}
                </p>
                <p className="text-xs text-forest-400 mt-1">
                  {formatRelativeTime(post.published_at)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
