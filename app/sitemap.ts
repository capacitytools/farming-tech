import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

// 🚨 FIXED: Hardcoded the new primary domain
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://farmingtechbusiness.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  // Grab all published articles
  const { data } = await supabase
    .from('blogs')
    .select('slug, updated_at, created_at, indexable, status')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  // Map articles to sitemap format
  const posts = (data || [])
    .filter((b: any) => b.indexable !== false && b.slug) // Ensure slug exists
    .map((b: any) => ({
      url: SITE + '/blog/' + b.slug,
      lastModified: new Date(b.updated_at || b.created_at || Date.now()),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

  // Static pages (Primary traffic drivers)
  const statics = [
    '', // Homepage
    '/feed', 
    '/blog', 
    '/ebooks', 
    '/market', 
    '/bills', 
    '/communities', 
    '/scanner',
    '/ai-farm' // Added the new AI Farm hub
  ].map((p) => ({
    url: SITE + p,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: p === '' ? 1 : 0.7, // Homepage gets highest priority
  }));

  return [...statics, ...posts];
}