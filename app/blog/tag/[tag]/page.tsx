import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function TagPage(props: any) {
  const params = await props.params;
  const tag = decodeURIComponent(params.tag);
  const supabase = createClient();
  const { data: posts } = await supabase.from("blogs").select("*").eq("status", "published").order("published_at", { ascending: false });

  const filtered = (posts || []).filter((p: any) => (p.tags || "").toLowerCase().includes(tag.toLowerCase()));

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">🏷️ #{tag}</h1>
      <p className="text-gray-600 text-sm mb-6">{filtered.length} article{filtered.length === 1 ? "" : "s"} about {tag}</p>
      <div className="space-y-4">
        {filtered.map((post: any) => (
          <Link key={post.id} href={`/blog/${post.slug}`} className="glass-card p-4 rounded-2xl flex gap-4">
            {post.cover_image_url ? (
              <img src={post.cover_image_url} alt={post.title} className="w-24 h-24 object-cover rounded-xl flex-shrink-0" />
            ) : (
              <div className="w-24 h-24 bg-forest-100 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">📰</div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-lg leading-tight mb-2 line-clamp-2">{post.title}</h2>
              <p className="text-xs text-gray-500 line-clamp-2">{post.excerpt}</p>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && <p className="text-center text-gray-500 py-10">No articles for this tag yet.</p>}
      </div>
    </div>
  );
}