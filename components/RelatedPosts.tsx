import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function RelatedPosts({ category, currentId }: { category: string; currentId: string }) {
  const supabase = createClient();
  
  // Try to find posts in the same category
  let { data: related } = await supabase
    .from("blogs")
    .select("title, slug, cover_image_url, category")
    .eq("status", "published")
    .eq("category", category)
    .neq("id", currentId)
    .limit(3);

  // If less than 2 found, just grab the newest posts
  if (!related || related.length < 2) {
    const { data: fallback } = await supabase
      .from("blogs")
      .select("title, slug, cover_image_url, category")
      .eq("status", "published")
      .neq("id", currentId)
      .order("created_at", { ascending: false })
      .limit(3);
    related = fallback || [];
  }

  if (!related || related.length === 0) return null;

  return (
    <div className="mt-8 pt-6 border-t border-gray-200">
      <h2 className="text-xl font-bold mb-4">📖 Keep Reading</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {related.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="glass-card p-3 rounded-2xl flex gap-3 items-center active:scale-[0.98] transition-transform">
            {post.cover_image_url ? (
              <img src={post.cover_image_url} alt={post.title} className="w-16 h-16 object-cover rounded-xl flex-shrink-0" />
            ) : (
              <div className="w-16 h-16 bg-forest-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">📰</div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm line-clamp-2">{post.title}</p>
              <p className="text-xs text-green-600 font-bold mt-1">{post.category}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}