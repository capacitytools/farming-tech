import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

const TAGLINE = "🌾 Join, Learn, Grow, Connect & Earn on Farming Tech & Business!";
const BASE = "https://farming-tech.vercel.app";

export async function generateMetadata(props: any): Promise<Metadata> {
  const params = await props.params;
  const supabase = createClient();

  const { data: post } = await supabase.from("feed_posts").select("*, profiles(full_name)").eq("id", params.id).single();
  if (post) {
    const title = `${(post.content || "New post").slice(0, 70)} — ${post.profiles?.full_name || "Farmer"}`;
    return {
      title,
      description: TAGLINE,
      openGraph: {
        title,
        description: TAGLINE,
        images: post.image_url ? [post.image_url] : [`${BASE}/icon-512x512.png`],
        url: `${BASE}/post/${post.id}`,
      },
      twitter: { card: "summary_large_image", title, description: TAGLINE },
    };
  }

  const { data: vid } = await supabase.from("videos").select("*").eq("id", params.id).single();
  if (vid) {
    const title = `🎬 ${vid.title || "Video"} — Farming Tech & Business`;
    return {
      title,
      description: TAGLINE,
      openGraph: {
        title,
        description: TAGLINE,
        images: [`https://i.ytimg.com/vi/${vid.youtube_id}/hqdefault.jpg`],
        url: `${BASE}/post/${vid.id}`,
      },
      twitter: { card: "summary_large_image", title, description: TAGLINE },
    };
  }
  return {};
}

export default async function PostPage(props: any) {
  const params = await props.params;
  const supabase = createClient();

  const { data: post } = await supabase    .from("feed_posts")
    .select("*, profiles(full_name, avatar_url, verified, referral_code)")
    .eq("id", params.id)
    .single();

  const { data: vid } = post ? { data: null } : await supabase
    .from("videos")
    .select("*, profiles(full_name, avatar_url, verified)")
    .eq("id", params.id)
    .single();

  const item: any = post || vid;
  if (!item) return <div className="p-8 text-center text-gray-500">Post not found.</div>;

  const isVideo = !!vid;

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <div className="glass-card p-5 rounded-2xl">
        <div className="flex items-center gap-2 mb-3">
          {item.profiles?.avatar_url ? (
            <img src={item.profiles.avatar_url} className="w-11 h-11 rounded-full object-cover" alt="" />
          ) : (
            <div className="w-11 h-11 rounded-full bg-green-200 flex items-center justify-center font-bold text-green-800">{item.profiles?.full_name?.[0] || "?"}</div>
          )}
          <div>
            <p className="font-bold text-sm">
              {item.profiles?.full_name || "Farmer"} {item.profiles?.verified && <span className="text-sky-500">✅</span>}
            </p>
            <p className="text-[10px] text-gray-400">{new Date(item.created_at).toLocaleDateString()} · Farming Tech & Business</p>
          </div>
        </div>

        {!isVideo && <p className="text-sm text-gray-800 whitespace-pre-line mb-3">{item.content}</p>}
        {!isVideo && item.image_url && <img src={item.image_url} alt="" className="w-full h-72 object-cover rounded-2xl mb-3" />}

        {isVideo && (
          <>
            <iframe
              src={`https://www.youtube.com/embed/${item.youtube_id}${item.start_sec > 0 ? `?start=${item.start_sec}${item.end_sec > item.start_sec ? `&end=${item.end_sec}` : ""}` : ""}`}
              title={item.title || "video"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full aspect-video rounded-2xl bg-black mb-3"
            />
            {item.title && <h1 className="font-bold text-lg mb-1">{item.title}</h1>}
            {item.description && <p className="text-sm text-gray-600 mb-3">{item.description}</p>}
          </>
        )}
      </div>
      {/* BRAND CTA — appears under every shared post */}
      <div className="bg-gradient-to-r from-green-600 to-forest-700 text-white p-5 rounded-2xl text-center mt-4">
        <p className="text-lg font-extrabold mb-1">🌾 Farming Tech & Business</p>
        <p className="text-sm text-green-100 font-bold mb-3">Join · Learn · Grow · Connect · Earn</p>
        <p className="text-[11px] text-green-200 mb-3">AI doctor · tribes · market · e-books · live trainings · get paid for your knowledge!</p>
        <Link href="/login" className="inline-block bg-white text-green-700 px-6 py-2 rounded-xl font-bold text-sm"> Join Free Now</Link>
      </div>
    </div>
  );
}