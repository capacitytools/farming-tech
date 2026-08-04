import { createClient } from '@/lib/supabase/server';
import QuickScanWidget from '@/components/home/QuickScanWidget';
import DailyInsightCard from '@/components/home/DailyInsightCard';
import MarketPricesWidget from '@/components/home/MarketPricesWidget';
import TribesRail from '@/components/home/TribesRail';

export const revalidate = 300; // ISR: refresh home dashboard every 5 minutes

export default async function HomePage() {
  const supabase = createClient();

  const [{ data: blogs }, { data: tribes }] = await Promise.all([
    supabase
      .from('blogs')
      .select('slug, title, excerpt, cover_image_url, category, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(6),
    supabase
      .from('tribes')
      .select('slug, name, icon, member_count')
      .order('member_count', { ascending: false }),
  ]);

  return (
    <div>
      {/* Greeting header */}
      <div className="px-4 pt-4">
        <p className="text-sm text-forest-400 font-medium">Good day 👋</p>
        <h1 className="text-2xl font-extrabold text-forest-900 dark:text-white">
          Grow smarter, sell faster.
        </h1>
      </div>

      <QuickScanWidget />
      <TribesRail tribes={tribes ?? []} />
      <MarketPricesWidget />
      <DailyInsightCard posts={blogs ?? []} />

      {/* Bottom CTA strip */}
      <section className="px-4 pt-6">
        <div className="glass-card p-5 text-center">
          <p className="font-bold text-forest-900 dark:text-white mb-1">
            Sell livestock or teach farmers?
          </p>
          <p className="text-xs text-forest-500 mb-3">
            Apply to become a verified Seller or Expert Teacher on the platform.
          </p>
          <a href="/profile" className="btn-primary inline-flex w-full">
            Apply Now
          </a>
        </div>
      </section>
    </div>
  );
}
