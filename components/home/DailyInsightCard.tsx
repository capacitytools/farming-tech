import Link from 'next/link';
import Image from 'next/image';
import { Newspaper, ArrowRight } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

export interface InsightPost {
  slug: string;
  title: string;
  excerpt: string;
  cover_image_url: string | null;
  category: string | null;
  published_at: string;
}

export default function DailyInsightCard({ posts }: { posts: InsightPost[] }) {
  if (!posts?.length) return null;
  const [featured, ...rest] = posts;

  return (
    <section className="px-4 pt-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="app-heading flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-forest-600" />
          Daily Insight
        </h2>
        <Link href="/blog" className="text-sm font-bold text-forest-600 dark:text-gold-400 flex items-center gap-0.5">
          See all <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <Link href={`/blog/${featured.slug}`} className="glass-card block overflow-hidden mb-3">
        <div className="relative w-full h-40">
          <Image
            src={featured.cover_image_url || '/images/placeholder-blog.jpg'}
            alt={featured.title}
            fill
            className="object-cover"
          />
          {featured.category && (
            <span className="absolute top-3 left-3 bg-forest-900/80 text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
              {featured.category}
            </span>
          )}
        </div>
        <div className="p-4">
          <p className="font-bold text-forest-900 dark:text-white leading-snug line-clamp-2">
            {featured.title}
          </p>
          <p className="text-xs text-forest-400 mt-1">{formatRelativeTime(featured.published_at)}</p>
        </div>
      </Link>

      <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4">
        {rest.slice(0, 5).map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="glass-card-sm flex-shrink-0 w-40 overflow-hidden"
          >
            <div className="relative w-full h-24">
              <Image
                src={post.cover_image_url || '/images/placeholder-blog.jpg'}
                alt={post.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-2.5">
              <p className="text-xs font-bold text-forest-900 dark:text-white leading-snug line-clamp-2">
                {post.title}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
