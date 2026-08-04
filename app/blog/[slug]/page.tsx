import Image from 'next/image';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { formatRelativeTime } from '@/lib/utils';
import CopyLinkButton from '@/components/blog/CopyLinkButton';
import type { Metadata } from 'next';

export const revalidate = 300;

interface Props {
  params: { slug: string };
}

async function getPost(slug: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from('blogs')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();
  return data;
}

// Dynamic SEO metadata per post — this is what makes each shared link
// show a proper title/description/image preview on WhatsApp, Facebook, etc.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost(params.slug);
  if (!post) return { title: 'Post not found' };

  return {
    title: post.seo_title || post.title,
    description: post.seo_description || post.excerpt,
    openGraph: {
      title: post.seo_title || post.title,
      description: post.seo_description || post.excerpt,
      images: post.cover_image_url ? [post.cover_image_url] : [],
      type: 'article',
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getPost(params.slug);
  if (!post) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.vercel.app';
  const postUrl = `${siteUrl}/blog/${post.slug}`;

  // Fire-and-forget view counter — doesn't block render
  const supabase = createClient();
  supabase.rpc('increment_blog_views', { post_id: post.id }).then(() => {});

  return (
    <article className="pb-6">
      <div className="relative w-full h-56">
        <Image
          src={post.cover_image_url || '/images/placeholder-blog.jpg'}
          alt={post.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-900/60 to-transparent" />
        {post.category && (
          <span className="absolute top-4 left-4 bg-forest-900/80 text-white text-xs font-bold px-3 py-1.5 rounded-full">
            {post.category}
          </span>
        )}
      </div>

      <div className="px-4 pt-5">
        <h1 className="text-2xl font-extrabold text-forest-900 dark:text-white leading-tight">
          {post.title}
        </h1>
        <p className="text-sm text-forest-400 mt-2">{formatRelativeTime(post.published_at)}</p>

        <div className="mt-5">
          <CopyLinkButton url={postUrl} title={post.title} />
        </div>

        {/* Rich HTML content from the admin's editor, rendered safely.
            Content only ever originates from admin-authored posts (RLS-gated insert/update),
            so this is a trusted internal source, not arbitrary user input. */}
        <div
          className="prose prose-forest max-w-none mt-6 text-forest-800 dark:text-forest-100 [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:mt-6 [&_h2]:mb-2 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mt-4 [&_p]:leading-relaxed [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1 [&_blockquote]:border-l-4 [&_blockquote]:border-forest-400 [&_blockquote]:pl-4 [&_blockquote]:italic [&_img]:rounded-2xl"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-6">
            {post.tags.map((tag: string) => (
              <span key={tag} className="text-xs font-semibold text-forest-600 bg-forest-100 dark:bg-forest-800 dark:text-forest-200 px-3 py-1.5 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-forest-100 dark:border-forest-800">
          <p className="text-sm font-bold text-forest-800 dark:text-forest-100 mb-3">Share this post</p>
          <CopyLinkButton url={postUrl} title={post.title} />
        </div>
      </div>
    </article>
  );
}
