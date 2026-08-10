import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ShareBar from "@/components/ShareBar";
import AdBanner from "@/components/AdBanner";
import RelatedPosts from "@/components/RelatedPosts";

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

  // Increment view count
  await supabase.from("blogs").update({ views_count: (post.views_count || 0) + 1 }).eq("id", post.id);

  const url = `https://farming-tech.vercel.app/blog/${post.slug}`;

  return (
    <article className="p-4 pb-24 max-w-2xl mx-auto">
      {/* Top Ad Slot */}
      <AdBanner type="native" />

      <p className="text-sm text-green-600 font-semibold mb-2 mt-4">{post.category || "Farming"}</p>
      <h1 className="text-2xl font-bold mb-3 leading-tight">{post.title}</h1>
      
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
        {post.profiles?.avatar_url ? (
           <img src={post.profiles.avatar_url} alt="author" className="w-6 h-6 rounded-full object-cover" />
        ) : (
           <div className="w-6 h-6 rounded-full bg-forest-200 flex items-center justify-center text-[10px] font-bold">
             {(post.profiles?.full_name || "A")?.[0]?.toUpperCase()}
           </div>
        )}
        <span className="font-semibold">{post.profiles?.full_name || "Site Admin"}</span>
        <span>·</span>
        <span>📅 {new Date(post.published_at || post.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</span>
        <span>·</span>
        <span>👁️ {post.views_count || 0}</span>
      </div>
      
      {post.cover_image_url && (
        <img src={post.cover_image_url} alt={post.title} className="w-full h-56 object-cover rounded-2xl mb-4" />
      )}
      
      <ShareBar url={url} title={post.title} />

      <div className="prose prose-sm max-w-none text-gray-800 mt-6" dangerouslySetInnerHTML={{ __html: post.content }} />

      {/* Bottom Ad Slot (High visibility after reading) */}
      <div className="mt-8">
        <AdBanner type="banner-300" />
      </div>

      {/* Related Posts (Keeps them on the site!) */}
      <RelatedPosts category={post.category || ""} currentId={post.id} />
    </article>
  );
}