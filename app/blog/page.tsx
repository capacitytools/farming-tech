import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function BlogPage() {
  const supabase = createClient();
  const { data: posts } = await supabase
    .from("blogs")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">📰 Daily Insights</h1>
      <div className="space-y-4">
        {(posts || []).map((post) => (
          <Link key={post.id} href={`/blog/${post.slug}`} className="glass-card p-4 rounded-2xl flex gap-4 active:scale-[0.98] transition-transform">
            {post.cover_image_url ? (
              <img src={post.cover_image_url} alt={post.title} className="w-24 h-24 object-cover rounded-xl flex-shrink-0" />
            ) : (
              <div className="w-24 h-24 bg-forest-100 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">📰</div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-green-600 font-bold mb-1">{post.category}</p>
              <h2 className="font-bold text-lg leading-tight mb-2 line-clamp-2">{post.title}</h2>
              <p className="text-xs text-gray-500 line-clamp-2 mb-2">{post.excerpt}</p>
              <div className="flex items-center gap-3 text-[10px] text-gray-400 font-semibold">
                <span>📅 {new Date(post.published_at || post.created_at).toLocaleDateString()}</span>
                <span>👁️ {post.views_count || 0} views</span>
              </div>
            </div>
          </Link>
        ))}
        {(!posts || posts.length === 0) && <p className="text-center text-gray-500 py-10">No articles published yet.</p>}
      </div>
    </div>
  );
}