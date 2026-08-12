import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ShareBar from "@/components/ShareBar";
import AdBanner from "@/components/AdBanner";
import RelatedPosts from "@/components/RelatedPosts";
import BlogComments from "@/components/BlogComments";
import ReadingProgress from "@/components/ReadingProgress";

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
  const author = post.profiles?.full_name || "Site Admin";
  const words = (post.content || "").replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  const readMins = Math.max(1, Math.round(words / 200));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    image: post.cover_image_url ? [post.cover_image_url] : [],
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at || post.published_at || post.created_at,
    author: [{ "@type": "Person", name: author }],
    description: post.seo_description || post.excerpt,
  };

  return (
    <article className="p-4 pb-24 max-w-2xl mx-auto">
      <ReadingProgress />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <AdBanner type="native" />

      <p className="text-sm text-green-600 font-semibold mb-2 mt-4">{post.category || "Farming"}</p>
      <h1 className="text-2xl font-bold mb-3 leading-tight">{post.title}</h1>

      <div className="flex items-center gap-2 text-xs text-gray-500 mb-4 flex-wrap">
        {post.profiles?.avatar_url ? (
          <img src={post.profiles.avatar_url} alt="author" className="w-6 h-6 rounded-full object-cover" />
        ) : (
          <div className="w-6 h-6 rounded-full bg-forest-200 flex items-center justify-center text-[10px] font-bold">
            {author[0]?.toUpperCase()}
          </div>
        )}
        <span className="font-semibold">{author}</span>
        <span>·</span>
        <span>📅 {new Date(post.published_at || post.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</span>
        <span>·</span>
        <span>⏱️ {readMins} min read</span>
        <span>·</span>
        <span>👁️ {post.views_count || 0}</span>
      </div>

      {post.cover_image_url && (
        <img src={post.cover_image_url} alt={post.title} className="w-full h-56 object-cover rounded-2xl mb-4" />
      )}

      <ShareBar url={url} title={post.title} image={post.cover_image_url || undefined} />

      <div className="prose prose-sm max-w-none text-gray-800 mt-6 break-words" dangerouslySetInnerHTML={{ __html: post.content }} />

      <div className="glass-card p-4 rounded-2xl mt-8 flex items-center gap-3">
        {post.profiles?.avatar_url ? (
          <img src={post.profiles.avatar_url} alt={author} className="w-12 h-12 rounded-full object-cover" />        ) : (
          <div className="w-12 h-12 rounded-full bg-forest-200 flex items-center justify-center text-lg font-bold text-forest-800">
            {author[0]?.toUpperCase()}
          </div>
        )}
        <div>
          <p className="font-bold text-sm">✍️ {author}</p>
          <p className="text-xs text-gray-500">Agricultural writer · Farming Tech & Business</p>
        </div>
      </div>

      <div className="mt-6">
        <AdBanner type="banner-300" />
      </div>

      <BlogComments postId={post.id} />

      <RelatedPosts category={post.category || ""} currentId={post.id} />
    </article>
  );
}