import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://farming-tech.vercel.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data } = await supabase
    .from('blogs')
    .select('slug, updated_at, created_at, indexable, status')
    .eq('status', 'published');

  const posts = (data || [])
    .filter((b: any) => b.indexable !== false)
    .map((b: any) => ({
      url: SITE + '/blog/' + b.slug,
      lastModified: new Date(b.updated_at || b.created_at || Date.now()),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

  const statics = ['/', '/feed', '/blog', '/ebooks', '/market', '/bills', '/communities', '/scanner'].map((p) => ({
    url: SITE + p,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: p === '/' ? 1 : 0.7,
  }));

  return [...statics, ...posts];
}