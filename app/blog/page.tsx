import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function BlogPage(props: any) {
  const searchParams = await props.searchParams;
  const cat = searchParams?.category;

  const supabase = createClient();
  const { data: allPosts } = await supabase
    .from("blogs")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const { data: comments } = await supabase.from("blog_comments").select("blog_id");
  const countMap: any = {};
  (comments || []).forEach((c: any) => {
    countMap[c.blog_id] = (countMap[c.blog_id] || 0) + 1;
  });

  const categories = ["All", ...Array.from(new Set((allPosts || []).map((p: any) => p.category).filter(Boolean)))];
  const posts = cat && cat !== "All" ? (allPosts || []).filter((p: any) => p.category === cat) : allPosts || [];

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">📰 Daily Insights</h1>

      <div className="flex gap-2 mb-5 overflow-x-auto pb-2">
        {categories.map((c: any) => (
          <Link
            key={c}
            href={c === "All" ? "/blog" : `/blog?category=${encodeURIComponent(c)}`}
            className={`px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap ${cat === c || (c === "All" && !cat) ? "bg-green-600 text-white" : "bg-gray-200 text-gray-700"}`}
          >
            {c}
          </Link>
        ))}
      </div>

      <div className="space-y-4">
        {posts.map((post: any) => (
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
                <span>👁️ {post.views_count || 0}</span>
                <span>💬 {countMap[post.id] || 0}</span>
              </div>
            </div>
          </Link>
        ))}
        {posts.length === 0 && <p className="text-center text-gray-500 py-10">No articles in this category yet.</p>}
      </div>
    </div>
  );
}