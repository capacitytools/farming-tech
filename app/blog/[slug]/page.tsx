import { createClient } from "@/lib/supabase/server";
import ShareBar from "@/components/ShareBar";

export default async function BlogPostPage(props: any) {
  const params = await props.params;
  const supabase = createClient();
  const { data: blog } = await supabase
    .from("blogs")
    .select("*, profiles(full_name)")
    .eq("slug", params.slug)
    .eq("status", "published")
    .single();

  if (!blog) return <div className="p-8 text-center text-gray-500">Post not found.</div>;

  await supabase.rpc("increment_blog_views", { post_id: blog.id });

  const url = `https://farming-tech.vercel.app/blog/${blog.slug}`;
  const date = blog.published_at
    ? new Date(blog.published_at).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })
    : "";

  return (
    <article className="p-4 pb-24 max-w-2xl mx-auto">
      {blog.cover_image_url && (
        <img src={blog.cover_image_url} alt={blog.title} className="w-full h-56 object-cover rounded-2xl mb-4" />
      )}
      <h1 className="text-2xl font-bold mb-2">{blog.title}</h1>
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-2">
        <span>📅 {date}</span>
        <span>👁️ {(blog.views_count || 0) + 1} views</span>
        {blog.category && (
          <span className="bg-forest-100 dark:bg-forest-800 text-forest-700 dark:text-forest-200 px-2 py-1 rounded-full font-semibold">
            {blog.category}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-500">By {blog.profiles?.full_name || "Site Admin"}</p>

      <ShareBar url={url} title={blog.title} />

      {blog.excerpt && <p className="text-gray-600 italic mb-4">{blog.excerpt}</p>}
      <div
        className="text-gray-800 leading-relaxed space-y-3 [&_img]:rounded-xl [&_img]:w-full [&_img]:my-3"
        dangerouslySetInnerHTML={{ __html: blog.content }}
      />
    </article>
  );
}