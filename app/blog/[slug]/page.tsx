import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ShareBar from "@/components/ShareBar";
import AdBanner from "@/components/AdBanner";

export async function generateMetadata(props: any): Promise<Metadata> {
  const params = await props.params;
  const supabase = createClient();
  const { data: post } = await supabase.from("blogs").select("*").eq("slug", params.slug).single();
  if (!post) return {};
  const url = `https://farming-tech.vercel.app/blog/${post.slug}`;
  return {
    title: post.seo_title || post.title,
    description: post.seo_description || post.excerpt,
    openGraph: {
      title: post.seo_title || post.title,
      description: post.seo_description || post.excerpt,
      images: post.cover_image_url ? [post.cover_image_url] : undefined,
      url,
    },
    twitter: {
      card: "summary_large_image",
      title: post.seo_title || post.title,
      description: post.seo_description || post.excerpt,
    },
  };
}

export default async function BlogPostPage(props: any) {
  const params = await props.params;
  const supabase = createClient();
  const { data: post } = await supabase
    .from("blogs")
    .select("*, profiles(full_name, avatar_url)")
    .eq("slug", params.slug)
    .single();

  if (!post || post.status !== "published") {
    return <div className="p-8 text-center text-gray-500">Post not found.</div>;
  }

  await supabase.from("blogs").update({ views_count: (post.views_count || 0) + 1 }).eq("id", post.id);

  const url = `https://farming-tech.vercel.app/blog/${post.slug}`;

  return (
    <article className="p-4 pb-24 max-w-2xl mx-auto">
      <p className="text-sm text-green-600 font-semibold mb-2">{post.category || "Farming"}</p>
      <h1 className="text-2xl font-bold mb-3">{post.title}</h1>
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
        <span>✍️ {post.profiles?.full_name || "Site Admin"}</span>
        <span>·</span>
        <span>📅 {new Date(post.published_at || post.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</span>
        <span>·</span>
        <span>👁️ {post.views_count || 0}</span>
      </div>
      {post.cover_image_url && (
        <img src={post.cover_image_url} alt={post.title} className="w-full h-56 object-cover rounded-2xl mb-4" />
      )}
      <ShareBar url={url} title={post.title} />

      <AdBanner type="native" />

      <div className="prose prose-sm max-w-none text-gray-800" dangerouslySetInnerHTML={{ __html: post.content }} />

      <AdBanner type="banner-300" />
      <AdBanner type="banner-320" />
    </article>
  );
}